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

async function initDb() {
  // Create tables in order
  await dbExec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
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
  `);

  console.log('Database tables verified/created successfully.');

  // Seed default data if empty
  await seedDefaultData();
}

async function seedDefaultData() {
  // 1. Seed default Admin User
  const adminEmail = 'admin@anantarts.com';
  const adminUser = await dbGet('SELECT * FROM users WHERE email = ?', [adminEmail]);
  if (!adminUser) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    await dbRun(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Anant Arts Admin', adminEmail, passwordHash, 'admin']
    );
    console.log('Default admin seeded: admin@anantarts.com / admin123');
  }

  // 2. Seed default Categories
  const categoryCount = await dbGet('SELECT COUNT(*) as count FROM categories');
  let categoryMap = {};
  if (parseInt(categoryCount.count) === 0) {
    const defaultCategories = [
      { name: 'Lord Ganesha', slug: 'lord-ganesha', image_path: '/uploads/category-ganesha.jpg', sort_order: 1 },
      { name: 'Lord Krishna', slug: 'lord-krishna', image_path: '/uploads/category-krishna.jpg', sort_order: 2 },
      { name: 'Lord Shiva', slug: 'lord-shiva', image_path: '/uploads/category-shiva.jpg', sort_order: 3 },
      { name: 'Goddess Lakshmi', slug: 'goddess-lakshmi', image_path: '/uploads/category-lakshmi.jpg', sort_order: 4 },
      { name: 'Lord Hanuman', slug: 'lord-hanuman', image_path: '/uploads/category-hanuman.jpg', sort_order: 5 },
      { name: 'Other God Idols', slug: 'other-god-idols', image_path: '/uploads/category-others.jpg', sort_order: 6 }
    ];
    for (const cat of defaultCategories) {
      const res = await dbRun(
        'INSERT INTO categories (name, slug, image_path, sort_order) VALUES (?, ?, ?, ?)',
        [cat.name, cat.slug, cat.image_path, cat.sort_order]
      );
      categoryMap[cat.slug] = res.id;
    }
    console.log('Default categories seeded.');
  } else {
    const rows = await dbAll('SELECT id, slug FROM categories');
    rows.forEach(r => { categoryMap[r.slug] = r.id; });
  }

  // 3. Seed default Products
  const productCount = await dbGet('SELECT COUNT(*) as count FROM products');
  if (parseInt(productCount.count) === 0) {
    const defaultProducts = [
      {
        name: 'Divine 24K Gold Electroplated Ganesha Idol',
        slug: 'divine-24k-gold-ganesha-idol',
        description: 'Invite prosperity, wisdom, and success into your home with this breathtaking 24K gold electroplated Ganesha idol. Meticulously handcrafted by master artisans, this sculpture showcases intricate details of Lord Ganesha’s crown and ornaments. Features a high-gloss protective lacquer coating that ensures the gold shines brilliantly for decades.',
        category_slug: 'lord-ganesha',
        price: 18999,
        discount_price: 15499,
        sku: 'AA-GAN-001',
        material: 'Premium Brass & 24K Gold Electroplating',
        dimensions: '8.5 x 5.0 x 10.5 Inches',
        weight: 3.2,
        stock_quantity: 15,
        tags: JSON.stringify(['Featured', 'Best Seller']),
        images: ['/uploads/ganesha-gold-1.jpg', '/uploads/ganesha-gold-2.jpg']
      },
      {
        name: 'Lord Krishna Flute Playing Elegant Idol',
        slug: 'lord-krishna-flute-elegant-idol',
        description: 'Bring the divine aura of Gokul with this stunning, electroplated silver & gold dual-tone Krishna idol. Capturing Lord Krishna in his signature tribhanga posture playing the flute, this statue features fine embellishments, from the peacock feather in his crown to the detailed folds of his dhoti. Perfect for home temples or luxury gifting.',
        category_slug: 'lord-krishna',
        price: 24999,
        discount_price: 19999,
        sku: 'AA-KRI-001',
        material: 'Premium Brass, Silver & Gold Electroplating',
        dimensions: '6.0 x 4.5 x 12.0 Inches',
        weight: 4.1,
        stock_quantity: 8,
        tags: JSON.stringify(['Featured', 'New Arrival']),
        images: ['/uploads/krishna-gold-1.jpg', '/uploads/krishna-gold-2.jpg']
      },
      {
        name: 'Meditating Lord Shiva Antique Bronze & Gold Idol',
        slug: 'meditating-shiva-bronze-gold-idol',
        description: 'Immerse your space in meditative tranquility with this Lord Shiva idol in dhyana mudra. Finished in antique bronze with brilliant 24k gold electroplated highlights on his trident, snake, and hair accents. Designed to radiate peace, focus, and strength in your home or meditation room.',
        category_slug: 'lord-shiva',
        price: 21999,
        discount_price: 17999,
        sku: 'AA-SHI-001',
        material: 'Composite Brass, Antique Bronze & Gold Electroplating',
        dimensions: '9.0 x 6.0 x 11.0 Inches',
        weight: 5.0,
        stock_quantity: 5,
        tags: JSON.stringify(['Best Seller']),
        images: ['/uploads/shiva-gold-1.jpg']
      },
      {
        name: 'Goddess Lakshmi Ashta-Lakshmi Blessing Idol',
        slug: 'goddess-lakshmi-blessing-idol',
        description: 'Welcome wealth, abundance, and auspiciousness with this exquisite Goddess Lakshmi idol. Seated gracefully on a double-lotus pedestal, the goddess holds twin lotus flowers, with coins falling from her front hand. Electroplated in radiant 24k gold for a timeless premium finish.',
        category_slug: 'goddess-lakshmi',
        price: 16999,
        discount_price: 13999,
        sku: 'AA-LAK-001',
        material: 'Premium Brass & 24K Gold Electroplating',
        dimensions: '7.0 x 5.0 x 9.0 Inches',
        weight: 2.8,
        stock_quantity: 20,
        tags: JSON.stringify(['Featured', 'Best Seller', 'Festival Special']),
        images: ['/uploads/lakshmi-gold-1.jpg', '/uploads/lakshmi-gold-2.jpg']
      },
      {
        name: 'Veer Hanuman Sanjeevani Mountain Lift Idol',
        slug: 'veer-hanuman-sanjeevani-mountain-idol',
        description: 'Celebrate the symbol of strength, courage, and devotion with this dynamic Lord Hanuman idol, depicting him carrying the Sanjeevani mountain. The electroplated copper and gold finish highlights the muscular detail and vigorous action of the deity. Ideal for study rooms, offices, and living rooms.',
        category_slug: 'lord-hanuman',
        price: 19999,
        discount_price: 16499,
        sku: 'AA-HAN-001',
        material: 'Brass, Copper & Gold Electroplating',
        dimensions: '8.0 x 5.5 x 11.5 Inches',
        weight: 3.8,
        stock_quantity: 12,
        tags: JSON.stringify(['New Arrival']),
        images: ['/uploads/hanuman-gold-1.jpg']
      }
    ];

    for (const prod of defaultProducts) {
      const categoryId = categoryMap[prod.category_slug] || null;
      const res = await dbRun(
        `INSERT INTO products (name, slug, description, category_id, price, discount_price, sku, material, dimensions, weight, stock_quantity, is_published, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [prod.name, prod.slug, prod.description, categoryId, prod.price, prod.discount_price, prod.sku, prod.material, prod.dimensions, prod.weight, prod.stock_quantity, prod.tags]
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
      { key: 'contact_email', value: 'hemant4507vns@gmail.com' },
      { key: 'contact_phone', value: '+91 72758 19354' },
      { key: 'contact_address', value: 'Bhoirwadi, Dombivli East, Maharashtra' },
      { key: 'razorpay_key_id', value: '' },
      { key: 'social_links', value: JSON.stringify({ instagram: 'https://instagram.com/anantarts', facebook: 'https://facebook.com/anantarts', youtube: 'https://youtube.com/anantarts' }) },
      { key: 'about_us_text', value: 'Anant Arts is a premium Indian brand specializing in manufacturing high-end electroplated idols of Hindu gods and goddesses. Based in New Delhi, we blend centuries-old craftsmanship with modern electroplating technology (using 24K gold, fine silver, and copper) to create timeless spiritual masterworks for your home and offices. Each sculpture is lacquered to protect its shine and ensure lifelong durability.' },
      { key: 'shipping_policy', value: 'We offer free insured shipping all over India on orders above ₹10,000. All idols are securely packed in premium multi-layered bubble packaging and wooden crates (where necessary) to prevent damage. Standard delivery takes 3-7 business days.' },
      { key: 'return_policy', value: 'Because each idol is custom electroplated and highly delicate, we accept returns only in case of transit damages. Please record an unboxing video upon receiving the package. If any damage is noticed, notify us within 24 hours with the video for a free replacement.' },
      { key: 'privacy_policy', value: 'Anant Arts values your privacy. We store customer emails, shipping details, and purchase records securely. We do not share customer information with third parties. Online payments are securely processed through Razorpay Sandbox and UPI networks.' }
    ];

    for (const setting of defaultSettings) {
      await dbRun('INSERT INTO website_settings (key, value) VALUES (?, ?)', [setting.key, setting.value]);
    }
    console.log('Default settings seeded.');
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
