import { slugify } from './utils';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Generate SHA-256 Hash of content string for Idempotency tracking
 */
export async function generateCsvHash(content) {
  if (!content) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Smart Category Normalizer
 * Example: 'ganesha-idols', 'Ganesha Idols', 'Home Décor' -> 'home-decor'
 */
export function normalizeCategorySlug(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD') // normalize accented characters like é -> e
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');
}

/**
 * Title Case formatting for category creation
 */
export function formatCategoryTitle(slug) {
  if (!slug) return 'Uncategorized';
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * SEO & Slug Generator with collision avoidance
 */
export function generateUniqueSlug(productName, existingSlugsSet = new Set()) {
  const baseSlug = slugify(productName) || 'product';
  let candidateSlug = baseSlug;
  let counter = 1;

  while (existingSlugsSet.has(candidateSlug)) {
    candidateSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  existingSlugsSet.add(candidateSlug);
  return candidateSlug;
}

/**
 * Auto SEO Metadata Defaults
 */
export function generateSeoDefaults(productName, description = '') {
  const cleanName = productName ? productName.trim() : 'Artisan Product';
  const cleanDesc = description ? description.replace(/<[^>]*>?/gm, '').trim() : '';

  const seo_title = `${cleanName} | Anant Arts`;
  const seo_description = cleanDesc.length > 0
    ? cleanDesc.slice(0, 155) + (cleanDesc.length > 155 ? '...' : '')
    : `${cleanName} - Handcrafted divine spiritual art & luxury décor by Anant Arts.`;
  const alt_text = `${cleanName} - Handcrafted Fine Art by Anant Arts`;

  return { seo_title, seo_description, alt_text };
}

/**
 * Parse boolean values from Excel (e.g. true, "TRUE", "yes", 1)
 */
export function parseBooleanFlag(val, defaultVal = false) {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  const str = String(val).trim().toLowerCase();
  if (str === 'true' || str === '1' || str === 'yes' || str === 'y') return true;
  if (str === 'false' || str === '0' || str === 'no' || str === 'n') return false;
  return defaultVal;
}

/**
 * Extract image URLs separated by pipe (|) or comma (,)
 */
export function extractImageUrls(str) {
  if (!str || typeof str !== 'string') return [];
  let parts = [];
  if (str.includes('|')) {
    parts = str.split('|');
  } else if (str.includes(',')) {
    parts = str.split(',');
  } else {
    parts = [str];
  }
  return parts
    .map(p => p.trim())
    .filter(p => p.startsWith('http://') || p.startsWith('https://'));
}

/**
 * Parse an Excel Workbook or CSV arrayBuffer into raw JSON rows
 */
export function parseWorkbookBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames.includes('Bulk Upload') 
    ? 'Bulk Upload' 
    : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

/**
 * Extract unified product data object from any raw row (Excel or CSV)
 */
export function extractProductFromRow(row) {
  // 1. Product Title
  const name = (row['Product Title'] || row.Product_Title || row.name || row.Product_Name || row['Product Name'] || '').toString().trim();
  
  // 2. SKU Code
  const sku = (row['SKU Code'] || row.SKU_Code || row.sku || row.SKU || '').toString().trim();
  
  // 3. Base Price
  const rawPrice = row['Base Price (₹)'] ?? row.base_price ?? row.price ?? row.Price ?? '';
  const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, ''));
  
  // 4. Discount Price
  const rawDiscount = row['Discount Price (₹)'] ?? row.discount_price ?? row.Discount_Price ?? '';
  const discount_price = rawDiscount !== '' && rawDiscount !== null && !isNaN(parseFloat(String(rawDiscount).replace(/[^0-9.]/g, '')))
    ? parseFloat(String(rawDiscount).replace(/[^0-9.]/g, ''))
    : null;
  
  // 5. Stock Quantity
  const rawStock = row['Stock Quantity'] ?? row.stock_quantity ?? row.Stock_Quantity ?? row.stock ?? 0;
  const stock_quantity = isNaN(parseInt(rawStock, 10)) ? 0 : parseInt(rawStock, 10);
  
  // 6. Category
  const categoryRaw = (row['Category'] || row.category || row.category_slug || '').toString().trim();
  const category_slug = normalizeCategorySlug(categoryRaw);
  
  // 7. Featured Tags
  const tagsRaw = (row['Featured Tags (comma separated)'] || row.tags || row.Tags || '').toString().trim();
  
  // 8. Material specifications
  const material = (row['Material specifications'] || row.material || row.Material || '').toString().trim();
  
  // 9. Dimensions
  const dimensions = (row['Dimensions (L x W x H)'] || row.dimensions || row.Dimensions || '').toString().trim();
  
  // 10. Weight (kg)
  const rawWeight = row['Weight (kg)'] ?? row.weight ?? row.Weight ?? null;
  const weight = rawWeight !== null && rawWeight !== '' && !isNaN(parseFloat(rawWeight)) ? parseFloat(rawWeight) : null;
  
  // 11. Short Description
  const short_description = (row['Short Description'] || row.short_description || '').toString().trim();
  
  // 12. Detailed Description
  const description = (row['Detailed Description'] || row.description || row.Description || '').toString().trim();
  
  // 13. Finish Type
  const finish_type = (row['Finish Type'] || row.finish_type || '').toString().trim();
  
  // 14. Customization Option
  const customization_option = (row['Customization Option'] || row.customization_option || '').toString().trim();
  
  // 15. Bulk Pricing Tiers
  const bulk_pricing = (row['Bulk Pricing Tiers'] || row.bulk_pricing || '').toString().trim();
  
  // 16. Product Variants
  const variants = (row['Product Variants (JSON String)'] || row.variants || '').toString().trim();
  
  // 17. Related Product IDs
  const related_products = (row['Related Product IDs (JSON list or comma separated)'] || row.related_products || '').toString().trim();
  
  // 18-20. Flags
  const is_bestseller = parseBooleanFlag(row['Mark Best Seller'] ?? row.is_bestseller);
  const is_new_arrival = parseBooleanFlag(row['Mark New Arrival'] ?? row.is_new_arrival);
  const is_featured = parseBooleanFlag(row['Mark Featured'] ?? row.is_featured);
  
  // 21. Video URL
  const video_url = (row['Product Demonstration Video URL'] || row.video_url || '').toString().trim();
  
  // 22-23. SEO
  const seo_title = (row['Meta Title Tag (SEO)'] || row.seo_title || '').toString().trim();
  const seo_description = (row['Meta Description Tag (SEO)'] || row.seo_description || '').toString().trim();
  
  // 24. Publish immediately
  const is_published = parseBooleanFlag(row['Publish immediately'] ?? row.is_published, true) ? 1 : 0;

  // 25-26. Image URLs
  const primaryCoverUrl = (row['Primary Cover Photo'] || row.primary_cover_photo || row.primary_image || '').toString().trim();
  const additionalThumbnailsRaw = (row['Additional Thumbnails'] || row.additional_thumbnails || '').toString().trim();
  const additionalThumbnailUrls = extractImageUrls(additionalThumbnailsRaw);

  return {
    name,
    sku,
    price: isNaN(price) ? 0 : price,
    discount_price,
    stock_quantity,
    category_raw: categoryRaw,
    category_slug,
    tags: tagsRaw,
    material,
    dimensions,
    weight,
    short_description,
    description,
    finish_type,
    customization_option,
    bulk_pricing,
    variants,
    related_products,
    is_bestseller: is_bestseller ? 1 : 0,
    is_new_arrival: is_new_arrival ? 1 : 0,
    is_featured: is_featured ? 1 : 0,
    video_url,
    seo_title,
    seo_description,
    is_published,
    primaryCoverUrl,
    additionalThumbnailUrls
  };
}

/**
 * Validate a catalog row (supports Excel and legacy CSV formats)
 */
export function validateCatalogRow(row, rowIndex, seenSkusInBatch = new Set(), existingDbSkusSet = new Set(), categoriesMap = new Map()) {
  const errors = [];
  let isDuplicateInFile = false;
  let isExistingInDb = false;

  const data = extractProductFromRow(row);

  if (!data.name) {
    errors.push('Empty Product Title');
  }

  if (isNaN(data.price) || data.price <= 0) {
    errors.push(`Invalid Price (${data.price || 'Empty'})`);
  }

  if (isNaN(data.stock_quantity) || data.stock_quantity < 0) {
    errors.push(`Invalid Stock Quantity (${data.stock_quantity})`);
  }

  if (data.sku) {
    const skuLower = data.sku.toLowerCase();
    if (seenSkusInBatch.has(skuLower)) {
      errors.push(`Duplicate SKU in file (${data.sku})`);
      isDuplicateInFile = true;
    } else {
      seenSkusInBatch.add(skuLower);
    }

    if (existingDbSkusSet.has(skuLower)) {
      isExistingInDb = true;
    }
  } else {
    errors.push('Missing SKU Code');
  }

  let isInvalidCategory = false;
  if (data.category_slug) {
    if (categoriesMap.size > 0 && !categoriesMap.has(data.category_slug) && !categoriesMap.has(normalizeCategorySlug(data.category_raw))) {
      isInvalidCategory = true;
      errors.push(`Category not found: "${data.category_raw}"`);
    }
  } else {
    isInvalidCategory = true;
    errors.push('Missing Category');
  }

  const hasPrimaryImage = Boolean(data.primaryCoverUrl);
  const totalImageCount = (hasPrimaryImage ? 1 : 0) + data.additionalThumbnailUrls.length;

  return {
    rowIndex: rowIndex + 1,
    isValid: errors.length === 0,
    isDuplicateInFile,
    isExistingInDb,
    isInvalidCategory,
    hasPrimaryImage,
    totalImageCount,
    errors,
    data
  };
}

/**
 * Backward compatibility wrapper for validateCsvRow
 */
export function validateCsvRow(row, rowIndex, seenSkusInBatch = new Set(), existingDbSkusSet = new Set()) {
  return validateCatalogRow(row, rowIndex, seenSkusInBatch, existingDbSkusSet);
}

/**
 * Priority Image Matching Engine against zipEntriesMap (legacy ZIP support)
 */
export function findMatchedImagesForProduct(sku, name, zipEntriesMap = new Map()) {
  const cleanSku = sku ? sku.trim().toLowerCase() : '';
  const cleanName = name ? name.trim().toLowerCase() : '';

  const matchedPrimary = [];
  const matchedGallery = [];

  for (const [relativePath, entry] of zipEntriesMap.entries()) {
    if (relativePath.includes('__MACOSX') || relativePath.startsWith('.') || entry.dir) continue;

    const parts = relativePath.split('/');
    const fileName = parts[parts.length - 1].toLowerCase();
    const dotIdx = fileName.lastIndexOf('.');
    if (dotIdx === -1) continue;

    const baseStem = fileName.slice(0, dotIdx);
    const ext = fileName.slice(dotIdx + 1);

    if (!['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(ext)) continue;

    if (cleanSku) {
      if (baseStem === cleanSku) {
        matchedPrimary.push({ priority: 1, type: 'sku_exact', entry, relativePath });
        continue;
      }
      if (baseStem.startsWith(`${cleanSku}-`) || baseStem.startsWith(`${cleanSku}_`)) {
        matchedGallery.push({ priority: 3, type: 'sku_gallery', entry, relativePath, baseStem });
        continue;
      }
    }

    if (cleanName) {
      const sanitizedNameStem = cleanName.replace(/[^a-z0-9]/g, '');
      const sanitizedFileStem = baseStem.replace(/[^a-z0-9]/g, '');

      if (baseStem === cleanName || (sanitizedNameStem && sanitizedFileStem === sanitizedNameStem)) {
        matchedPrimary.push({ priority: 2, type: 'name_exact', entry, relativePath });
        continue;
      }
      if (baseStem.startsWith(`${cleanName}-`) || baseStem.startsWith(`${cleanName}_`)) {
        matchedGallery.push({ priority: 4, type: 'name_gallery', entry, relativePath, baseStem });
        continue;
      }
    }
  }

  matchedPrimary.sort((a, b) => a.priority - b.priority);
  const primaryEntry = matchedPrimary[0]?.entry || null;
  const galleryEntries = matchedGallery
    .filter(g => g.entry !== primaryEntry)
    .map(g => g.entry);

  return {
    primaryImage: primaryEntry,
    galleryImages: galleryEntries,
    hasImage: Boolean(primaryEntry || galleryEntries.length > 0)
  };
}

/**
 * Generate Sample CSV String
 */
export function generateSampleCsvContent() {
  const sampleRows = [
    {
      'Product Title': '24K Gold Electroplated Ganesha Idol',
      'SKU Code': 'DIV-GAN-001',
      'Base Price (₹)': 12499,
      'Discount Price (₹)': 9999,
      'Stock Quantity': 25,
      'Category': 'Spiritual Collection',
      'Featured Tags (comma separated)': 'ganesha, gold, luxury, divine',
      'Material specifications': '24K Gold Plated Resin',
      'Dimensions (L x W x H)': '15L X 10W X 20H Cm',
      'Weight (kg)': 1.2,
      'Primary Cover Photo': 'https://s3.ap-south-1.amazonaws.com/example/ganesha-1.jpg',
      'Additional Thumbnails': 'https://s3.ap-south-1.amazonaws.com/example/ganesha-2.jpg | https://s3.ap-south-1.amazonaws.com/example/ganesha-3.jpg',
      'Short Description': 'Handcrafted 24K gold electroplated Ganesha idol.',
      'Detailed Description': 'Handcrafted 24K gold electroplated Ganesha idol crafted by master artisans with insured pan-India delivery.',
      'Finish Type': 'Mirror Gold',
      'Customization Option': 'Engraving available',
      'Bulk Pricing Tiers': 'Bulk orders available — contact us for special pricing',
      'Product Variants (JSON String)': '',
      'Related Product IDs (JSON list or comma separated)': '',
      'Mark Best Seller': true,
      'Mark New Arrival': true,
      'Mark Featured': true,
      'Product Demonstration Video URL': '',
      'Meta Title Tag (SEO)': '24K Gold Electroplated Ganesha Idol | Anant Arts',
      'Meta Description Tag (SEO)': 'Shop 24K Gold Electroplated Ganesha Idol at Anant Arts. Premium spiritual home decor.',
      'Publish immediately': true
    }
  ];

  return Papa.unparse(sampleRows);
}

/**
 * Generate Image Naming Guide Text
 */
export function generateImageNamingGuideContent() {
  return `====================================================================
ANANT ARTS - PRODUCT CATALOG IMPORT GUIDE
====================================================================

You can import products using an Excel file (.xlsx, .xls) or CSV.

IMAGE IMPORT OPTIONS:
1. URL-Based (Recommended for Excel):
   Fill in "Primary Cover Photo" with an image URL.
   Fill in "Additional Thumbnails" with image URLs separated by " | " or ",".
   The importer will automatically download these images and upload them
   to Supabase Storage under products/{SKU}/1.jpg, 2.jpg, etc.

2. ZIP Archive (Alternative for Local Files):
   Upload an accompanying .zip archive with images named <SKU>.jpg,
   <SKU>-1.jpg, <SKU>-2.jpg.

====================================================================
`;
}

/**
 * Export Error & Import Report CSV matching exact user spec:
 * SKU, Product Title, Error Type, Error Message
 */
export function exportErrorReportCsv(reportRows = []) {
  const formattedRows = reportRows.map(r => ({
    'SKU': r.sku || r.data?.sku || 'N/A',
    'Product Title': r.name || r.data?.name || 'N/A',
    'Error Type': r.errorType || (r.status === 'Failed' ? 'Error' : (r.isValid === false ? 'Validation Error' : 'Info')),
    'Error Message': Array.isArray(r.errors) && r.errors.length > 0 
      ? r.errors.join(' | ') 
      : (r.message || 'Imported Successfully')
  }));

  return Papa.unparse(formattedRows);
}
