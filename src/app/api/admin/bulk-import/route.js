import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkAuthRole } from '@/app/actions';
import { revalidateTag, revalidatePath } from 'next/cache';
import { 
  normalizeCategorySlug, 
  formatCategoryTitle, 
  generateUniqueSlug, 
  generateSeoDefaults 
} from '@/lib/bulk-import-utils';

export const maxDuration = 300; // Allow 5 minutes per batch endpoint execution

export async function POST(request) {
  try {
    // 1. Enforce strict Admin Role Authorization
    const adminUser = await checkAuthRole(['super_admin', 'admin']);
    const supabase = createAdminClient();

    const body = await request.json();
    const { action } = body;

    // --- ACTION 1: INIT SESSION ---
    if (action === 'init') {
      const { csv_file_name, csv_hash, total_rows, inventory_mode, is_dry_run, batch_size } = body;

      let sessionId = 0;
      let csvFilePath = 'in_memory';

      if (!is_dry_run) {
        // Ensure uploads bucket exists
        await supabase.storage.createBucket('uploads', { public: true }).catch(() => {});

        // Save session record
        const { data: sessionData, error: sessionErr } = await supabase
          .from('import_sessions')
          .insert({
            admin_email: adminUser.email,
            csv_file_path: csv_file_name || 'uploaded_csv.csv',
            csv_hash: csv_hash || null,
            inventory_mode: inventory_mode || 'skip',
            is_dry_run: is_dry_run ? 1 : 0,
            status: 'processing',
            total_rows: total_rows || 0,
            batch_size: batch_size || 50
          })
          .select('id')
          .single();

        if (sessionErr) throw sessionErr;
        sessionId = sessionData.id;
      }

      // Fetch existing DB categories and SKUs for fast in-memory validation
      const [{ data: categoriesData }, { data: productsData }] = await Promise.all([
        supabase.from('categories').select('id, name, slug'),
        supabase.from('products').select('id, sku, slug')
      ]);

      const categoriesMap = new Map();
      (categoriesData || []).forEach(c => {
        categoriesMap.set(normalizeCategorySlug(c.slug), c.id);
        categoriesMap.set(normalizeCategorySlug(c.name), c.id);
      });

      const existingDbSkusSet = new Set();
      const existingDbSlugsSet = new Set();

      (productsData || []).forEach(p => {
        if (p.sku) existingDbSkusSet.add(p.sku.toLowerCase());
        if (p.slug) existingDbSlugsSet.add(p.slug.toLowerCase());
      });

      return NextResponse.json({
        success: true,
        sessionId,
        categoriesMap: Object.fromEntries(categoriesMap),
        existingDbSkus: Array.from(existingDbSkusSet),
        existingDbSlugs: Array.from(existingDbSlugsSet)
      });
    }

    // --- ACTION: UPLOAD SINGLE IMAGE ---
    if (action === 'upload_image') {
      const { filename, base64Data, mimeType } = body;
      if (!filename || !base64Data) {
        return NextResponse.json({ success: false, message: 'Missing filename or base64 image data.' }, { status: 400 });
      }

      await supabase.storage.createBucket('uploads', { public: true }).catch(() => {});

      const fileExt = filename.split('.').pop() || 'jpg';
      const cleanFileName = `products/import-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const buffer = Buffer.from(base64Data, 'base64');

      const { error: uploadErr } = await supabase.storage
        .from('uploads')
        .upload(cleanFileName, buffer, {
          contentType: mimeType || `image/${fileExt}`,
          upsert: true
        });

      if (uploadErr) {
        console.error('[Upload Image Storage Error]', uploadErr);
        return NextResponse.json({ success: false, message: 'Failed to upload image to Supabase Storage: ' + uploadErr.message }, { status: 500 });
      }

      const { data: publicUrlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(cleanFileName);

      return NextResponse.json({
        success: true,
        publicUrl: publicUrlData?.publicUrl || ''
      });
    }

    // --- ACTION 2: PROCESS BATCH ---
    if (action === 'process_batch') {
      const { sessionId, inventory_mode, is_dry_run, rows } = body;

      if (!Array.isArray(rows)) {
        return NextResponse.json({ success: false, message: 'Invalid rows array payload.' }, { status: 400 });
      }

      const results = [];
      const createdCategoryIds = new Set();
      const touchedProductIds = new Set();

      // Pre-fetch categories & existing products for this batch
      const [{ data: categoriesData }, { data: productsData }] = await Promise.all([
        supabase.from('categories').select('id, name, slug'),
        supabase.from('products').select('id, name, sku, slug, price, discount_price, stock_quantity, description, tags, category_id')
      ]);

      const categoriesMap = new Map();
      (categoriesData || []).forEach(c => {
        categoriesMap.set(normalizeCategorySlug(c.slug), c.id);
        categoriesMap.set(normalizeCategorySlug(c.name), c.id);
      });

      const existingProductsBySku = new Map();
      const existingSlugsSet = new Set();
      (productsData || []).forEach(p => {
        if (p.sku) existingProductsBySku.set(p.sku.toLowerCase(), p);
        if (p.slug) existingSlugsSet.add(p.slug.toLowerCase());
      });

      // Process each row atomically
      for (const item of rows) {
        const { rowIndex, data: prodData, imageUrls } = item;
        let rowStatus = 'success';
        let rowMessage = 'Imported successfully';
        let productId = null;
        let actionType = 'created';

        try {
          if (is_dry_run) {
            results.push({
              rowIndex,
              sku: prodData.sku,
              name: prodData.name,
              category_slug: prodData.category_slug,
              status: 'Validated (Dry Run)',
              hasImage: Boolean(imageUrls && imageUrls.length > 0)
            });
            continue;
          }

          // 1. Resolve Category ID (Auto-create if missing)
          let categoryId = null;
          if (prodData.category_slug) {
            const normalizedCat = normalizeCategorySlug(prodData.category_slug);
            if (categoriesMap.has(normalizedCat)) {
              categoryId = categoriesMap.get(normalizedCat);
            } else {
              // Create category dynamically
              const categoryTitle = formatCategoryTitle(normalizedCat);
              const { data: newCat, error: catErr } = await supabase
                .from('categories')
                .insert({
                  name: categoryTitle,
                  slug: normalizedCat
                })
                .select('id')
                .single();

              if (!catErr && newCat) {
                categoryId = newCat.id;
                categoriesMap.set(normalizedCat, newCat.id);
                createdCategoryIds.add(newCat.id);
              }
            }
          }

          // 2. Check if product SKU exists in DB
          const existingProd = prodData.sku ? existingProductsBySku.get(prodData.sku.toLowerCase()) : null;

          if (existingProd) {
            if (inventory_mode === 'skip') {
              results.push({
                rowIndex,
                sku: prodData.sku,
                name: prodData.name,
                status: 'Skipped (Existing SKU)',
                message: `Product SKU '${prodData.sku}' already exists.`
              });
              continue;
            }

            // Update or Replace Mode
            productId = existingProd.id;
            actionType = inventory_mode === 'replace' ? 'replaced' : 'updated';

            const previousDataJson = JSON.stringify(existingProd);

            // Update product fields
            const updatePayload = {
              name: prodData.name || existingProd.name,
              price: prodData.price > 0 ? prodData.price : existingProd.price,
              discount_price: prodData.discount_price !== undefined ? prodData.discount_price : existingProd.discount_price,
              stock_quantity: prodData.stock_quantity >= 0 ? prodData.stock_quantity : existingProd.stock_quantity,
              description: prodData.description || existingProd.description,
              tags: prodData.tags ? JSON.stringify(prodData.tags.split(',').map(t => t.trim())) : existingProd.tags,
              category_id: categoryId || existingProd.category_id
            };

            const { error: updateErr } = await supabase
              .from('products')
              .update(updatePayload)
              .eq('id', productId);

            if (updateErr) throw updateErr;

            if (inventory_mode === 'replace') {
              // Delete existing images for replacement
              await supabase.from('product_images').delete().eq('product_id', productId);
            }

            // Save snapshot JSON to Supabase Storage (not in DB)
            let snapshotFilePath = null;
            if (sessionId) {
              try {
                const snapshotFileName = `imports/snapshots/snapshot_${sessionId}_${productId}_${Date.now()}.json`;
                const snapshotBuffer = Buffer.from(JSON.stringify(existingProd), 'utf-8');
                await supabase.storage
                  .from('uploads')
                  .upload(snapshotFileName, snapshotBuffer, { contentType: 'application/json', upsert: true });

                const { data: snapUrlData } = supabase.storage
                  .from('uploads')
                  .getPublicUrl(snapshotFileName);
                snapshotFilePath = snapUrlData?.publicUrl || snapshotFileName;
              } catch (snapErr) {
                console.error('[Snapshot Upload Storage Warning]', snapErr);
              }

              await supabase.from('import_products').insert({
                import_session_id: sessionId,
                product_id: productId,
                action_type: actionType,
                snapshot_file_path: snapshotFilePath
              });
            }

            rowStatus = inventory_mode === 'replace' ? 'Replaced' : 'Updated';
            rowMessage = `Product updated successfully.`;
          } else {
            // New Product Creation
            const uniqueSlug = generateUniqueSlug(prodData.name, existingSlugsSet);
            const seo = generateSeoDefaults(prodData.name, prodData.description);
            const tagsArray = prodData.tags ? prodData.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

            const { data: newProd, error: insertErr } = await supabase
              .from('products')
              .insert({
                name: prodData.name,
                slug: uniqueSlug,
                description: prodData.description || '',
                category_id: categoryId,
                price: prodData.price,
                discount_price: prodData.discount_price,
                sku: prodData.sku || null,
                stock_quantity: prodData.stock_quantity,
                is_published: 1,
                tags: JSON.stringify(tagsArray),
                seo_title: seo.seo_title,
                seo_description: seo.seo_description
              })
              .select('id')
              .single();

            if (insertErr) throw insertErr;
            productId = newProd.id;
            actionType = 'created';

            // Log mapping in import_products
            if (sessionId) {
              await supabase.from('import_products').insert({
                import_session_id: sessionId,
                product_id: productId,
                action_type: 'created'
              });
            }

            rowStatus = 'Created';
            rowMessage = 'New product imported successfully.';
          }

          touchedProductIds.add(productId);

          // 3. Attach Pre-uploaded Storage Image URLs (Pure Text References)
          const preUploadedUrls = item.imageUrls || [];
          if (productId && Array.isArray(preUploadedUrls) && preUploadedUrls.length > 0) {
            for (const imgObj of preUploadedUrls) {
              if (imgObj.image_path) {
                await supabase.from('product_images').insert({
                  product_id: productId,
                  image_path: imgObj.image_path,
                  is_primary: imgObj.is_primary ? 1 : 0
                });
              }
            }
          }

          results.push({
            rowIndex,
            sku: prodData.sku,
            name: prodData.name,
            status: rowStatus,
            message: rowMessage,
            hasImage: Boolean(imageReferences && imageReferences.length > 0)
          });

        } catch (err) {
          console.error(`[BulkImport Row Error] Row ${rowIndex}:`, err);
          results.push({
            rowIndex,
            sku: prodData.sku,
            name: prodData.name,
            status: 'Failed',
            message: err.message || 'Row processing failed.'
          });
        }
      }

      // 4. Update session progress counters
      if (sessionId && !is_dry_run) {
        const successCount = results.filter(r => r.status === 'Created' || r.status === 'Updated' || r.status === 'Replaced').length;
        const failedCount = results.filter(r => r.status === 'Failed').length;
        const duplicateCount = results.filter(r => r.status.includes('Skipped')).length;
        const missingImagesCount = results.filter(r => !r.hasImage).length;

        // Perform increment update
        const { data: currentSession } = await supabase
          .from('import_sessions')
          .select('processed_rows, success_count, failed_count, duplicate_count, missing_images_count')
          .eq('id', sessionId)
          .single();

        if (currentSession) {
          await supabase
            .from('import_sessions')
            .update({
              processed_rows: (currentSession.processed_rows || 0) + rows.length,
              success_count: (currentSession.success_count || 0) + successCount,
              failed_count: (currentSession.failed_count || 0) + failedCount,
              duplicate_count: (currentSession.duplicate_count || 0) + duplicateCount,
              missing_images_count: (currentSession.missing_images_count || 0) + missingImagesCount,
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionId);
        }
      }

      // Granular Cache Revalidation
      revalidateTag('products');
      if (createdCategoryIds.size > 0) {
        revalidateTag('categories');
      }

      return NextResponse.json({
        success: true,
        batchResults: results
      });
    }

    // --- ACTION 3: FINISH SESSION ---
    if (action === 'finish') {
      const { sessionId, duration_ms, reportCsvContent } = body;

      if (sessionId && reportCsvContent) {
        // Upload Error Report CSV to Supabase Storage
        const reportFileName = `imports/reports/report_session_${sessionId}_${Date.now()}.csv`;
        const buffer = Buffer.from(reportCsvContent, 'utf-8');

        await supabase.storage
          .from('uploads')
          .upload(reportFileName, buffer, { contentType: 'text/csv', upsert: true });

        const { data: reportUrlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(reportFileName);

        await supabase
          .from('import_sessions')
          .update({
            status: 'completed',
            report_file_path: reportUrlData?.publicUrl || reportFileName,
            duration_ms: duration_ms || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
      }

      // Targeted cache revalidation
      revalidateTag('products');
      revalidateTag('categories');
      revalidatePath('/admin/products');

      return NextResponse.json({ success: true, message: 'Import session completed.' });
    }

    return NextResponse.json({ success: false, message: 'Invalid action parameter.' }, { status: 400 });

  } catch (err) {
    console.error('[BulkImport Route Exception]', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal server error' }, { status: 500 });
  }
}
