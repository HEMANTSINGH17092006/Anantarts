import { slugify } from './utils';
import Papa from 'papaparse';

/**
 * Generate SHA-256 Hash of CSV string content for Idempotency tracking
 */
export async function generateCsvHash(csvContent) {
  if (!csvContent) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(csvContent);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Smart Category Normalizer
 * Example: 'ganesha-idols', 'Ganesha Idols', 'GANESHA_IDOLS' -> 'ganesha-idols'
 */
export function normalizeCategorySlug(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .trim()
    .toLowerCase()
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
 * Validate a single CSV row
 */
export function validateCsvRow(row, rowIndex, seenSkusInBatch = new Set(), existingDbSkusSet = new Set()) {
  const errors = [];
  let isDuplicate = false;

  const rawName = row.name || row.Product_Name || row['Product Name'] || '';
  const name = typeof rawName === 'string' ? rawName.trim() : '';

  const rawSku = row.sku || row.SKU || '';
  const sku = typeof rawSku === 'string' ? rawSku.trim() : '';

  const rawPrice = row.price || row.Price || '';
  const price = parseFloat(rawPrice);

  const rawDiscount = row.discount_price || row.Discount_Price || row['Discount Price'] || '';
  const discountPrice = rawDiscount !== '' && rawDiscount !== null && !isNaN(parseFloat(rawDiscount)) 
    ? parseFloat(rawDiscount) 
    : null;

  const rawStock = row.stock_quantity || row.Stock_Quantity || row['Stock Quantity'] || row.stock || '0';
  const stockQuantity = parseInt(rawStock, 10);

  const categorySlug = normalizeCategorySlug(row.category_slug || row.Category_Slug || row.category || '');
  const tags = row.tags || row.Tags || '';
  const description = row.description || row.Description || '';

  // Validation Rules
  if (!name) {
    errors.push('Empty Product Name');
  }

  if (isNaN(price) || price <= 0) {
    errors.push(`Invalid Price (${rawPrice || 'Empty'})`);
  }

  if (isNaN(stockQuantity) || stockQuantity < 0) {
    errors.push(`Invalid Stock Quantity (${rawStock})`);
  }

  if (sku) {
    if (seenSkusInBatch.has(sku.toLowerCase())) {
      errors.push(`Duplicate SKU in CSV file (${sku})`);
      isDuplicate = true;
    } else if (existingDbSkusSet.has(sku.toLowerCase())) {
      isDuplicate = true;
      // Note: Existing SKU collision handling depends on inventory mode (Skip/Update/Replace)
    }
    seenSkusInBatch.add(sku.toLowerCase());
  }

  return {
    rowIndex: rowIndex + 1,
    isValid: errors.length === 0,
    isDuplicate,
    errors,
    data: {
      name,
      sku,
      price: isNaN(price) ? 0 : price,
      discount_price: discountPrice,
      stock_quantity: isNaN(stockQuantity) ? 0 : stockQuantity,
      category_slug: categorySlug,
      tags,
      description
    }
  };
}

/**
 * Priority Image Matching Engine against zipEntriesMap
 * Priority 1: SKU.jpg / SKU.png / SKU.webp
 * Priority 2: Product Name.jpg / png / webp
 * Priority 3: Unlimited gallery images: SKU-1.jpg, SKU-2.jpg, SKU-side.jpg, Name-1.jpg, etc.
 */
export function findMatchedImagesForProduct(sku, name, zipEntriesMap = new Map()) {
  const cleanSku = sku ? sku.trim().toLowerCase() : '';
  const cleanName = name ? name.trim().toLowerCase() : '';

  const matchedPrimary = [];
  const matchedGallery = [];

  // Helper to extract file stem & suffix
  // e.g. "sku123-1.jpg" -> stem: "sku123", suffix: "-1"
  for (const [relativePath, entry] of zipEntriesMap.entries()) {
    // Ignore hidden files and directories
    if (relativePath.includes('__MACOSX') || relativePath.startsWith('.') || entry.dir) continue;

    const parts = relativePath.split('/');
    const fileName = parts[parts.length - 1].toLowerCase();
    const dotIdx = fileName.lastIndexOf('.');
    if (dotIdx === -1) continue;

    const baseStem = fileName.slice(0, dotIdx);
    const ext = fileName.slice(dotIdx + 1);

    if (!['jpg', 'jpeg', 'png', 'webp', 'avif'].includes(ext)) continue;

    // Check SKU matches
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

    // Check Name matches if SKU didn't match primary
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

  // Sort matched primary by priority (SKU priority 1 wins over Name priority 2)
  matchedPrimary.sort((a, b) => a.priority - b.priority);

  // Combine primary and gallery images
  const primaryEntry = matchedPrimary[0]?.entry || null;
  
  // Exclude primary from gallery list if it ended up in gallery matching
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
      name: '24K Gold Electroplated Ganesha Idol',
      category_slug: 'spiritual-collection',
      price: 12499,
      discount_price: 9999,
      sku: 'DIV-GAN-001',
      stock_quantity: 25,
      tags: 'ganesha, gold, luxury, divine',
      description: 'Handcrafted 24K gold electroplated Ganesha idol crafted by master Rajasthani artisans.'
    },
    {
      name: 'Carved Teakwood Temple Mandir',
      category_slug: 'wooden-handicrafts',
      price: 45000,
      discount_price: 39999,
      sku: 'WOD-MAN-002',
      stock_quantity: 10,
      tags: 'mandir, teakwood, carved, home-temple',
      description: 'Intricately carved premium teakwood home temple with brass bells and velvet drawer.'
    },
    {
      name: 'Pure Silver Plated Kalash Accent',
      category_slug: 'home-decor',
      price: 6500,
      discount_price: 5499,
      sku: 'DECO-KAL-003',
      stock_quantity: 50,
      tags: 'silver, kalash, showpiece, luxury',
      description: 'Mirror-finish pure silver plated decorative Kalash for festive table decor.'
    }
  ];

  return Papa.unparse(sampleRows);
}

/**
 * Generate Image Naming Guide Text
 */
export function generateImageNamingGuideContent() {
  return `====================================================================
ANANT ARTS - PRODUCT IMAGE ZIP NAMING & MATCHING GUIDE
====================================================================

Follow these guidelines to ensure your product images in the ZIP file
automatically attach to your products during Bulk Product Import.

--------------------------------------------------------------------
1. MATCHING PRIORITY & CONVENTIONS
--------------------------------------------------------------------
The system automatically matches images inside your uploaded .ZIP archive
using the following priority rules:

[PRIORITY 1: SKU Match (Primary Cover Image)]
- Format: <SKU>.<ext>
- Examples: 
    DIV-GAN-001.jpg
    WOD-MAN-002.png
    DECO-KAL-003.webp

[PRIORITY 2: Product Name Match (Fallback Cover Image)]
- Format: <Product Name>.<ext>
- Examples:
    24K Gold Electroplated Ganesha Idol.jpg
    Carved Teakwood Temple Mandir.png

[PRIORITY 3: Unlimited Gallery Images]
- Attach secondary gallery photos by adding suffixes like -1, -2, -side, -back
- Examples:
    DIV-GAN-001-1.jpg  (Gallery Image 1)
    DIV-GAN-001-2.jpg  (Gallery Image 2)
    DIV-GAN-001-side.jpg (Gallery Image 3)
    DIV-GAN-001-back.jpg (Gallery Image 4)

--------------------------------------------------------------------
2. SUPPORTED FORMATS & CASE INSENSITIVITY
--------------------------------------------------------------------
- Supported Extensions: .jpg, .jpeg, .png, .webp, .avif
- File extensions and names are CASE-INSENSITIVE (e.g., div-gan-001.JPG works).
- Subfolders inside the ZIP are supported automatically.

--------------------------------------------------------------------
3. MISSING IMAGE HANDLING
--------------------------------------------------------------------
If a product SKU or Name has no corresponding image inside the ZIP:
- The product will still be imported successfully.
- It will be flagged as "Image Missing" in your downloadable Import Report.

====================================================================
  `;
}

/**
 * Export Error & Import Report CSV
 */
export function exportErrorReportCsv(reportRows = []) {
  const formattedRows = reportRows.map(r => ({
    'Row Number': r.rowIndex,
    'SKU': r.sku || 'N/A',
    'Product Name': r.name || 'N/A',
    'Category': r.category_slug || 'N/A',
    'Import Status': r.status || (r.isValid ? 'Success' : 'Failed'),
    'Image Status': r.hasImage ? 'Matched' : 'Missing Image',
    'Details / Error Reasons': Array.isArray(r.errors) && r.errors.length > 0 
      ? r.errors.join(' | ') 
      : (r.message || 'Imported Successfully')
  }));

  return Papa.unparse(formattedRows);
}
