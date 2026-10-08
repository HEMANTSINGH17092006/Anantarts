const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load environment variables from .env
require('dotenv').config();

const dbPath = path.join(__dirname, 'database.sqlite');
let db = null;
let pool = null;
let isPostgres = false;

if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '') {
  isPostgres = true;
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase SSL connections
  });
  console.log('Database Mode: Supabase (PostgreSQL)');
} else {
  isPostgres = false;
  const sqlite3 = require('sqlite3').verbose();
  db = new sqlite3.Database(dbPath);
  console.log('Database Mode: Fallback Local (SQLite)');
}

// SQL Query translator (Translates SQLite syntax to Postgres on-the-fly)
function translateQuery(sql) {
  if (!isPostgres) return sql;
  
  let pgSql = sql;

  // 1. Translate SQLite MAX function with 2 arguments to PostgreSQL GREATEST
  if (pgSql.includes('MAX(0, stock_quantity - ?)')) {
    pgSql = pgSql.replace('MAX(0, stock_quantity - ?)', 'GREATEST(0, stock_quantity - ?)');
  }
  
  // 2. Convert "?" placeholders to numbered "$1, $2" placeholders
  let count = 1;
  while (pgSql.includes('?')) {
    pgSql = pgSql.replace('?', `$${count++}`);
  }

  // 3. Translate SQLite "INSERT OR REPLACE" to Postgres "ON CONFLICT" upsert
  if (pgSql.includes('INSERT OR REPLACE INTO website_settings')) {
    pgSql = pgSql.replace(
      'INSERT OR REPLACE INTO website_settings', 
      'INSERT INTO website_settings'
    ) + ' ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value';
  }

  return pgSql;
}

// Translate Schema queries on table initialization
function adjustSchema(sql) {
  if (!isPostgres) return sql;

  return sql
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY')
    .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/g, 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP')
    .replace(/DATETIME/g, 'TIMESTAMP')
    .replace(/REAL NOT NULL CHECK\(rating BETWEEN 1 AND 5\)/g, 'INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5)');
}

// Helper functions to use async/await
const dbRun = async (query, params = []) => {
  if (isPostgres) {
    let pgSql = translateQuery(query);
    
    // Append returning clause for inserts to resolve lastID
    if (pgSql.trim().toUpperCase().startsWith('INSERT ') && !pgSql.toUpperCase().includes('RETURNING')) {
      pgSql += ' RETURNING *';
    }
    
    const res = await pool.query(pgSql, params);
    const lastID = res.rows[0] ? (res.rows[0].id || null) : null;
    return { id: lastID, changes: res.rowCount };
  } else {
    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }
};

