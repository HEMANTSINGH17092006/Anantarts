# Developer Documentation: Bulk Product Import System

## Overview
The **Bulk Product Import System** for Anant Arts is an enterprise-grade catalog ingestion engine designed to process up to 50,000+ products efficiently with zero database schema alterations to existing product tables, zero database bloat, atomic chunked processing, smart image matching, and safe 1-click rollback.

---

## 1. Architecture & Database Structure

### Database Schema
The system maintains strict decoupling from the core `products` schema. Two separate tracking and mapping tables are utilized:

#### `import_sessions` Table
Stores execution metadata, status, metrics, and references to uploaded files.
```sql
CREATE TABLE IF NOT EXISTS import_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_email TEXT NOT NULL,
  csv_file_path TEXT NOT NULL,
  report_file_path TEXT,
  inventory_mode TEXT NOT NULL, -- 'skip' | 'update' | 'replace'
  is_dry_run INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'paused' | 'failed' | 'rolled_back'
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  missing_images_count INTEGER DEFAULT 0,
  duplicate_count INTEGER DEFAULT 0,
  batch_size INTEGER DEFAULT 50,
  duration_ms INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### `import_products` Table
Maps imported products to their session for audit logging and non-destructive rollbacks.
```sql
CREATE TABLE IF NOT EXISTS import_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_session_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- 'created' | 'updated' | 'replaced'
  previous_data TEXT, -- JSON snapshot of product prior to update/replace
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(import_session_id) REFERENCES import_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

---

## 2. Storage Structure

All binary assets (CSVs, reports, product images) are managed via Supabase Storage in the `uploads` bucket:

- **Uploaded CSV Files**: `uploads/imports/csv/`
- **Generated Report CSVs**: `uploads/imports/reports/report_session_{id}_{timestamp}.csv`
- **Product Images**: `uploads/products/import-{timestamp}-{randomHash}.{ext}`

> **Image Processing Rule**: Original uploaded images are preserved. Optimized WebP and thumbnail copies are generated on-the-fly when requested by the application without overwriting original assets.

---

## 3. Workflow Diagrams & Execution Details

### A. Import Flow
1. **File Selection**: Admin uploads `.csv` file and optional `.zip` image archive.
2. **ZIP Parsing**: Browser extracts files into an in-memory map without sending unneeded zip chunks to the server.
3. **Session Initialization**: API call `POST /api/admin/bulk-import` with `action: 'init'` initializes an `import_sessions` record and retrieves existing SKUs & categories.
4. **Validation & Image Matching**:
   - Priority 1: SKU Match (`SKU.jpg`, `SKU.png`, `SKU.webp`)
   - Priority 2: Product Name Match (`Name.jpg`, `Name.png`)
   - Priority 3: Unlimited Gallery Suffixes (`SKU-1.jpg`, `SKU-2.jpg`, `SKU-side.jpg`, `Name-1.jpg`)
5. **Atomic Chunk Execution**: Rows are split into configurable batch chunks (25–200 items per chunk) and sent to `POST /api/admin/bulk-import` with `action: 'process_batch'`.
6. **Smart Category Resolution**: Categories are normalized (`ganesha-idols`, `Ganesha Idols`, `GANESHA_IDOLS` all map to `ganesha-idols`). Missing categories are dynamically auto-created.
7. **Session Finalization**: API call `POST /api/admin/bulk-import` with `action: 'finish'` generates the error report CSV in storage and revalidates Next.js cache tags.

### B. Dry Run Flow ("Validate Only")
- Dry Run mode parses CSV rows, tests image matching inside the uploaded ZIP, checks for empty names/invalid prices/duplicate SKUs, and renders a complete execution preview.
- No DB inserts, updates, or storage writes occur during Dry Run.

### C. Update & Replace Modes
- **Skip Mode (Default)**: If SKU exists in database, skip the row and log as duplicate.
- **Update Mode**: If SKU exists, update product fields (`price`, `stock_quantity`, `description`, `tags`) while taking a JSON snapshot in `import_products.previous_data`. Existing images are preserved.
- **Replace Mode**: If SKU exists, update product fields, clear existing product images, and attach new matched images from the ZIP archive.

### D. Resume Flow
- Session progress is saved to `import_sessions` after every batch.
- If the browser disconnects or closes mid-import, re-opening the Import Workspace detects the active `processing` session and allows resuming seamlessly from the last completed batch index.

### E. Rollback Flow
1. Admin triggers **Rollback Import** on an import session from the Import History tab.
2. API route `POST /api/admin/bulk-import/history` with `action: 'rollback'` reads `import_products` for the session.
3. Products with `action_type = 'created'` are deleted.
4. Products with `action_type = 'updated'` or `'replaced'` are restored to their pre-import state using `previous_data` JSON snapshots.
5. Untouched existing products are never affected.

---

## 4. API Endpoints Reference

### `POST /api/admin/bulk-import`
- **Action `'init'`**: Prepares session, returns DB SKU/category caches.
- **Action `'process_batch'`**: Atomically imports/updates a chunk of products & uploads associated images.
- **Action `'finish'`**: Finalizes session, uploads report CSV to Supabase storage, and triggers cache revalidation.

### `GET /api/admin/bulk-import/history`
- Returns historical import session records.

### `POST /api/admin/bulk-import/history`
- **Action `'rollback'`**: Reverts all product modifications made during specified import session.
