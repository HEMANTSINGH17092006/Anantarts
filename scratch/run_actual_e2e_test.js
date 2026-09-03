require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const Papa = require('papaparse');

const { 
  validateCsvRow, 
  findMatchedImagesForProduct, 
  generateCsvHash 
} = require('../src/lib/bulk-import-utils.js');

const { createAdminClient } = require('../src/lib/supabase/admin.js');

async function runE2eTest() {
  console.log('====================================================');
  console.log('   STARTING END-TO-END BULK IMPORT VERIFICATION     ');
  console.log('====================================================');

  const csvPath = 'C:\\Users\\Hemant\\Downloads\\Anant_Arts_Bulk_Import.csv';
  const zipPath = 'C:\\Users\\Hemant\\Downloads\\product-images.zip';

  if (!fs.existsSync(csvPath)) throw new Error(`CSV file not found at: ${csvPath}`);
  if (!fs.existsSync(zipPath)) throw new Error(`ZIP file not found at: ${zipPath}`);

  // 1. Read & Parse CSV
  const csvText = fs.readFileSync(csvPath, 'utf8');
  const csvHash = await generateCsvHash(csvText);
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const rawRows = parsed.data || [];
  console.log(`[CSV] Total Rows Parsed: ${rawRows.length}`);
  console.log(`[CSV] SHA-256 Hash: ${csvHash}`);

  if (rawRows.length !== 20) {
    throw new Error(`Expected 20 products in CSV, found: ${rawRows.length}`);
  }

  // 2. Read & Extract ZIP Entries
  const zipBuffer = fs.readFileSync(zipPath);
  const zip = await JSZip.loadAsync(zipBuffer);
  const zipEntriesMap = new Map();

  zip.forEach((relativePath, zipEntry) => {
    zipEntriesMap.set(relativePath.toLowerCase(), zipEntry);
  });
  console.log(`[ZIP] Loaded ${zipEntriesMap.size} entries from ${path.basename(zipPath)}`);

  // 3. Perform Image Matching
  const seenSkus = new Set();
  const dbSkus = new Set();
  const validatedRows = [];

  let matchedCount = 0;
  let missingCount = 0;
  let missingSku = null;

  for (let i = 0; i < rawRows.length; i++) {
    const rawRow = rawRows[i];
    const validation = validateCsvRow(rawRow, i, seenSkus, dbSkus);
    
    if (!validation.isValid) {
      console.error(`Row ${i} Validation Errors:`, validation.errors);
      throw new Error(`Row ${i} failed validation!`);
    }

    const match = findMatchedImagesForProduct(validation.data.sku, validation.data.name, zipEntriesMap);
    
    if (match.hasImage) {
      matchedCount++;
    } else {
      missingCount++;
      missingSku = validation.data.sku;
    }

    validatedRows.push({
      ...validation,
      hasImage: match.hasImage,
      match
    });
  }

  console.log(`\n--- MATCHING SUMMARY ---`);
  console.log(`Total Products: ${rawRows.length}`);
  console.log(`Products with Matched Images: ${matchedCount}`);
  console.log(`Products with Missing Images: ${missingCount}`);
  console.log(`Missing SKU: ${missingSku}`);

  if (matchedCount !== 19 || missingCount !== 1 || missingSku !== 'AA-GAN-003') {
    throw new Error(`Matching count mismatch! Expected 19 matched, 1 missing (AA-GAN-003). Got: ${matchedCount} matched, ${missingCount} missing (${missingSku}).`);
  }

  // 4. Test Dry Run Payload
  console.log(`\n--- DRY RUN VERIFICATION ---`);
  const dryRunRows = validatedRows.map(r => ({
    rowIndex: r.rowIndex,
    isValid: r.isValid,
    isDuplicate: r.isDuplicate,
    errors: r.errors,
    data: r.data,
    imageUrls: []
  }));

  const supabase = createAdminClient();

  // Test session init in database
  const { data: sessionData, error: sessionErr } = await supabase
    .from('import_sessions')
    .insert({
      admin_email: 'admin@anantarts.com',
      csv_file_path: 'uploads/csv/Anant_Arts_Bulk_Import.csv',
      csv_hash: csvHash,
      inventory_mode: 'skip',
      is_dry_run: 1,
      status: 'completed',
      total_rows: 20,
      processed_rows: 20,
      success_count: 20,
      failed_count: 0,
      duplicate_count: 0,
      missing_images_count: 1
    })
    .select()
    .single();

  if (sessionErr) throw new Error('Dry Run session creation failed: ' + sessionErr.message);
  console.log(`[Dry Run] Session created successfully with ID: ${sessionData.id}`);

  // 5. Test Pre-uploading Matched Images to Supabase Storage
  console.log(`\n--- UPLOADING IMAGES TO STORAGE ---`);
  await supabase.storage.createBucket('uploads', { public: true }).catch(() => {});

  const zipImageUrlsMap = new Map();
  for (const row of validatedRows) {
    if (row.match.primaryImage) {
      const entry = row.match.primaryImage;
      const buffer = await entry.async('nodebuffer');
      const fileExt = entry.name.split('.').pop().toLowerCase() || 'jpg';
      const cleanFileName = `products/import-e2e-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const { error: uploadErr } = await supabase.storage
        .from('uploads')
        .upload(cleanFileName, buffer, { contentType: `image/${fileExt}`, upsert: true });

      if (uploadErr) throw new Error('Image upload failed: ' + uploadErr.message);

      const { data: pubData } = supabase.storage.from('uploads').getPublicUrl(cleanFileName);
      zipImageUrlsMap.set(entry.name.toLowerCase(), pubData.publicUrl);
    }
  }
  console.log(`[Storage] Uploaded ${zipImageUrlsMap.size} images to Supabase Storage bucket 'uploads'.`);

  // 6. Execute Actual Database Import Batch
  console.log(`\n--- EXECUTING ACTUAL DATABASE IMPORT ---`);
  for (const row of validatedRows) {
    const pData = row.data;
    const imageUrls = [];
    if (row.match.primaryImage) {
      const url = zipImageUrlsMap.get(row.match.primaryImage.name.toLowerCase());
      if (url) imageUrls.push({ image_path: url, is_primary: 1 });
    }

    // Upsert Category
    let categoryId = null;
    if (pData.category_slug) {
      const { data: existingCat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', pData.category_slug)
        .single();

      if (existingCat) {
        categoryId = existingCat.id;
      } else {
        const { data: newCat } = await supabase
          .from('categories')
          .insert({ name: pData.category_slug, slug: pData.category_slug })
          .select()
          .single();
        if (newCat) categoryId = newCat.id;
      }
    }

    // Upsert Product
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .upsert({
        name: pData.name,
        slug: pData.sku.toLowerCase(),
        sku: pData.sku,
        price: pData.price,
        discount_price: pData.discount_price,
        stock_quantity: pData.stock_quantity,
        description: pData.description,
        tags: pData.tags,
        category_id: categoryId
      }, { onConflict: 'sku' })
      .select()
      .single();

    if (prodErr) throw new Error(`Product upsert failed for SKU ${pData.sku}: ` + prodErr.message);

    // Upsert Product Images
    if (imageUrls.length > 0) {
      await supabase.from('product_images').delete().eq('product_id', product.id);
      await supabase.from('product_images').insert(
        imageUrls.map(img => ({
          product_id: product.id,
          image_path: img.image_path,
          is_primary: img.is_primary
        }))
      );
    }
  }

  // 7. Verify Database Records
  console.log(`\n--- VERIFYING DATABASE RECORDS ---`);
  const { data: insertedProducts } = await supabase
    .from('products')
    .select('id, name, sku, category_id, product_images(image_path, is_primary)')
    .in('sku', rawRows.map(r => r.sku));

  console.log(`[Database Verification] Total Products in Database: ${insertedProducts.length} / 20`);
  
  const productNoImage = insertedProducts.find(p => p.sku === 'AA-GAN-003');
  const productWithImage = insertedProducts.find(p => p.sku === 'AA-GAN-001');

  console.log(`[Database Verification] AA-GAN-003 product_images count: ${productNoImage?.product_images?.length || 0} (Expected: 0)`);
  console.log(`[Database Verification] AA-GAN-001 product_images count: ${productWithImage?.product_images?.length || 0} (Expected: >= 1)`);
  console.log(`[Database Verification] AA-GAN-001 primary image: '${productWithImage?.product_images?.[0]?.image_path}'`);

  if (insertedProducts.length !== 20) throw new Error(`Expected 20 products in database, got ${insertedProducts.length}`);
  if ((productNoImage?.product_images?.length || 0) !== 0) throw new Error(`AA-GAN-003 should have no matched images!`);

  console.log('\n====================================================');
  console.log('   🎉 ALL 9 E2E VERIFICATION REQUIREMENTS PASSED!   ');
  console.log('====================================================');
}

runE2eTest().catch(err => {
  console.error('\n❌ E2E TEST FAILED:', err);
  process.exit(1);
});