const dbAll = async (query, params = []) => {
  if (isPostgres) {
    const pgSql = translateQuery(query);
    const res = await pool.query(pgSql, params);
    return res.rows;
  } else {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

const dbGet = async (query, params = []) => {
  if (isPostgres) {
    const pgSql = translateQuery(query);
    const res = await pool.query(pgSql, params);
    return res.rows[0] || null;
  } else {
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
};

const dbExec = async (query) => {
  if (isPostgres) {
    const pgSql = adjustSchema(query);
    await pool.query(pgSql);
  } else {
    return new Promise((resolve, reject) => {
      db.exec(query, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

function reconnectDb() {
  if (isPostgres) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  } else {
    db = new sqlite3.Database(dbPath);
  }
  console.log('Database connection re-established.');
}

async function closeDb() {
  if (isPostgres) {
    await pool.end();
  } else {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

async function addColumn(tableName, columnName, columnType) {
  try {
    if (isPostgres) {
      const pgSql = translateQuery(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`);
      await pool.query(pgSql);
    } else {
      await dbExec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`);
    }
    console.log(`[Migration] Column ${columnName} successfully added to ${tableName}.`);
  } catch (err) {
    // Ignore duplicate column errors
  }
}

async function initDb() {
  // Create tables in order
  await dbExec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password_hash TEXT,
      role TEXT DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      image_path TEXT,
      is_hidden INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      category_id INTEGER,
      price REAL NOT NULL,
      discount_price REAL,
      sku TEXT UNIQUE,
      material TEXT,
      dimensions TEXT,
      weight REAL,
      stock_quantity INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      image_path TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      min_order_amount REAL DEFAULT 0,
      start_date DATETIME,
      end_date DATETIME,
      usage_limit INTEGER,
      times_used INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      billing_address TEXT NOT NULL,
      coupon_id INTEGER,
      discount_amount REAL DEFAULT 0,
      shipping_charge REAL DEFAULT 0,
      subtotal REAL NOT NULL,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT DEFAULT 'Pending',
      order_status TEXT DEFAULT 'Pending',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(coupon_id) REFERENCES coupons(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      total_price REAL NOT NULL,
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      reviewer_name TEXT NOT NULL,
      reviewer_email TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      is_approved INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT,
      comment TEXT NOT NULL,
      rating INTEGER DEFAULT 5,
      avatar_path TEXT,
      is_approved INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      subtitle TEXT,
      image_path TEXT NOT NULL,
      cta_link TEXT,
      cta_text TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS website_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      type TEXT,
      link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      short_desc TEXT,
      featured_image TEXT,
      category_id INTEGER,
      publish_date DATETIME,
      is_published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS flash_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      discount_percentage REAL NOT NULL,
      start_date DATETIME,
      end_date DATETIME,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS consultations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsapp TEXT,
      city TEXT,
      deity_interest TEXT,
      dimensions TEXT,
      preferred_date TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_email TEXT,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS flash_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      discount_percentage REAL DEFAULT 0,
      start_date DATETIME,
      end_date DATETIME,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS b2b_enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      company TEXT,
      quantity INTEGER,
      product_interest TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS whatsapp_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payment_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      order_number TEXT,
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT,
      amount REAL,
      status TEXT NOT NULL,
      error_message TEXT,
      error_stack TEXT,
      customer_info TEXT,
      raw_payload TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payment_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id TEXT,
      order_id TEXT,
      status TEXT,
      error TEXT,
      step_failed TEXT,
      payload TEXT,
      recovered INTEGER DEFAULT 0,
      recovery_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS background_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      payload TEXT,
      status TEXT DEFAULT 'pending',
      attempts INTEGER DEFAULT 0,
      error_message TEXT,
      run_after DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory_locks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identifier TEXT NOT NULL,
      otp TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_tracking_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      location TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by_admin TEXT,
      FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS import_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_email TEXT NOT NULL,
      csv_file_path TEXT NOT NULL,
      csv_hash TEXT,
      report_file_path TEXT,
      inventory_mode TEXT NOT NULL,
      is_dry_run INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
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

    CREATE TABLE IF NOT EXISTS import_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      import_session_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      action_type TEXT NOT NULL,
      snapshot_file_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(import_session_id) REFERENCES import_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- Marketing & Customer Communication System Tables
    CREATE TABLE IF NOT EXISTS marketing_campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'email',
      subject TEXT,
      preview_text TEXT,
      content_html TEXT,
      content_text TEXT,
      template_id INTEGER,
      segment_config TEXT,
      status TEXT DEFAULT 'draft',
      total_recipients INTEGER DEFAULT 0,
      sent_count INTEGER DEFAULT 0,
      delivered_count INTEGER DEFAULT 0,
      opened_count INTEGER DEFAULT 0,
      clicked_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      scheduled_at DATETIME,
      started_at DATETIME,
      completed_at DATETIME,
      created_by TEXT,
      settings TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS marketing_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'email',
      category TEXT DEFAULT 'general',
      subject TEXT,
      preview_text TEXT,
      body_html TEXT,
      body_text TEXT,
      thumbnail_url TEXT,
      is_system INTEGER DEFAULT 0,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS campaign_recipients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      customer_id INTEGER,
      recipient_email TEXT,
      recipient_phone TEXT,
      recipient_name TEXT,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      retry_count INTEGER DEFAULT 0,
      sent_at DATETIME,
      opened_at DATETIME,
      clicked_at DATETIME,
      tracking_token TEXT UNIQUE,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS communication_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      phone TEXT,
      email_marketing_opt_in INTEGER DEFAULT 1,
      whatsapp_marketing_opt_in INTEGER DEFAULT 1,
      unsubscribed_at DATETIME,
      unsubscribe_reason TEXT,
      source TEXT DEFAULT 'system',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS campaign_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER NOT NULL,
      recipient_id INTEGER,
      event_type TEXT NOT NULL,
      metadata TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY(recipient_id) REFERENCES campaign_recipients(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS campaign_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER,
      level TEXT DEFAULT 'info',
      message TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS customer_segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      filter_criteria TEXT NOT NULL,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Run schema expansions / column additions
  await addColumn('products', 'short_description', 'TEXT');
  await addColumn('products', 'deity_category', 'TEXT');
  await addColumn('products', 'is_bestseller', 'INTEGER DEFAULT 0');
  await addColumn('products', 'is_new_arrival', 'INTEGER DEFAULT 0');
  await addColumn('products', 'is_featured', 'INTEGER DEFAULT 0');
  await addColumn('products', 'video_url', 'TEXT');
  await addColumn('products', 'seo_title', 'TEXT');
  await addColumn('products', 'seo_description', 'TEXT');
  await addColumn('products', 'finish_type', 'TEXT');
  await addColumn('products', 'customization_option', 'TEXT');
  await addColumn('products', 'bulk_pricing', 'TEXT');
  await addColumn('products', 'variants', 'TEXT');
  await addColumn('products', 'related_products', 'TEXT');

  await addColumn('users', 'phone', 'TEXT UNIQUE');
  await addColumn('users', 'email_verified', 'INTEGER DEFAULT 0');


  await addColumn('categories', 'type', "TEXT DEFAULT 'deity'");
  await addColumn('categories', 'parent_id', 'INTEGER');
  await addColumn('categories', 'banner_path', 'TEXT');
  await addColumn('categories', 'description', 'TEXT');
  await addColumn('categories', 'is_featured', 'INTEGER DEFAULT 0');

  await addColumn('products', 'occasion', 'TEXT');
  await addColumn('products', 'festival', 'TEXT');
  await addColumn('products', 'gift_type', 'TEXT');
  await addColumn('products', 'color', 'TEXT');

  await addColumn('orders', 'tracking_number', 'TEXT');
  await addColumn('orders', 'courier_name', 'TEXT');
  await addColumn('orders', 'estimated_delivery', 'TEXT');
  await addColumn('orders', 'razorpay_order_id', 'TEXT');
  await addColumn('orders', 'razorpay_payment_id', 'TEXT');
  await addColumn('orders', 'razorpay_signature', 'TEXT');
  await addColumn('orders', 'captured_at', 'TIMESTAMP');
  await addColumn('orders', 'refund_status', "TEXT DEFAULT 'none'");
  await addColumn('orders', 'refund_id', 'TEXT');
  await addColumn('orders', 'payment_logs', 'TEXT');

  await addColumn('orders', 'cancelled_at', 'TIMESTAMP');
  await addColumn('orders', 'cancelled_by', 'TEXT');
  await addColumn('orders', 'cancellation_reason', 'TEXT');
  await addColumn('orders', 'shipping_date', 'TEXT');
  await addColumn('orders', 'courier_website', 'TEXT');

  await addColumn('order_tracking_events', 'courier_name', 'TEXT');
  await addColumn('order_tracking_events', 'tracking_number', 'TEXT');
  await addColumn('order_tracking_events', 'estimated_delivery', 'TEXT');
  await addColumn('order_tracking_events', 'updated_by_admin', 'TEXT');
  await addColumn('order_tracking_events', 'courier_website', 'TEXT');
  await addColumn('order_tracking_events', 'shipping_date', 'TEXT');

  // Import System Schema Additions
  await addColumn('import_sessions', 'admin_email', 'TEXT');
  await addColumn('import_sessions', 'csv_file_path', 'TEXT');
  await addColumn('import_sessions', 'csv_hash', 'TEXT');
  await addColumn('import_sessions', 'report_file_path', 'TEXT');
  await addColumn('import_sessions', 'inventory_mode', "TEXT DEFAULT 'skip'");
  await addColumn('import_sessions', 'is_dry_run', 'INTEGER DEFAULT 0');
  await addColumn('import_sessions', 'status', "TEXT DEFAULT 'pending'");
  await addColumn('import_sessions', 'total_rows', 'INTEGER DEFAULT 0');
  await addColumn('import_sessions', 'processed_rows', 'INTEGER DEFAULT 0');
  await addColumn('import_sessions', 'success_count', 'INTEGER DEFAULT 0');
  await addColumn('import_sessions', 'failed_count', 'INTEGER DEFAULT 0');
  await addColumn('import_sessions', 'missing_images_count', 'INTEGER DEFAULT 0');
  await addColumn('import_sessions', 'duplicate_count', 'INTEGER DEFAULT 0');
  await addColumn('import_sessions', 'batch_size', 'INTEGER DEFAULT 50');
  await addColumn('import_sessions', 'duration_ms', 'INTEGER DEFAULT 0');

  await addColumn('import_products', 'import_session_id', 'INTEGER');
  await addColumn('import_products', 'product_id', 'INTEGER');
  await addColumn('import_products', 'action_type', 'TEXT');
  await addColumn('import_products', 'snapshot_file_path', 'TEXT');

  // Marketing Campaign Column Additions
  await addColumn('marketing_campaigns', 'settings', 'TEXT');
  await addColumn('marketing_campaigns', 'preview_text', 'TEXT');
  await addColumn('marketing_templates', 'category', "TEXT DEFAULT 'general'");
  await addColumn('marketing_templates', 'preview_text', 'TEXT');
  await addColumn('communication_preferences', 'unsubscribe_reason', 'TEXT');

  if (isPostgres) {
    try {
      await pool.query("NOTIFY pgrst, 'reload schema'");
      console.log("[Migration] Sent 'NOTIFY pgrst, reload schema' to Supabase PostgREST.");
    } catch (e) {
      console.error("[Migration] Schema cache reload notification warning:", e.message);
    }
  }
  
  if (isPostgres) {
    try {
      await pool.query("ALTER TABLE users ALTER COLUMN email DROP NOT NULL;");
      await pool.query("ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;");
    } catch (e) {
      // Ignore
    }
  }
  
  await addColumn('banners', 'video_url', 'TEXT');
  await addColumn('blogs', 'seo_title', 'TEXT');
  await addColumn('blogs', 'seo_description', 'TEXT');

  // Performance Indexes
  await dbExec(`
    CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);
    CREATE INDEX IF NOT EXISTS idx_product_images_prod ON product_images (product_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items (product_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON orders (razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
    
    -- Marketing Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_camp_recipients_campaign ON campaign_recipients (campaign_id);
    CREATE INDEX IF NOT EXISTS idx_camp_recipients_status ON campaign_recipients (status);
    CREATE INDEX IF NOT EXISTS idx_camp_recipients_token ON campaign_recipients (tracking_token);
    CREATE INDEX IF NOT EXISTS idx_comm_pref_email ON communication_preferences (email);
    CREATE INDEX IF NOT EXISTS idx_camp_events_campaign ON campaign_events (campaign_id);
    CREATE INDEX IF NOT EXISTS idx_camp_logs_campaign ON campaign_logs (campaign_id);
  `);

  console.log('Database tables verified/created successfully.');

  // Seed default data if empty
  await seedDefaultData();
}

async function seedDefaultData() {
  // 1. Seed default Admin User
  const adminEmail = 'admin@anantarts.in';
  const adminUser = await dbGet('SELECT * FROM users WHERE email = ?', [adminEmail]);
  if (!adminUser) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    await dbRun(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Anant Arts Admin', adminEmail, passwordHash, 'super_admin']
    );
    console.log('Default admin seeded: admin@anantarts.in / admin123');
  }

  // 2. Seed default Categories (Rebranded Multi-Category Marketplace)
  const requiredCategories = [
    { name: 'Spiritual Collection', slug: 'spiritual-collection', image_path: '/uploads/category-spiritual-collection.png', sort_order: 1, is_featured: 1 },
    { name: 'Wooden Handicrafts', slug: 'wooden-handicrafts', image_path: '/uploads/category-wooden-handicrafts.png', sort_order: 2, is_featured: 1 },
    { name: 'Home Décor', slug: 'home-decor', image_path: '/uploads/category-home-decor.png', sort_order: 3, is_featured: 1 },
    { name: 'Corporate Gifts', slug: 'corporate-gifts', image_path: '/uploads/category-corporate-gifts.png', sort_order: 4, is_featured: 1 },
    { name: 'Customized Gifts', slug: 'customized-gifts', image_path: '/uploads/category-customized-products.png', sort_order: 5, is_featured: 1 },
    { name: 'Festival Collection', slug: 'festival-collection', image_path: '/uploads/category-festive-gifts.png', sort_order: 6, is_featured: 1 },
    { name: 'Car Dashboard Accessories', slug: 'car-dashboard-accessories', image_path: '/uploads/category-car-accessories.png', sort_order: 7, is_featured: 1 },
    { name: 'Return Gifts', slug: 'return-gifts', image_path: '/uploads/category-return-gifts.png', sort_order: 8, is_featured: 1 },
    { name: 'Office Décor', slug: 'office-decor', image_path: '/uploads/category-office-decor.png', sort_order: 9, is_featured: 1 },
    { name: 'Best Sellers', slug: 'best-sellers', image_path: '/uploads/category-best-sellers.png', sort_order: 10, is_featured: 1 },
    { name: 'New Arrivals', slug: 'new-arrivals', image_path: '/uploads/category-new-arrivals.png', sort_order: 11, is_featured: 1 }
  ];

  let categoryMap = {};
  for (const cat of requiredCategories) {
    let existing = await dbGet('SELECT * FROM categories WHERE slug = ?', [cat.slug]);
    if (!existing) {
      const res = await dbRun(
        'INSERT INTO categories (name, slug, image_path, sort_order) VALUES (?, ?, ?, ?)',
        [cat.name, cat.slug, cat.image_path, cat.sort_order]
      );
      categoryMap[cat.slug] = res.id;
    } else {
      categoryMap[cat.slug] = existing.id;
    }
  }
  console.log('Categories verified/seeded.');

  // 3. Seed default Products
  const productCount = await dbGet('SELECT COUNT(*) as count FROM products');
  if (parseInt(productCount.count) === 0) {
    const defaultProducts = [
      {
        name: 'Divine 24K Gold Electroplated Ganesha Idol',
        slug: 'divine-24k-gold-ganesha-idol',
        description: 'Invite prosperity, wisdom, and success into your home with this breathtaking 24K gold electroplated Ganesha idol. Meticulously handcrafted by master artisans, this sculpture showcases intricate details of Lord Ganesha’s crown and ornaments. Features a high-gloss protective lacquer coating that ensures the gold shines brilliantly for decades.',
        category_slug: 'spiritual-collection',
        price: 18999,
        discount_price: 15499,
        sku: 'AA-GAN-001',
        material: 'Premium Brass & 24K Gold Electroplating',
        dimensions: '8.5 x 5.0 x 10.5 Inches',
        weight: 3.2,
        stock_quantity: 15,
        tags: JSON.stringify(['Featured', 'Best Seller']),
        images: ['/uploads/ganesha-gold-1.jpg', '/uploads/ganesha-gold-2.jpg'],
        finish_type: '24K Gold Electroplated',
        customization_option: 'Custom name engraving on wooden base.',
        variants: JSON.stringify([
          { name: 'Size', options: ['Standard', 'Grand'] },
          { name: 'Finish', options: ['24K Gold Plated', 'Silver Plated'] }
        ]),
        bulk_pricing: '10-25 units: 10% off, 25+ units: 18% off'
      },
      {
        name: 'Lord Krishna Flute Playing Elegant Idol',
        slug: 'lord-krishna-flute-elegant-idol',
        description: 'Bring the divine aura of Gokul with this stunning, electroplated silver & gold dual-tone Krishna idol. Capturing Lord Krishna in his signature tribhanga posture playing the flute, this statue features fine embellishments, from the peacock feather in his crown to the detailed folds of his dhoti. Perfect for home temples or luxury gifting.',
        category_slug: 'spiritual-collection',
        price: 24999,
        discount_price: 19999,
        sku: 'AA-KRI-001',
        material: 'Premium Brass, Silver & Gold Electroplating',
        dimensions: '6.0 x 4.5 x 12.0 Inches',
        weight: 4.1,
        stock_quantity: 8,
        tags: JSON.stringify(['Featured', 'New Arrival']),
        images: ['/uploads/krishna-gold-1.jpg', '/uploads/krishna-gold-2.jpg'],
        finish_type: 'Dual Tone Gold & Silver Electroplated',
        variants: JSON.stringify([
          { name: 'Size', options: ['12 Inches', '18 Inches'] }
        ])
      },
      {
        name: 'Meditating Lord Shiva Antique Bronze & Gold Idol',
        slug: 'meditating-shiva-bronze-gold-idol',
        description: 'Immerse your space in meditative tranquility with this Lord Shiva idol in dhyana mudra. Finished in antique bronze with brilliant 24k gold electroplated highlights on his trident, snake, and hair accents. Designed to radiate peace, focus, and strength in your home or meditation room.',
        category_slug: 'spiritual-collection',
        price: 21999,
        discount_price: 17999,
        sku: 'AA-SHI-001',
        material: 'Composite Brass, Antique Bronze & Gold Electroplating',
        dimensions: '9.0 x 6.0 x 11.0 Inches',
        weight: 5.0,
        stock_quantity: 5,
        tags: JSON.stringify(['Best Seller']),
        images: ['/uploads/shiva-gold-1.jpg'],
        finish_type: 'Antique Bronze & 24K Gold Highlights'
      },
      {
        name: 'Goddess Lakshmi Ashta-Lakshmi Blessing Idol',
        slug: 'goddess-lakshmi-blessing-idol',
        description: 'Welcome wealth, abundance, and auspiciousness with this exquisite Goddess Lakshmi idol. Seated gracefully on a double-lotus pedestal, the goddess holds twin lotus flowers, with coins falling from her front hand. Electroplated in radiant 24k gold for a timeless premium finish.',
        category_slug: 'spiritual-collection',
        price: 16999,
        discount_price: 13999,
        sku: 'AA-LAK-001',
        material: 'Premium Brass & 24K Gold Electroplating',
        dimensions: '7.0 x 5.0 x 9.0 Inches',
        weight: 2.8,
        stock_quantity: 20,
        tags: JSON.stringify(['Featured', 'Best Seller', 'Festival Special']),
        images: ['/uploads/lakshmi-gold-1.jpg', '/uploads/lakshmi-gold-2.jpg'],
        finish_type: '24K Gold Electroplated'
      },
      {
        name: 'Veer Hanuman Sanjeevani Mountain Lift Idol',
        slug: 'veer-hanuman-sanjeevani-mountain-idol',
        description: 'Celebrate the symbol of strength, courage, and devotion with this dynamic Lord Hanuman idol, depicting him carrying the Sanjeevani mountain. The electroplated copper and gold finish highlights the muscular detail and vigorous action of the deity. Ideal for study rooms, offices, and living rooms.',
        category_slug: 'spiritual-collection',
        price: 19999,
        discount_price: 16499,
        sku: 'AA-HAN-001',
        material: 'Brass, Copper & Gold Electroplating',
        dimensions: '8.0 x 5.5 x 11.5 Inches',
        weight: 3.8,
        stock_quantity: 12,
        tags: JSON.stringify(['New Arrival']),
        images: ['/uploads/hanuman-gold-1.jpg'],
        finish_type: 'Dual Tone Copper & Gold Electroplated'
      },
      {
        name: 'Geometric Golden Electroplated Leaf Accent',
        slug: 'geometric-golden-leaf-accent',
        description: 'A striking modern home accent featuring abstract leaf silhouettes electroplated in brilliant 24K gold. Resting on a solid black marble base, this sculpture brings an air of luxury and contemporary style to any mantelpiece, console table, or executive office desk.',
        category_slug: 'home-decor',
        price: 5999,
        discount_price: 4499,
        sku: 'AA-DEC-001',
        material: 'Stainless Steel & Black Marble',
        dimensions: '10.0 x 3.5 x 12.0 Inches',
        weight: 1.8,
        stock_quantity: 15,
        tags: JSON.stringify(['Featured', 'Home Decor']),
        images: ['/uploads/banner-2.jpg'],
        finish_type: '24K Gold Electroplated',
        variants: JSON.stringify([
          { name: 'Finish', options: ['Gold Electroplated', 'Chrome Electroplated'] }
        ]),
        bulk_pricing: '10+ units: 15% discount, 50+ units: 25% discount'
      },
      {
        name: 'Silver Plated Executive Desk Clock & Pen Organizer',
        slug: 'silver-plated-executive-desk-clock',
        description: 'The ultimate statement of professional luxury. This executive organizer is handcrafted in fine teak wood and wrapped in sterling silver electroplated panels. Features a precise quartz analog clock, two pen holsters, and a phone rest. Comes in a premium leatherette presentation box.',
        category_slug: 'corporate-gifts',
        price: 8999,
        discount_price: 6999,
        sku: 'AA-CORP-001',
        material: 'Teak Wood & Sterling Silver Plating',
        dimensions: '8.5 x 4.0 x 6.0 Inches',
        weight: 1.4,
        stock_quantity: 40,
        tags: JSON.stringify(['Corporate Gifting', 'Best Seller']),
        images: ['/uploads/corporate-gifts.jpg'],
        finish_type: 'Sterling Silver Electroplated',
        customization_option: 'We provide custom engraving for corporate orders. Upload logo during bulk checkout.',
        bulk_pricing: '20-50 units: 12% off, 50-100 units: 20% off, 100+ units: 30% off'
      },
      {
        name: 'Limited Edition 24K Gold Peacock Figurine',
        slug: 'limited-edition-gold-peacock-figurine',
        description: 'Celebrate the royal national bird of India. This premium electroplated collector item showcases the peacock with its majestic feathers fully fanned, highlighted in detailed dual-tone 24K gold and silver plating. Each piece is numbered and includes a certificate of authenticity.',
        category_slug: 'premium-collectibles',
        price: 34999,
        discount_price: 29999,
        sku: 'AA-COLL-001',
        material: 'Premium Brass & Gold Highlights',
        dimensions: '11.0 x 6.5 x 13.0 Inches',
        weight: 4.6,
        stock_quantity: 6,
        tags: JSON.stringify(['Collectibles', 'Featured']),
        images: ['/uploads/banner-1.jpg'],
        finish_type: 'Dual Tone 24K Gold & Silver Electroplated'
      }
    ];

    for (const prod of defaultProducts) {
      const categoryId = categoryMap[prod.category_slug] || null;
      const res = await dbRun(
        `INSERT INTO products (name, slug, description, category_id, price, discount_price, sku, material, dimensions, weight, stock_quantity, is_published, tags, finish_type, customization_option, bulk_pricing, variants)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
        [prod.name, prod.slug, prod.description, categoryId, prod.price, prod.discount_price, prod.sku, prod.material, prod.dimensions, prod.weight, prod.stock_quantity, prod.tags, prod.finish_type || null, prod.customization_option || null, prod.bulk_pricing || null, prod.variants || null]
      );
      
      // Insert product images
      let isPrimary = 1;
      for (const img of prod.images) {
        await dbRun(
          'INSERT INTO product_images (product_id, image_path, is_primary) VALUES (?, ?, ?)',
          [res.id, img, isPrimary]
        );
        isPrimary = 0; // Only the first image is primary
      }
    }
    console.log('Default products and images seeded.');
  }

  // 4. Seed Coupons
  const couponCount = await dbGet('SELECT COUNT(*) as count FROM coupons');
  if (parseInt(couponCount.count) === 0) {
    await dbRun(
      `INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, usage_limit, times_used, is_active)
       VALUES 
       (?, ?, ?, ?, ?, 0, 1),
       (?, ?, ?, ?, ?, 0, 1)`,
      ['DIVINE10', 'percentage', 10, 5000, 100, 'FREEGOLD', 'free_shipping', 0, 15000, 200]
    );
    console.log('Default coupons seeded.');
  }

  // 5. Seed Testimonials
  const testCount = await dbGet('SELECT COUNT(*) as count FROM testimonials');
  if (parseInt(testCount.count) === 0) {
    await dbRun(
      `INSERT INTO testimonials (name, role, comment, rating, avatar_path, is_approved)
       VALUES 
       (?, ?, ?, 5, ?, 1),
       (?, ?, ?, 5, ?, 1),
       (?, ?, ?, 5, ?, 1)`,
      [
        'Rajesh Sharma', 'Industrialist, New Delhi', 'The 24K Ganesha idol is an absolute masterpiece. The electroplating is thick and shines beautifully in our temple room. Perfect packing and fast delivery!', '/uploads/avatar-1.jpg',
        'Meera Krishnan', 'Interior Designer, Bangalore', 'I recommend Anant Arts to all my luxury clients. The detailing on the Lord Krishna statue is stunning, and the quality is completely gold-standard.', '/uploads/avatar-2.jpg',
        'Anoop Deshmukh', 'VP Marketing, Mumbai', 'Gifted the Hanuman Sanjeevani idol to my father. He was in tears looking at the details and shine. Absolutely divine work. Thank you!', '/uploads/avatar-3.jpg'
      ]
    );
    console.log('Default testimonials seeded.');
  }

  // 6. Seed Banners
  const bannerCount = await dbGet('SELECT COUNT(*) as count FROM banners');
  if (parseInt(bannerCount.count) === 0) {
    await dbRun(
      `INSERT INTO banners (title, subtitle, image_path, cta_link, cta_text, sort_order, is_active)
       VALUES 
       (?, ?, ?, ?, ?, 1, 1),
       (?, ?, ?, ?, ?, 2, 1)`,
      [
        'Divine Electroplated Sculptures', 'Adorn your home temples with 24K Gold & Silver electroplated luxury idols.', '/uploads/banner-1.jpg', '/shop.html', 'Explore Collections',
        'Bring Abundance & Peace', 'Premium handcrafted spiritual art, carrying centuries of traditional Indian heritage.', '/uploads/banner-2.jpg', '/shop.html?category=goddess-lakshmi', 'Shop Laxmi Collection'
      ]
    );
    console.log('Default banners seeded.');
  }

  // 7. Seed Website Settings
  const settingsCount = await dbGet('SELECT COUNT(*) as count FROM website_settings');
  if (parseInt(settingsCount.count) === 0) {
    const defaultSettings = [
      { key: 'site_name', value: 'Anant Arts' },
      { key: 'site_tagline', value: 'Bringing Divine Art to Every Home' },
      { key: 'whatsapp_number', value: '917275819354' },
      { key: 'contact_email', value: 'anantarts39@gmail.com' },
      { key: 'support_email', value: 'support@anantarts.in' },
      { key: 'orders_email', value: 'orders@anantarts.in' },
      { key: 'contact_phone', value: '+91 72758 19354' },
      { key: 'contact_address', value: 'Bhoirwadi, Dombivli East, Maharashtra' },
      { key: 'razorpay_key_id', value: 'rzp_live_TF5Q4XYGrKlT1b' },
      { key: 'ga_measurement_id', value: '' },
      { key: 'clarity_project_id', value: '' },
      { key: 'gsc_verification', value: '' },
      { key: 'seo_title', value: 'Anant Arts — Premium Electroplated Hindu God Idols | 24K Gold & Silver' },
      { key: 'seo_description', value: 'Anant Arts offers luxury electroplated idols of Hindu gods and goddesses. Handcrafted with 24K Gold, Sterling Silver, and Copper plating. Bringing Divine Art to Every Home.' },
      { key: 'social_links', value: JSON.stringify({ instagram: 'https://www.instagram.com/anantarts.in?igsh=MXB0d215YzVtZ3Q0aw==' }) },
      { key: 'about_us_text', value: 'Anant Arts is a premium Indian brand specializing in manufacturing high-end electroplated idols of Hindu gods and goddesses. Based in Dombivli East, Maharashtra, we blend centuries-old craftsmanship with modern electroplating technology (using 24K gold, fine silver, and copper) to create timeless spiritual masterworks for your home and offices. Each sculpture is lacquered to protect its shine and ensure lifelong durability.' },
      { key: 'shipping_policy', value: 'We offer free insured shipping all over India on orders above ₹10,000. All idols are securely packed in premium multi-layered bubble packaging and wooden crates (where necessary) to prevent damage. Standard delivery takes 3-7 business days.' },
      { key: 'return_policy', value: 'Because each idol is custom electroplated and highly delicate, we accept returns only in case of transit damages. Please record an unboxing video upon receiving the package. If any damage is noticed, notify us within 24 hours with the video for a free replacement.' },
      { key: 'refund_policy', value: 'Refunds are issued only for confirmed transit-damaged orders. Once our team reviews the unboxing video and confirms the damage, a full refund or free replacement will be processed within 7-10 business days. For COD orders, refund will be done via bank transfer. Please contact orders@anantarts.in to initiate a refund claim.' },
      { key: 'privacy_policy', value: 'Anant Arts values your privacy. We store customer emails, shipping details, and purchase records securely in our encrypted Supabase database. We do not share customer information with third parties. Online payments are securely processed through Razorpay. You may contact support@anantarts.in for any privacy-related inquiries.' },
      { key: 'terms_conditions', value: 'By placing an order on anantarts.in, you agree to our terms. All prices are in Indian Rupees (INR) inclusive of applicable taxes. We reserve the right to cancel orders in case of payment failures or stock unavailability. Custom orders are non-refundable unless damaged in transit. Delivery estimates are indicative. For queries, contact support@anantarts.in.' },
      { key: 'faqs_json', value: JSON.stringify([]) }
    ];
 
    for (const setting of defaultSettings) {
      await dbRun('INSERT INTO website_settings (key, value) VALUES (?, ?)', [setting.key, setting.value]);
    }
    console.log('Default settings seeded.');
  }
 
  await dbRun("UPDATE website_settings SET value = 'anantarts39@gmail.com' WHERE key = 'contact_email'");
  await dbRun("UPDATE website_settings SET value = ? WHERE key = 'social_links'", [JSON.stringify({ instagram: 'https://www.instagram.com/anantarts.in?igsh=MXB0d215YzVtZ3Q0aw==' })]);
  await dbRun("UPDATE website_settings SET value = 'rzp_live_TF5Q4XYGrKlT1b' WHERE key = 'razorpay_key_id'");

  // Force update existing categories to the premium banners
  const newBanners = [
    { slug: 'idols', path: '/uploads/category-idols.png' },
    { slug: 'spiritual-collection', path: '/uploads/category-spiritual-collection.png' },
    { slug: 'home-decor', path: '/uploads/category-home-decor.png' },
    { slug: 'corporate-gifts', path: '/uploads/category-corporate-gifts.png' },
    { slug: 'decorative-figurines', path: '/uploads/category-decorative-figurines.png' },
    { slug: 'festive-gifts', path: '/uploads/category-festive-gifts.png' },
    { slug: 'customized-products', path: '/uploads/category-customized-products.png' },
    { slug: 'premium-collectibles', path: '/uploads/category-premium-collectibles.png' },
    { slug: 'new-arrivals', path: '/uploads/category-new-arrivals.png' }
  ];
  for (const banner of newBanners) {
    await dbRun("UPDATE categories SET image_path = ? WHERE slug = ?", [banner.path, banner.slug]);
  }

  // Seed WhatsApp settings if not exist
  const wpSettings = [
    { key: 'whatsapp_notifications_enabled', value: '1' },
    { key: 'whatsapp_admin_number', value: '917275819354' },
    { key: 'whatsapp_message_template', value: "🛒 *New Order Received – Anant Arts*\n\nOrder ID: {{order_id}}\n\nCustomer Name: {{customer_name}}\nMobile Number: {{customer_phone}}\nEmail: {{customer_email}}\n\nProducts Ordered:\n{{product_list}}\n\nTotal Amount: ₹{{order_total}}\n\nPayment Method: {{payment_method}}\nPayment Status: {{payment_status}}\n\nDelivery Address:\n{{full_address}}\n\nOrder Date:\n{{order_date}}\n\nView Order:\n{{admin_order_link}}\n\nPlease process this order as soon as possible." }
  ];
  for (const s of wpSettings) {
    const exists = await dbGet('SELECT * FROM website_settings WHERE key = ?', [s.key]);
    if (!exists) {
      await dbRun('INSERT INTO website_settings (key, value) VALUES (?, ?)', [s.key, s.value]);
    }
  }

  // 8. Seed Luxury Marketing Templates
  await seedMarketingTemplates();
}

async function seedMarketingTemplates() {
  try {
    const tplCount = await dbGet('SELECT COUNT(*) as count FROM marketing_templates');
    if (parseInt(tplCount?.count || 0) > 0) return;

    const defaultTemplates = [
      {
        name: 'New Collection — 24K Gold & Silver Sculptures',
        type: 'email',
        category: 'new_arrival',
        subject: '🪷 Discover New Sacred 24K Gold Sculptures | Anant Arts',
        preview_text: 'Handcrafted divine masterpieces with certified 24K gold electroplating for your home temple.',
        body_html: `<div style="text-align: center; margin-bottom: 24px;">
  <span style="display: inline-block; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #AA7C11; font-weight: 700; background: #FFF8F0; padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(212,175,55,0.3);">✨ New Sacred Masterpieces</span>
  <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; color: #1E1A17; margin: 12px 0 8px 0; font-weight: 700;">Elevate Your Sacred Sanctuary</h2>
  <p style="font-size: 14px; color: #6E5A5A; max-width: 480px; margin: 0 auto; line-height: 1.6;">Namaste {{name}}, master artisans at Anant Arts have unveiled our most exquisite collection of 24K gold electroplated idols, sculpted with eternal grace.</p>
</div>

<div style="background: #FFF8F0; border: 1px solid rgba(212,175,55,0.25); border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
  <p style="margin: 0; font-size: 13px; color: #3B2F2F; font-weight: 600;">✨ Certified 24K Gold Electroplating &bull; 🚚 Insured Express Pan-India Delivery &bull; 🪷 Sanctified Artistry</p>
</div>

<!-- PRODUCT_CARDS_PLACEHOLDER -->

<div style="text-align: center; margin-top: 32px;">
  <a href="https://anantarts.in/shop" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%); color: #111111; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 15px rgba(212,175,55,0.35);">Explore Entire Collection</a>
</div>`,
        body_text: `Namaste {{name}},\n\nDiscover our latest handcrafted 24K gold electroplated spiritual collection at Anant Arts.\n\nCertified 24K Gold Electroplating | Insured Pan-India Shipping\n\nExplore the collection: https://anantarts.in/shop\n\nBringing Divine Art to Every Home.\nAnant Arts`,
        is_system: 1
      },
      {
        name: 'Festive Auspicious Blessings (Diwali & Navratri)',
        type: 'email',
        category: 'festival',
        subject: '🪔 Auspicious Festive Blessings for Your Home Mandir | Anant Arts',
        preview_text: 'Invite prosperity, light, and grace into your sacred sanctuary this auspicious season.',
        body_html: `<div style="text-align: center; margin-bottom: 24px;">
  <span style="display: inline-block; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #D4AF37; font-weight: 700; background: #1E1A17; padding: 4px 14px; border-radius: 20px;">🪔 Auspicious Festive Celebration</span>
  <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; color: #1E1A17; margin: 12px 0 8px 0; font-weight: 700;">Illuminate Your Mandir with Divine Radiance</h2>
  <p style="font-size: 14px; color: #6E5A5A; max-width: 480px; margin: 0 auto; line-height: 1.6;">Namaste {{name}}, as celebrations begin, invite the blessings of Goddess Lakshmi and Lord Ganesha into your family home with masterfully electroplated idols.</p>
</div>

<div style="background: linear-gradient(135deg, #FFF8F0 0%, #F5ECD7 100%); border: 1px solid #D4AF37; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
  <span style="font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #8C2425; font-weight: 700;">Festive Special Blessing</span>
  <h3 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; color: #1E1A17; margin: 6px 0 10px 0;">Enjoy 10% Off with Code <span style="color: #AA7C11; border-bottom: 2px dashed #AA7C11;">DIVINE10</span></h3>
  <p style="font-size: 13px; color: #6E5A5A; margin: 0;">Valid on all orders above ₹5,000. Free insured shipping across India.</p>
</div>

<!-- PRODUCT_CARDS_PLACEHOLDER -->

<div style="text-align: center; margin-top: 32px;">
  <a href="https://anantarts.in/shop" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%); color: #111111; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; box-shadow: 0 4px 15px rgba(212,175,55,0.35);">Shop Festive Collection</a>
</div>`,
        body_text: `Namaste {{name}},\n\nCelebrate the festive season with auspicious blessings from Anant Arts. Enjoy 10% off your sacred idol with code DIVINE10 on orders above ₹5,000.\n\nShop now: https://anantarts.in/shop\n\nAnant Arts — Bringing Divine Art to Every Home`,
        is_system: 1
      },
      {
        name: 'Special Auspicious Offer — Exclusive Discount',
        type: 'email',
        category: 'offer',
        subject: '🎁 Exclusive Auspicious Blessing for You | Anant Arts',
        preview_text: 'A curated gift voucher for our cherished patrons and devotees.',
        body_html: `<div style="text-align: center; margin-bottom: 24px;">
  <span style="display: inline-block; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #2E7D32; font-weight: 700; background: #E8F5E9; padding: 4px 12px; border-radius: 20px;">🎁 Patron Appreciation Blessing</span>
  <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; color: #1E1A17; margin: 12px 0 8px 0; font-weight: 700;">An Exclusive Token of Reverence</h2>
  <p style="font-size: 14px; color: #6E5A5A; max-width: 480px; margin: 0 auto; line-height: 1.6;">Namaste {{name}}, as a valued patron of handcrafted spiritual heritage, we are delighted to offer you a private concession towards your next sacred idol.</p>
</div>

<div style="border: 2px dashed #D4AF37; background: #FFFDF8; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
  <span style="font-size: 12px; color: #6E5A5A; text-transform: uppercase; letter-spacing: 1px;">Your Exclusive Coupon Code</span>
  <div style="font-family: monospace; font-size: 28px; font-weight: 800; color: #AA7C11; letter-spacing: 4px; margin: 10px 0;">DIVINE10</div>
  <p style="font-size: 13px; color: #3B2F2F; margin: 0;">Apply at checkout for <strong>10% instant concession</strong> + Free Insured Delivery.</p>
</div>

<!-- PRODUCT_CARDS_PLACEHOLDER -->

<div style="text-align: center; margin-top: 32px;">
  <a href="https://anantarts.in/shop" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%); color: #111111; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">Claim Your Blessing Now</a>
</div>`,
        body_text: `Namaste {{name}},\n\nEnjoy 10% off your next sacred idol order at Anant Arts with code: DIVINE10.\n\nShop our handcrafted collection: https://anantarts.in/shop\n\nAnant Arts`,
        is_system: 1
      },
      {
        name: 'Order Follow-up & Reverence Check',
        type: 'email',
        category: 'follow_up',
        subject: '🙏 How is Your Sacred Idol Resonating in Your Sanctuary?',
        preview_text: 'We would be deeply honoured to hear your experience with Anant Arts.',
        body_html: `<div style="text-align: center; margin-bottom: 24px;">
  <span style="font-size: 2.2rem; display: block; margin-bottom: 8px;">🪷</span>
  <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #1E1A17; margin: 8px 0; font-weight: 700;">A Sacred Relationship</h2>
  <p style="font-size: 14px; color: #6E5A5A; max-width: 480px; margin: 0 auto; line-height: 1.6;">Namaste {{name}}, we hope your newly received Anant Arts sculpture has brought tranquility, harmony, and divine radiance into your home.</p>
</div>

<div style="background: #FAF9F6; border-left: 3px solid #D4AF37; padding: 18px 20px; border-radius: 0 8px 8px 0; margin: 24px 0; font-size: 13.5px; color: #3B2F2F; line-height: 1.6;">
  <p style="margin: 0 0 10px 0;"><strong>Care Tip for Your Electroplated Idol:</strong></p>
  <p style="margin: 0;">Gently wipe with a soft microfibre cloth. Avoid harsh chemical cleaners or abrasive liquids to preserve the lustrous 24K gold lacquer for decades.</p>
</div>

<div style="text-align: center; margin-top: 32px;">
  <p style="font-size: 14px; color: #3B2F2F; margin-bottom: 16px;">Have feedback or wish to share pictures of your mandir setup?</p>
  <a href="mailto:support@anantarts.in" style="display: inline-block; background: #1E1A17; color: #D4AF37; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 13px; border: 1px solid #D4AF37;">Share Your Thoughts with Us</a>
</div>`,
        body_text: `Namaste {{name}},\n\nWe hope your sacred idol has brought peace and divine radiance to your home sanctuary. For any care advice or feedback, reply directly to support@anantarts.in.\n\nAnant Arts`,
        is_system: 1
      },
      {
        name: 'Welcome to the Anant Arts Inner Circle',
        type: 'email',
        category: 'welcome',
        subject: '✨ Welcome to Anant Arts — Where Heritage Meets Divine Art',
        preview_text: 'Discover the artisanal electroplating legacy and master sculptures of India.',
        body_html: `<div style="text-align: center; margin-bottom: 24px;">
  <span style="display: inline-block; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #AA7C11; font-weight: 700; background: #FFF8F0; padding: 4px 12px; border-radius: 20px;">🪷 Welcome to the Sanctuary</span>
  <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; color: #1E1A17; margin: 12px 0 8px 0; font-weight: 700;">Bringing Divine Art to Every Home</h2>
  <p style="font-size: 14px; color: #6E5A5A; max-width: 500px; margin: 0 auto; line-height: 1.6;">Namaste {{name}}, welcome to Anant Arts. We are dedicated to creating timeless electroplated sculptures of deities and luxury Indian home decor with unwavering devotion and uncompromising quality.</p>
</div>

<div style="display: grid; grid-template-columns: 1fr; gap: 16px; margin: 24px 0;">
  <div style="background: #FFFFFF; border: 1px solid #EAEAEA; border-radius: 8px; padding: 16px; display: flex; gap: 14px; align-items: center;">
    <span style="font-size: 24px;">🏆</span>
    <div>
      <h4 style="margin: 0 0 4px 0; font-size: 14px; color: #1E1A17;">Certified 24K Gold Plating</h4>
      <p style="margin: 0; font-size: 12px; color: #6E5A5A;">Thick electroplated gold layer protected with high-gloss lacquer.</p>
    </div>
  </div>
  <div style="background: #FFFFFF; border: 1px solid #EAEAEA; border-radius: 8px; padding: 16px; display: flex; gap: 14px; align-items: center;">
    <span style="font-size: 24px;">📦</span>
    <div>
      <h4 style="margin: 0 0 4px 0; font-size: 14px; color: #1E1A17;">Secure Transit Guarantee</h4>
      <p style="margin: 0; font-size: 12px; color: #6E5A5A;">Multi-layered protective packaging ensuring zero damage in transit.</p>
    </div>
  </div>
</div>

<div style="text-align: center; margin-top: 28px;">
  <a href="https://anantarts.in/shop" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%); color: #111111; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">Explore Our Collections</a>
</div>`,
        body_text: `Namaste {{name}},\n\nWelcome to Anant Arts. Explore our certified 24K gold and silver electroplated idols handcrafted for your home mandir.\n\nVisit: https://anantarts.in\n\nAnant Arts`,
        is_system: 1
      },
      {
        name: 'Bespoke Corporate Gifting & Executive Masterpieces',
        type: 'email',
        category: 'corporate',
        subject: '💼 Elevated Auspicious Gifting for Esteemed Partners | Anant Arts',
        preview_text: 'Custom engraved 24K gold & silver plated gifts in bespoke wooden presentation boxes.',
        body_html: `<div style="text-align: center; margin-bottom: 24px;">
  <span style="display: inline-block; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #1E1A17; font-weight: 700; background: #EAEAEA; padding: 4px 12px; border-radius: 20px;">🏛️ Executive & Institutional Gifting</span>
  <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; color: #1E1A17; margin: 12px 0 8px 0; font-weight: 700;">Gifts of Distinction & Eternal Reverence</h2>
  <p style="font-size: 14px; color: #6E5A5A; max-width: 480px; margin: 0 auto; line-height: 1.6;">Namaste {{name}}, express gratitude to VIP clients, board members, and executives with bespoke electroplated masterworks carrying timeless auspicious symbolism.</p>
</div>

<div style="background: #FAF9F6; border: 1px solid rgba(212,175,55,0.3); border-radius: 8px; padding: 20px; margin: 24px 0;">
  <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #3B2F2F; line-height: 1.8;">
    <li>Custom logo and donor brass plate engraving</li>
    <li>Handcrafted teak wood presentation cases</li>
    <li>Certificate of authenticity & craftsmanship</li>
    <li>Tiered pricing for bulk orders (10+ units)</li>
  </ul>
</div>

<div style="text-align: center; margin-top: 32px;">
  <a href="https://anantarts.in/occasions" style="display: inline-block; background: #1E1A17; color: #D4AF37; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; border: 1px solid #D4AF37;">Inquire Corporate Catalogs</a>
</div>`,
        body_text: `Namaste {{name}},\n\nElevate corporate gifting with custom-engraved 24K gold and silver electroplated masterpieces from Anant Arts.\n\nInquire now: https://anantarts.in/occasions\n\nAnant Arts`,
        is_system: 1
      },
      {
        name: 'Back in Stock — Limited Edition Idols Restocked',
        type: 'email',
        category: 'general',
        subject: '🔔 Restocked: Handcrafted Sacred Idols Now Available',
        preview_text: 'Strictly limited artisan-crafted batches now available for immediate dispatch.',
        body_html: `<div style="text-align: center; margin-bottom: 24px;">
  <span style="display: inline-block; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #1565C0; font-weight: 700; background: #E3F2FD; padding: 4px 12px; border-radius: 20px;">🔔 Restock Announcement</span>
  <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; color: #1E1A17; margin: 12px 0 8px 0; font-weight: 700;">Your Revered Masterpieces are Back</h2>
  <p style="font-size: 14px; color: #6E5A5A; max-width: 480px; margin: 0 auto; line-height: 1.6;">Namaste {{name}}, our master artisans have completed a fresh handcrafted batch of high-demand 24K gold electroplated deity idols.</p>
</div>

<!-- PRODUCT_CARDS_PLACEHOLDER -->

<div style="text-align: center; margin-top: 32px;">
  <a href="https://anantarts.in/shop" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%); color: #111111; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">Reserve Your Idol</a>
</div>`,
        body_text: `Namaste {{name}},\n\nOur limited-edition 24K gold idols have been restocked in limited quantities. Order yours before stock runs out: https://anantarts.in/shop\n\nAnant Arts`,
        is_system: 1
      },
      {
        name: 'Incomplete Inquiry / Sanctuary Pending',
        type: 'email',
        category: 'cart_recovery',
        subject: '🪷 Your Sacred Masterpiece Awaits You | Anant Arts',
        preview_text: 'Your chosen 24K gold idol is reserved. Complete your order with free insured shipping.',
        body_html: `<div style="text-align: center; margin-bottom: 24px;">
  <span style="font-size: 2rem; display: block; margin-bottom: 8px;">🪷</span>
  <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 24px; color: #1E1A17; margin: 8px 0; font-weight: 700;">Your Sacred Sanctuary Awaits</h2>
  <p style="font-size: 14px; color: #6E5A5A; max-width: 480px; margin: 0 auto; line-height: 1.6;">Namaste {{name}}, we noticed you were admiring our handcrafted electroplated idols. We have placed a temporary hold on your selected piece to ensure you do not miss it.</p>
</div>

<div style="background: #FFF8F0; border: 1px solid #D4AF37; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
  <p style="margin: 0 0 10px 0; font-size: 13.5px; color: #3B2F2F; font-weight: 600;">Complete your order today and enjoy complimentary insured wooden-crate delivery across India.</p>
  <span style="font-size: 12px; color: #AA7C11;">Need guidance choosing the right deity or dimensions? Reply to this email anytime.</span>
</div>

<div style="text-align: center; margin-top: 28px;">
  <a href="https://anantarts.in/cart" style="display: inline-block; background: linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%); color: #111111; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">Complete Your Order</a>
</div>`,
        body_text: `Namaste {{name}},\n\nYour chosen sacred idol is waiting for you. Complete your order with free insured shipping at: https://anantarts.in/cart\n\nAnant Arts`,
        is_system: 1
      },
      // WhatsApp Templates
      {
        name: 'WA — New Sacred Collection Launch',
        type: 'whatsapp',
        category: 'new_arrival',
        subject: null,
        preview_text: null,
        body_html: null,
        body_text: `Namaste {{name}},\n\nDiscover our latest handcrafted 24K Gold & Silver spiritual collection at Anant Arts.\n\n✨ Certified 24K Electroplating\n🚚 Insured Express Shipping Across India\n🪷 Handcrafted by Master Artisans\n\nExplore the collection:\n{{product_link}}\n\nBringing Divine Art to Every Home.\nAnant Arts`,
        is_system: 1
      },
      {
        name: 'WA — Festive Blessings & Special Concession',
        type: 'whatsapp',
        category: 'festival',
        subject: null,
        preview_text: null,
        body_html: null,
        body_text: `🪔 Auspicious Greetings {{name}},\n\nMay this sacred season bring abundance and prosperity to your home.\n\nEnjoy an exclusive festive blessing on handcrafted temple idols:\n🎁 Use Code: {{discount_code}}\n\nExplore Divine Idols:\n{{website_link}}/shop\n\nAnant Arts — Bringing Divine Art to Every Home`,
        is_system: 1
      },
      {
        name: 'WA — Order Reverence & Care Follow-up',
        type: 'whatsapp',
        category: 'follow_up',
        subject: null,
        preview_text: null,
        body_html: null,
        body_text: `Namaste {{name}},\n\nWe hope your sacred idol from Anant Arts has illuminated your home sanctuary with divine energy.\n\nFor idol care guides, mandir placement advice, or any personal assistance, feel free to reply directly to this message.\n\nWith warm regards,\nAnant Arts Team`,
        is_system: 1
      },
      {
        name: 'WA — Bespoke Corporate Gifting',
        type: 'whatsapp',
        category: 'corporate',
        subject: null,
        preview_text: null,
        body_html: null,
        body_text: `Namaste {{name}},\n\nElevate your executive and corporate gifting with handcrafted 24K Gold & Silver plated sculptures from Anant Arts. We provide custom brass engraving and bespoke wooden presentation packaging.\n\nDiscover Corporate Gifting:\n{{website_link}}/occasions\n\nAnant Arts`,
        is_system: 1
      }
    ];

    for (const t of defaultTemplates) {
      await dbRun(
        `INSERT INTO marketing_templates (name, type, category, subject, preview_text, body_html, body_text, is_system, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [t.name, t.type, t.category, t.subject, t.preview_text, t.body_html, t.body_text, t.is_system, 'system']
      );
    }
    console.log('Default luxury marketing templates seeded successfully.');
  } catch (err) {
    console.error('Failed to seed marketing templates:', err.message);
  }
}

module.exports = {
  db,
  initDb,
  dbRun,
  dbAll,
  dbGet,
  reconnectDb,
  closeDb,
  dbPath,
  isPostgres: () => isPostgres
};
