import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkAuthRole } from '@/app/actions';
import { revalidateTag, revalidatePath } from 'next/cache';
import { 
  normalizeCategorySlug, 
  generateUniqueSlug, 
  generateSeoDefaults 
} from '@/lib/bulk-import-utils';

export const maxDuration = 300; // Allow 5 minutes per batch endpoint execution

/**
 * Download remote image server-side with up to 3 retries and 15s timeout
 */
async function downloadImageWithRetries(url, maxRetries = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const contentType = res.headers.get('content-type') || 'image/jpeg';
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length === 0) {
        throw new Error('Downloaded buffer is empty (0 bytes)');
      }

      let ext = 'jpg';
      if (contentType.includes('png')) ext = 'png';
      else if (contentType.includes('webp')) ext = 'webp';
      else if (contentType.includes('gif')) ext = 'gif';
      else if (url.toLowerCase().includes('.png')) ext = 'png';
      else if (url.toLowerCase().includes('.webp')) ext = 'webp';

      return { buffer, contentType, ext };
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, attempt * 500));
      }
    }
  }
  throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message || 'Download error'}`);
}

export async function POST(request) {
  try {
    // 1. Enforce strict Admin Role Authorization
    const adminUser = await checkAuthRole(['super_admin', 'admin', 'manager', 'content_editor']);
    const supabase = createAdminClient();

    const body = await request.json();
    const { action } = body;

    // --- ACTION 1: INIT SESSION ---
    if (action === 'init') {
      const { csv_file_name, csv_hash, total_rows, inventory_mode, is_dry_run, batch_size } = body;

      let sessionId = 0;

      // Ensure uploads bucket exists
      await supabase.storage.createBucket('uploads', { public: true }).catch(() => {});

      if (!is_dry_run) {
        // Save session record
        const { data: sessionData, error: sessionErr } = await supabase
          .from('import_sessions')
          .insert({
            admin_email: adminUser.email,
            csv_file_path: csv_file_name || 'uploaded_catalog.xlsx',
            csv_hash: csv_hash || null,
            inventory_mode: inventory_mode || 'update',
            is_dry_run: is_dry_run ? 1 : 0,
            status: 'processing',
            total_rows: total_rows || 0,
            batch_size: batch_size || 25
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
        if (c.slug) categoriesMap.set(normalizeCategorySlug(c.slug), c.id);
        if (c.name) {
          categoriesMap.set(normalizeCategorySlug(c.name), c.id);
          categoriesMap.set(c.name.trim().toLowerCase(), c.id);
        }
      });

      const existingDbSkusSet = new Set();
      const existingDbSlugsSet = new Set();

      (productsData || []).forEach(p => {
        if (p.sku) existingDbSkusSet.add(p.sku.toLowerCase().trim());
        if (p.slug) existingDbSlugsSet.add(p.slug.toLowerCase().trim());
      });

      return NextResponse.json({
        success: true,
        sessionId,
        categoriesMap: Object.fromEntries(categoriesMap),
        existingDbSkus: Array.from(existingDbSkusSet),
        existingDbSlugs: Array.from(existingDbSlugsSet)
      });
    }

    // --- ACTION: UPLOAD SINGLE IMAGE (Legacy / File Upload) ---
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
      const imageFailures = [];
      let totalImagesProcessed = 0;
      let totalImagesFailed = 0;
      const touchedProductIds = new Set();

      // Pre-fetch categories & existing products for this batch
      const [{ data: categoriesData }, { data: productsData }] = await Promise.all([
        supabase.from('categories').select('id, name, slug'),
        supabase.from('products').select('*')
      ]);

      const categoriesMap = new Map();
      (categoriesData || []).forEach(c => {
        if (c.slug) categoriesMap.set(normalizeCategorySlug(c.slug), c.id);
        if (c.name) {
          categoriesMap.set(normalizeCategorySlug(c.name), c.id);
          categoriesMap.set(c.name.trim().toLowerCase(), c.id);
        }
      });

      const existingProductsBySku = new Map();
      const existingSlugsSet = new Set();
      (productsData || []).forEach(p => {
        if (p.sku) existingProductsBySku.set(p.sku.toLowerCase().trim(), p);
        if (p.slug) existingSlugsSet.add(p.slug.toLowerCase().trim());
      });

      // Process each row atomically
      for (const item of rows) {
        const { rowIndex, data: prodData } = item;
        let rowStatus = 'success';
        let rowMessage = 'Imported successfully';
        let productId = null;
        let actionType = 'created';
        let productImagesUploaded = [];

        try {
          if (is_dry_run) {
            results.push({
              rowIndex,
              sku: prodData.sku,
              name: prodData.name,
              category_slug: prodData.category_slug,
              status: 'Validated (Dry Run)',
              hasImage: Boolean(prodData.primaryCoverUrl || (prodData.additionalThumbnailUrls && prodData.additionalThumbnailUrls.length > 0))
            });
            continue;
          }

          // 1. Resolve Category ID
          let categoryId = null;
          if (prodData.category_slug) {
            const normalizedCat = normalizeCategorySlug(prodData.category_slug);
            if (categoriesMap.has(normalizedCat)) {
              categoryId = categoriesMap.get(normalizedCat);
            } else if (prodData.category_raw && categoriesMap.has(normalizeCategorySlug(prodData.category_raw))) {
              categoryId = categoriesMap.get(normalizeCategorySlug(prodData.category_raw));
            }
          }

          // 2. Format tags as JSON string
          let tagsJson = '[]';
          if (prodData.tags) {
            const tagList = Array.isArray(prodData.tags)
              ? prodData.tags
              : String(prodData.tags).split(',').map(t => t.trim()).filter(Boolean);
            tagsJson = JSON.stringify(tagList);
          }

          // 3. Check if product SKU exists in DB
          const skuKey = prodData.sku ? prodData.sku.toLowerCase().trim() : '';
          const existingProd = skuKey ? existingProductsBySku.get(skuKey) : null;

          if (existingProd) {
            if (inventory_mode === 'skip') {
              results.push({
                rowIndex,
                sku: prodData.sku,
                name: prodData.name,
                status: 'Skipped (Existing SKU)',
                message: `Product SKU '${prodData.sku}' already exists in database.`
              });
              continue;
            }

            // Update or Replace Mode
            productId = existingProd.id;
            actionType = inventory_mode === 'replace' ? 'replaced' : 'updated';

            // Prepare updated fields (preserve existing if replacement is empty)
            const updatePayload = {
              name: prodData.name || existingProd.name,
              price: prodData.price > 0 ? prodData.price : existingProd.price,
              discount_price: prodData.discount_price !== undefined ? prodData.discount_price : existingProd.discount_price,
              stock_quantity: prodData.stock_quantity >= 0 ? prodData.stock_quantity : existingProd.stock_quantity,
              category_id: categoryId || existingProd.category_id,
              description: prodData.description || existingProd.description,
              short_description: prodData.short_description || existingProd.short_description,
              material: prodData.material || existingProd.material,
              dimensions: prodData.dimensions || existingProd.dimensions,
              weight: prodData.weight !== null ? prodData.weight : existingProd.weight,
              finish_type: prodData.finish_type || existingProd.finish_type,
              customization_option: prodData.customization_option || existingProd.customization_option,
              bulk_pricing: prodData.bulk_pricing || existingProd.bulk_pricing,
              variants: prodData.variants || existingProd.variants,
              related_products: prodData.related_products || existingProd.related_products,
              is_bestseller: prodData.is_bestseller !== undefined ? prodData.is_bestseller : existingProd.is_bestseller,
              is_new_arrival: prodData.is_new_arrival !== undefined ? prodData.is_new_arrival : existingProd.is_new_arrival,
              is_featured: prodData.is_featured !== undefined ? prodData.is_featured : existingProd.is_featured,
              video_url: prodData.video_url || existingProd.video_url,
              seo_title: prodData.seo_title || existingProd.seo_title,
              seo_description: prodData.seo_description || existingProd.seo_description,
              is_published: prodData.is_published !== undefined ? prodData.is_published : existingProd.is_published,
              tags: tagsJson !== '[]' ? tagsJson : existingProd.tags
            };

            const { error: updateErr } = await supabase
              .from('products')
              .update(updatePayload)
              .eq('id', productId);

            if (updateErr) throw updateErr;

            // Save snapshot for rollback
            if (sessionId) {
              await supabase.from('import_products').insert({
                import_session_id: sessionId,
                product_id: productId,
                action_type: actionType,
                snapshot_file_path: JSON.stringify(existingProd)
              });
            }

            rowStatus = inventory_mode === 'replace' ? 'Replaced' : 'Updated';
            rowMessage = `Product updated successfully.`;
          } else {
            // Create New Product
            const uniqueSlug = generateUniqueSlug(prodData.name, existingSlugsSet);
            const seo = generateSeoDefaults(prodData.name, prodData.description);

            const { data: newProd, error: insertErr } = await supabase
              .from('products')
              .insert({
                name: prodData.name,
                slug: uniqueSlug,
                sku: prodData.sku || null,
                price: prodData.price,
                discount_price: prodData.discount_price,
                stock_quantity: prodData.stock_quantity,
                category_id: categoryId,
                description: prodData.description || '',
                short_description: prodData.short_description || '',
                material: prodData.material || '',
                dimensions: prodData.dimensions || '',
                weight: prodData.weight,
                finish_type: prodData.finish_type || '',
                customization_option: prodData.customization_option || '',
                bulk_pricing: prodData.bulk_pricing || '',
                variants: prodData.variants || '',
                related_products: prodData.related_products || '',
                is_bestseller: prodData.is_bestseller || 0,
                is_new_arrival: prodData.is_new_arrival || 0,
                is_featured: prodData.is_featured || 0,
                video_url: prodData.video_url || '',
                seo_title: prodData.seo_title || seo.seo_title,
                seo_description: prodData.seo_description || seo.seo_description,
                is_published: prodData.is_published !== undefined ? prodData.is_published : 1,
                tags: tagsJson
              })
              .select('id')
              .single();

            if (insertErr) throw insertErr;
            productId = newProd.id;
            actionType = 'created';

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

          // 4. Download and Upload Images to Supabase Storage: products/{SKU}/{index}.jpg
          const cleanSku = (prodData.sku || `PROD-${productId}`).replace(/[^a-zA-Z0-9_-]/g, '_');
          const imagesToUpload = [];

          // Primary Cover Photo
          if (prodData.primaryCoverUrl) {
            imagesToUpload.push({
              url: prodData.primaryCoverUrl,
              index: 1,
              is_primary: 1
            });
          }

          // Additional Thumbnails
          if (Array.isArray(prodData.additionalThumbnailUrls)) {
            prodData.additionalThumbnailUrls.forEach((thumbUrl, idx) => {
              if (thumbUrl && thumbUrl !== prodData.primaryCoverUrl) {
                imagesToUpload.push({
                  url: thumbUrl,
                  index: imagesToUpload.length + 1,
                  is_primary: 0
                });
              }
            });
          }

          if (imagesToUpload.length > 0) {
            // If replace mode, clear existing images
            if (inventory_mode === 'replace' && existingProd) {
              await supabase.from('product_images').delete().eq('product_id', productId);
            }

            let firstUploaded = true;
            for (const imgItem of imagesToUpload) {
              totalImagesProcessed++;
              try {
                const { buffer, contentType, ext } = await downloadImageWithRetries(imgItem.url, 3);
                const storagePath = `products/${cleanSku}/${imgItem.index}.${ext}`;

                const { error: upErr } = await supabase.storage
                  .from('uploads')
                  .upload(storagePath, buffer, {
                    contentType,
                    upsert: true
                  });

                if (upErr) throw upErr;

                const { data: pubData } = supabase.storage
                  .from('uploads')
                  .getPublicUrl(storagePath);

                const publicUrl = pubData.publicUrl;

                // Determine is_primary: 1 for first successfully uploaded image
                const isPrimaryFlag = firstUploaded ? 1 : 0;
                if (firstUploaded) {
                  // Disable previous primary if updating
                  if (existingProd) {
                    await supabase.from('product_images').update({ is_primary: 0 }).eq('product_id', productId);
                  }
                  firstUploaded = false;
                }

                await supabase.from('product_images').insert({
                  product_id: productId,
                  image_path: publicUrl,
                  is_primary: isPrimaryFlag
                });

                productImagesUploaded.push({
                  url: publicUrl,
                  storagePath,
                  is_primary: isPrimaryFlag
                });

              } catch (imgErr) {
                totalImagesFailed++;
                console.error(`[Image Download/Upload Error] SKU ${prodData.sku}, URL: ${imgItem.url}:`, imgErr.message);
                imageFailures.push({
                  sku: prodData.sku,
                  name: prodData.name,
                  url: imgItem.url,
                  reason: imgErr.message
                });
                // Continue with next image — do not fail the complete product!
              }
            }
          }

          results.push({
            rowIndex,
            sku: prodData.sku,
            name: prodData.name,
            status: rowStatus,
            message: rowMessage,
            hasImage: productImagesUploaded.length > 0,
            imagesUploadedCount: productImagesUploaded.length
          });

        } catch (err) {
          console.error(`[BulkImport Row Error] Row ${rowIndex} (${prodData.sku}):`, err);
          results.push({
            rowIndex,
            sku: prodData.sku,
            name: prodData.name,
            status: 'Failed',
            message: err.message || 'Row processing failed.'
          });
        }
      }

      // 5. Update session progress counters
      if (sessionId && !is_dry_run) {
        const successCount = results.filter(r => r.status === 'Created' || r.status === 'Updated' || r.status === 'Replaced').length;
        const failedCount = results.filter(r => r.status === 'Failed').length;
        const duplicateCount = results.filter(r => r.status.includes('Skipped')).length;
        const missingImagesCount = results.filter(r => !r.hasImage).length;

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
      revalidateTag('categories');

      return NextResponse.json({
        success: true,
        batchResults: results,
        imageFailures,
        totalImagesProcessed,
        totalImagesFailed
      });
    }

    // --- ACTION 3: FINISH SESSION ---
    if (action === 'finish') {
      const { sessionId, duration_ms, reportCsvContent } = body;

      if (sessionId && reportCsvContent) {
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
      revalidatePath('/shop');
      revalidatePath('/collections');
      revalidatePath('/');

      return NextResponse.json({ success: true, message: 'Import session completed.' });
    }

    return NextResponse.json({ success: false, message: 'Invalid action parameter.' }, { status: 400 });

  } catch (err) {
    console.error('[BulkImport Route Exception]', err);
    return NextResponse.json({ success: false, message: err.message || 'Internal server error' }, { status: 500 });
  }
}
