// Load environment variables
require('dotenv').config();

const express = require('express');
const https = require('https');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const PDFDocument = require('pdfkit');

const {
  initDb,
  dbRun,
  dbAll,
  dbGet,
  closeDb,
  reconnectDb,
  dbPath,
  isPostgres
} = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'anant_arts_divine_key_999';

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Express middle-wares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// Multer Disk storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({ storage });

// Admin Authentication Middleware
const authenticateAdmin = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized. Please sign in.' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') throw new Error();
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.status(401).json({ message: 'Session expired. Please sign in.' });
  }
};

// ==================== AUTH API ====================

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    
    return res.json({ message: 'Login successful', role: user.role });
  } catch (err) {
    return res.status(500).json({ message: 'Login execution failed.' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Log out successful.' });
});

app.get('/api/auth/check', authenticateAdmin, (req, res) => {
  return res.json({ status: 'authenticated', user: req.user });
});


// ==================== WEBSITE SETTINGS ====================

app.get('/api/settings', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM website_settings');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    return res.json(settings);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve website settings.' });
  }
});

app.get('/api/banners', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM banners ORDER BY sort_order ASC');
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve banners.' });
  }
});

app.get('/api/testimonials', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM testimonials WHERE is_approved = 1 ORDER BY created_at DESC');
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load testimonials.' });
  }
});


// ==================== CATEGORY API ====================

app.get('/api/categories', async (req, res) => {
  const type = req.query.type || '';
  try {
    let query = 'SELECT * FROM categories';
    let params = [];
    if (type) {
      query += ' WHERE type = ?';
      params.push(type);
    }
    query += ' ORDER BY sort_order ASC';
    const rows = await dbAll(query, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load categories.' });
  }
});


// ==================== PRODUCT API ====================

app.get('/api/products', async (req, res) => {
  const { search, categories, sort, maxPrice, inStock, all } = req.query;
  
  let query = `
    SELECT p.*, c.name as category_name, 
           (SELECT image_path FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image_path
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (!all) {
    query += ' AND p.is_published = 1';
  }

  if (search) {
    query += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  if (categories) {
    const categorySlugs = categories.split(',');
    const placeholders = categorySlugs.map(() => '?').join(',');
    query += ` AND c.slug IN (${placeholders})`;
    params.push(...categorySlugs);
  }

  if (maxPrice) {
    query += ' AND (CASE WHEN p.discount_price IS NOT NULL AND p.discount_price > 0 THEN p.discount_price ELSE p.price END) <= ?';
    params.push(parseFloat(maxPrice));
  }

  if (inStock === '1') {
    query += ' AND p.stock_quantity > 0';
  }

  // Sort logic
  if (sort === 'price-low') {
    query += ' ORDER BY (CASE WHEN p.discount_price IS NOT NULL AND p.discount_price > 0 THEN p.discount_price ELSE p.price END) ASC';
  } else if (sort === 'price-high') {
    query += ' ORDER BY (CASE WHEN p.discount_price IS NOT NULL AND p.discount_price > 0 THEN p.discount_price ELSE p.price END) DESC';
  } else if (sort === 'latest') {
    query += ' ORDER BY p.created_at DESC';
  } else {
    // Default popularity / sort
    query += ' ORDER BY p.id DESC';
  }

  try {
    const rows = await dbAll(query, params);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve products.' });
  }
});

app.get('/api/products/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const product = await dbGet(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ?
    `, [slug]);

    if (!product) return res.status(404).json({ message: 'Product not found.' });

    const images = await dbAll('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC', [product.id]);
    
    // Inject primary image if missing in product_images
    if (images.length > 0) {
      product.image_path = images.find(img => img.is_primary)?.image_path || images[0].image_path;
    } else {
      product.image_path = '/uploads/placeholder.jpg';
    }

    return res.json({ product, images });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load product details.' });
  }
});

app.get('/api/products/:id/related', async (req, res) => {
  const { id } = req.params;
  try {
    const prod = await dbGet('SELECT category_id FROM products WHERE id = ?', [id]);
    if (!prod) return res.status(404).json({ message: 'Product not found.' });

    const related = await dbAll(`
      SELECT p.*, c.name as category_name,
             (SELECT image_path FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image_path
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ? AND p.id != ? AND p.is_published = 1
      LIMIT 4
    `, [prod.category_id, id]);

    return res.json(related);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load related products.' });
  }
});


// ==================== REVIEWS API ====================

app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM reviews WHERE product_id = ? AND is_approved = 1 ORDER BY created_at DESC', [req.params.id]);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve reviews.' });
  }
});

app.post('/api/products/:id/reviews', async (req, res) => {
  const { id } = req.params;
  const { reviewer_name, reviewer_email, rating, comment } = req.body;

  if (!reviewer_name || !reviewer_email || !rating) {
    return res.status(400).json({ message: 'Missing review requirements.' });
  }

  try {
    await dbRun(
      'INSERT INTO reviews (product_id, reviewer_name, reviewer_email, rating, comment, is_approved) VALUES (?, ?, ?, ?, ?, 1)',
      [id, reviewer_name, reviewer_email, parseInt(rating), comment]
    );
    return res.json({ message: 'Review posted successfully!' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to record review.' });
  }
});


// ==================== COUPON APIS ====================

app.post('/api/coupons/apply', async (req, res) => {
  const { code, amount } = req.body;
  if (!code) return res.status(400).json({ message: 'Coupon code required.' });

  try {
    const coupon = await dbGet('SELECT * FROM coupons WHERE code = ? AND is_active = 1', [code]);
    if (!coupon) return res.status(404).json({ message: 'Coupon invalid or expired.' });

    // Validate limit counts
    if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
      return res.status(400).json({ message: 'Coupon usage limit exceeded.' });
    }

    // Validate min amount
    if (amount < coupon.min_order_amount) {
      return res.status(400).json({ message: `Minimum order amount of ₹${coupon.min_order_amount} required.` });
    }

    return res.json({ message: 'Coupon eligible', coupon });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to evaluate coupon.' });
  }
});


// ==================== ORDERS API ====================

app.post('/api/orders', async (req, res) => {
  const {
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    billing_address,
    coupon_code,
    discount_amount,
    shipping_charge,
    subtotal,
    total_amount,
    payment_method,
    payment_status,
    notes,
    items
  } = req.body;

  if (!customer_name || !customer_email || !customer_phone || !shipping_address || !items || items.length === 0) {
    return res.status(400).json({ message: 'Missing billing details or order items.' });
  }

  const orderNumber = 'AA-' + Date.now();

  try {
    // 1. Get coupon ID if code applied
    let couponId = null;
    if (coupon_code) {
      const c = await dbGet('SELECT id FROM coupons WHERE code = ?', [coupon_code]);
      if (c) {
        couponId = c.id;
        await dbRun('UPDATE coupons SET times_used = times_used + 1 WHERE id = ?', [couponId]);
      }
    }

    // 2. Insert main order row
    const orderRes = await dbRun(`
      INSERT INTO orders (
        order_number, customer_name, customer_email, customer_phone,
        shipping_address, billing_address, coupon_id, discount_amount,
        shipping_charge, subtotal, total_amount, payment_method,
        payment_status, order_status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
    `, [
      orderNumber, customer_name, customer_email, customer_phone,
      shipping_address, billing_address, couponId, discount_amount || 0,
      shipping_charge || 0, subtotal, total_amount, payment_method,
      payment_status || 'Pending', notes
    ]);

    const orderId = orderRes.id;

    // 3. Insert items and decrement stock
    for (const item of items) {
      await dbRun(`
        INSERT INTO order_items (order_id, product_id, product_name, price, quantity, total_price)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [orderId, item.product_id, item.product_name, item.price, item.quantity, item.price * item.quantity]);

      // Decrement stock
      await dbRun('UPDATE products SET stock_quantity = MAX(0, stock_quantity - ?) WHERE id = ?', [item.quantity, item.product_id]);
    }

    // 4. Create internal Admin Notification
    await dbRun(
      'INSERT INTO notifications (message, type, link) VALUES (?, ?, ?)',
      [`New Order #${orderNumber} placed by ${customer_name} - ₹${total_amount.toLocaleString()}`, 'order_placed', `/api/admin/orders`]
    );

    // 5. Check if any items have low stock after purchase
    for (const item of items) {
      const prod = await dbGet('SELECT stock_quantity, sku, name FROM products WHERE id = ?', [item.product_id]);
      if (prod && prod.stock_quantity < 5) {
        await dbRun(
          'INSERT INTO notifications (message, type, link) VALUES (?, ?, ?)',
          [`Low Stock Alert: ${prod.name} (${prod.sku}) has only ${prod.stock_quantity} left!`, 'low_stock', '/api/admin/products']
        );
      }
    }

    // 6. Trigger Admin WhatsApp Notification
    try {
      const apiKeyRow = await dbGet("SELECT value FROM website_settings WHERE key = 'whatsapp_admin_apikey'");
      const apiKey = apiKeyRow ? apiKeyRow.value : '';
      const adminPhoneRow = await dbGet("SELECT value FROM website_settings WHERE key = 'whatsapp_number'");
      const adminPhone = adminPhoneRow ? adminPhoneRow.value : '917275819354';

      // Build notification text
      const itemsList = items.map(i => `${i.product_name} (x${i.quantity})`).join(', ');
      const messageText = `New Order Placed! 🎉\n\n` +
                          `Order No: #${orderNumber}\n` +
                          `Customer: ${customer_name}\n` +
                          `Phone: ${customer_phone}\n` +
                          `Total: Rs. ${total_amount.toLocaleString()}\n` +
                          `Items: ${itemsList}\n\n` +
                          `Login to your dashboard to process: http://localhost:3000/admin.html`;

      if (apiKey && apiKey.trim() !== '') {
        const gatewayUrl = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(adminPhone)}&text=${encodeURIComponent(messageText)}&apikey=${encodeURIComponent(apiKey)}`;
        
        console.log(`[WhatsApp Admin] Triggering CallMeBot notification to +${adminPhone}...`);
        
        https.get(gatewayUrl, (res) => {
          let responseBody = '';
          res.on('data', (chunk) => { responseBody += chunk; });
          res.on('end', () => {
            console.log(`[WhatsApp Admin] Gateway responded with status: ${res.statusCode}`);
          });
        }).on('error', (err) => {
          console.error('[WhatsApp Admin] Gateway request failed:', err.message);
        });
      } else {
        console.log(`\n=================== WHATSAPP ADMIN NOTIFICATION SANDBOX ===================`);
        console.log(`Recipient (Admin Phone): +${adminPhone}`);
        console.log(`Message Content:\n${messageText}`);
        console.log(`===========================================================================\n`);
      }
    } catch (wsErr) {
      console.error('Failed to process WhatsApp admin notification setup:', wsErr);
    }

    const createdOrder = await dbGet('SELECT * FROM orders WHERE id = ?', [orderId]);
    return res.status(201).json({ message: 'Order created', order: createdOrder });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to record transaction.' });
  }
});

app.get('/api/orders/track/:number', async (req, res) => {
  const { number } = req.params;
  try {
    const order = await dbGet('SELECT * FROM orders WHERE order_number = ?', [number]);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const items = await dbAll('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    return res.json({ order, items });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to query order tracking.' });
  }
});

// Stream PDF Invoice
app.get('/api/orders/:id/invoice', async (req, res) => {
  const { id } = req.params;
  try {
    const order = await dbGet('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) return res.status(404).send('Order not found.');

    const items = await dbAll('SELECT * FROM order_items WHERE order_id = ?', [order.id]);

    // Fetch dynamic store contact info from settings
    const settingsRows = await dbAll('SELECT * FROM website_settings');
    const settings = {};
    settingsRows.forEach(r => { settings[r.key] = r.value; });
    const storeAddress = settings.contact_address || 'Bhoirwadi, Dombivli East, Maharashtra';
    const storeEmail = settings.contact_email || 'hemant4507vns@gmail.com';
    const storePhone = settings.contact_phone || '+91 72758 19354';

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.order_number}.pdf`);
    doc.pipe(res);

    // Invoice Styling PDF
    // Brand header
    doc.fillColor('#800020').fontSize(24).font('Helvetica-Bold').text('ANANT ARTS', 50, 50);
    doc.fillColor('#666').fontSize(9).font('Helvetica').text('Bringing Divine Art to Every Home', 50, 75);
    doc.text(`${storeAddress} | ${storeEmail} | ${storePhone}`, 50, 88);

    doc.fillColor('#800020').fontSize(18).font('Helvetica-Bold').text('INVOICE', 400, 50, { align: 'right' });
    doc.fillColor('#333').fontSize(9).font('Helvetica').text(`Invoice #: INV-${order.order_number.substring(3)}`, 400, 75, { align: 'right' });
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 400, 88, { align: 'right' });
    
    // Draw horizontal rule
    doc.moveTo(50, 110).lineTo(550, 110).strokeColor('#D4AF37').lineWidth(2).stroke();

    // Customer / Bill details
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#800020').text('Billed To:', 50, 130);
    doc.fontSize(10).font('Helvetica').fillColor('#333');
    doc.text(order.customer_name, 50, 147);
    doc.text(order.customer_phone, 50, 160);
    doc.text(order.customer_email, 50, 173);
    doc.text(order.shipping_address, 50, 186, { width: 220 });

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#800020').text('Transaction Details:', 320, 130);
    doc.fontSize(10).font('Helvetica').fillColor('#333');
    doc.text(`Order Number: #${order.order_number}`, 320, 147);
    doc.text(`Payment Mode: ${order.payment_method}`, 320, 160);
    doc.text(`Payment Status: ${order.payment_status}`, 320, 173);

    // Draw Table headers
    let y = 250;
    doc.moveTo(50, y).lineTo(550, y).strokeColor('#DDD').lineWidth(1).stroke();
    y += 10;
    
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#800020');
    doc.text('Item Description', 50, y);
    doc.text('Price (INR)', 300, y, { width: 80, align: 'right' });
    doc.text('Qty', 390, y, { width: 50, align: 'center' });
    doc.text('Total (INR)', 460, y, { width: 90, align: 'right' });

    y += 15;
    doc.moveTo(50, y).lineTo(550, y).strokeColor('#DDD').lineWidth(1).stroke();

    // Table rows
    doc.font('Helvetica').fillColor('#333');
    for (const item of items) {
      y += 15;
      doc.text(item.product_name, 50, y, { width: 230 });
      doc.text(item.price.toLocaleString(), 300, y, { width: 80, align: 'right' });
      doc.text(item.quantity.toString(), 390, y, { width: 50, align: 'center' });
      doc.text((item.price * item.quantity).toLocaleString(), 460, y, { width: 90, align: 'right' });
      y += 10; // Extra line height padding
    }

    y += 30;
    doc.moveTo(50, y).lineTo(550, y).strokeColor('#DDD').lineWidth(1).stroke();

    // Summary calculations
    y += 15;
    doc.fontSize(10).font('Helvetica').text('Subtotal:', 350, y);
    doc.font('Helvetica-Bold').text(`Rs. ${order.subtotal.toLocaleString()}`, 460, y, { width: 90, align: 'right' });

    if (order.discount_amount > 0) {
      y += 15;
      doc.font('Helvetica').text('Coupon Discount:', 350, y);
      doc.font('Helvetica-Bold').fillColor('green').text(`-Rs. ${order.discount_amount.toLocaleString()}`, 460, y, { width: 90, align: 'right' });
      doc.fillColor('#333');
    }

    y += 15;
    doc.font('Helvetica').text('Shipping Fee:', 350, y);
    doc.font('Helvetica-Bold').text(order.shipping_charge === 0 ? 'FREE' : `Rs. ${order.shipping_charge.toLocaleString()}`, 460, y, { width: 90, align: 'right' });

    y += 20;
    doc.moveTo(350, y).lineTo(550, y).strokeColor('#800020').lineWidth(15).stroke(); // Draw background for total row
    
    y += 4;
    doc.fontSize(11).fillColor('#FFF').font('Helvetica-Bold').text('Grand Total:', 355, y);
    doc.text(`Rs. ${order.total_amount.toLocaleString()}`, 460, y, { width: 90, align: 'right' });

    // Footer note
    doc.fillColor('#666').fontSize(8).font('Helvetica-Oblique').text('Thank you for choosing Anant Arts to bring spiritual elegance into your home. This is a computer generated invoice and requires no signature.', 50, 700, { align: 'center', width: 500 });

    doc.end();
  } catch (err) {
    console.error('PDF Invoice Generation Error:', err);
    if (!res.headersSent) {
      return res.status(500).send('Failed to generate PDF.');
    }
  }
});


// ==================== ADMIN: DASHBOARD & STATS API ====================

app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    // Gross sales revenue
    const revRow = await dbGet("SELECT SUM(total_amount) as total FROM orders WHERE payment_status = 'Paid'");
    const revenue = revRow.total || 0;

    // Order Count
    const ordRow = await dbGet('SELECT COUNT(*) as count FROM orders');
    const orderCount = ordRow.count || 0;

    // Product Count
    const prodRow = await dbGet('SELECT COUNT(*) as count FROM products');
    const productCount = prodRow.count || 0;

    // Low Stock Alert (stock < 5)
    const lowStockProducts = await dbAll('SELECT id, sku, name, stock_quantity FROM products WHERE stock_quantity < 5');

    // Best Sellers: aggregate quantities sold from order_items
    const bestSellers = await dbAll(`
      SELECT p.sku as product_sku, oi.product_name, SUM(oi.quantity) as units_sold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.payment_status = 'Paid'
      GROUP BY oi.product_id, p.sku, oi.product_name
      ORDER BY units_sold DESC
      LIMIT 5
    `);

    // Monthly sales graph data for Chart.js (dynamically parsed based on DB dialect)
    const monthlySalesQuery = isPostgres()
      ? `SELECT to_char(created_at, 'MM-YYYY') as month, SUM(total_amount) as sales
         FROM orders
         WHERE payment_status = 'Paid'
         GROUP BY to_char(created_at, 'MM-YYYY')
         ORDER BY MIN(created_at) ASC`
      : `SELECT strftime('%m-%Y', created_at) as month, SUM(total_amount) as sales
         FROM orders
         WHERE payment_status = 'Paid'
         GROUP BY strftime('%m-%Y', created_at)
         ORDER BY created_at ASC`;

    const monthlySales = await dbAll(monthlySalesQuery);

    return res.json({
      revenue,
      orderCount,
      productCount,
      lowStockProducts,
      bestSellers,
      monthlySales
    });

  } catch (err) {
    return res.status(500).json({ message: 'Failed to load business stats.' });
  }
});

// Admin Orders view
app.get('/api/admin/orders', authenticateAdmin, async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM orders ORDER BY id DESC');
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load orders list.' });
  }
});

// Admin Update Order Status
app.put('/api/admin/orders/:id/status', authenticateAdmin, async (req, res) => {
  const { status, tracking_number } = req.body;
  if (!status) return res.status(400).json({ message: 'Status required.' });

  try {
    if (tracking_number !== undefined) {
      await dbRun('UPDATE orders SET order_status = ?, tracking_number = ? WHERE id = ?', [status, tracking_number, req.params.id]);
    } else {
      await dbRun('UPDATE orders SET order_status = ? WHERE id = ?', [status, req.params.id]);
    }
    return res.json({ message: 'Order status updated successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update order status.' });
  }
});

// Mock Send WhatsApp update
app.post('/api/admin/orders/:id/whatsapp', authenticateAdmin, async (req, res) => {
  try {
    const order = await dbGet('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    // Log mock WhatsApp message
    console.log(`[WhatsApp Sandbox] Sending to ${order.customer_phone}: "Hello ${order.customer_name}, your order #${order.order_number} status has been updated to '${order.order_status}'. Track details at: http://localhost:3000/order-tracking.html?order=${order.order_number}"`);
    
    return res.json({ message: `Mock WhatsApp text sent successfully to +${order.customer_phone}.` });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to trigger WhatsApp update.' });
  }
});

// Admin coupon management
app.get('/api/admin/coupons', authenticateAdmin, async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM coupons ORDER BY id DESC');
    return res.json(rows);
  } catch(e) {
    return res.status(500).json({ message: 'Failed to fetch coupons.' });
  }
});

app.post('/api/admin/coupons', authenticateAdmin, async (req, res) => {
  const { code, discount_type, discount_value, min_order_amount, usage_limit } = req.body;
  if (!code || !discount_type || isNaN(discount_value)) {
    return res.status(400).json({ message: 'Invalid coupon inputs.' });
  }

  try {
    await dbRun(
      'INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, usage_limit) VALUES (?, ?, ?, ?, ?)',
      [code.toUpperCase(), discount_type, discount_value, min_order_amount || 0, usage_limit || 100]
    );
    return res.status(201).json({ message: 'Coupon created.' });
  } catch(err) {
    return res.status(500).json({ message: 'Failed to save coupon.' });
  }
});

app.delete('/api/admin/coupons/:id', authenticateAdmin, async (req, res) => {
  try {
    await dbRun('DELETE FROM coupons WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Coupon deleted successfully.' });
  } catch(e) {
    return res.status(500).json({ message: 'Failed to delete coupon.' });
  }
});


// ==================== ADMIN: PRODUCT CRUD APIS ====================

app.post('/api/admin/products', authenticateAdmin, upload.array('images'), async (req, res) => {
  const { 
    name, price, discount_price, sku, category_id, material, dimensions, weight, 
    stock_quantity, is_published, tags, description, short_description, deity_category, 
    is_bestseller, is_new_arrival, is_featured, video_url, seo_title, seo_description 
  } = req.body;
  
  if (!name || isNaN(price) || !sku) {
    return res.status(400).json({ message: 'Name, SKU and base price are required.' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);

  try {
    const prodRes = await dbRun(`
      INSERT INTO products (
        name, slug, price, discount_price, sku, category_id, material, dimensions, 
        weight, stock_quantity, is_published, tags, description, 
        short_description, deity_category, is_bestseller, is_new_arrival, is_featured, 
        video_url, seo_title, seo_description
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, slug, parseFloat(price), discount_price ? parseFloat(discount_price) : null, sku,
      category_id ? parseInt(category_id) : null, material, dimensions, weight ? parseFloat(weight) : null,
      parseInt(stock_quantity || 0), parseInt(is_published || 1), tags || '[]', description || '',
      short_description || '', deity_category || '', parseInt(is_bestseller || 0), parseInt(is_new_arrival || 0), parseInt(is_featured || 0),
      video_url || '', seo_title || '', seo_description || ''
    ]);

    const productId = prodRes.id;

    // Save uploaded images
    if (req.files && req.files.length > 0) {
      let isPrimary = 1;
      for (const file of req.files) {
        await dbRun(
          'INSERT INTO product_images (product_id, image_path, is_primary) VALUES (?, ?, ?)',
          [productId, `/uploads/${file.filename}`, isPrimary]
        );
        isPrimary = 0;
      }
    }

    return res.status(201).json({ message: 'Product created successfully.' });
  } catch (err) {
    return res.status(500).json({ message: `Failed to insert product: ${err.message}` });
  }
});

app.put('/api/admin/products/:id', authenticateAdmin, upload.array('images'), async (req, res) => {
  const { id } = req.params;
  const { 
    name, price, discount_price, sku, category_id, material, dimensions, weight, 
    stock_quantity, is_published, tags, description, existing_images,
    short_description, deity_category, is_bestseller, is_new_arrival, is_featured, 
    video_url, seo_title, seo_description 
  } = req.body;

  if (!name || isNaN(price) || !sku) {
    return res.status(400).json({ message: 'Name, SKU and base price are required.' });
  }

  try {
    // 1. Update product row details
    await dbRun(`
      UPDATE products SET 
        name = ?, price = ?, discount_price = ?, sku = ?, category_id = ?, 
        material = ?, dimensions = ?, weight = ?, stock_quantity = ?, 
        is_published = ?, tags = ?, description = ?,
        short_description = ?, deity_category = ?, is_bestseller = ?, is_new_arrival = ?, is_featured = ?, 
        video_url = ?, seo_title = ?, seo_description = ?
      WHERE id = ?
    `, [
      name, parseFloat(price), discount_price ? parseFloat(discount_price) : null, sku,
      category_id ? parseInt(category_id) : null, material, dimensions, weight ? parseFloat(weight) : null,
      parseInt(stock_quantity || 0), parseInt(is_published || 1), tags || '[]', description || '',
      short_description || '', deity_category || '', parseInt(is_bestseller || 0), parseInt(is_new_arrival || 0), parseInt(is_featured || 0),
      video_url || '', seo_title || '', seo_description || '', id
    ]);

    // 2. Process image changes
    let keepImages = [];
    try { keepImages = JSON.parse(existing_images || '[]'); } catch(e){}

    // Query active image list
    const activeImages = await dbAll('SELECT * FROM product_images WHERE product_id = ?', [id]);
    
    // Delete files that are removed
    for (const img of activeImages) {
      if (!keepImages.includes(img.image_path)) {
        // Remove file physically
        const fullFilePath = path.join(__dirname, 'public', img.image_path);
        if (fs.existsSync(fullFilePath)) {
          try { fs.unlinkSync(fullFilePath); } catch(err){}
        }
        // Remove from db
        await dbRun('DELETE FROM product_images WHERE id = ?', [img.id]);
      }
    }

    // Insert new file uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await dbRun(
          'INSERT INTO product_images (product_id, image_path, is_primary) VALUES (?, ?, 0)',
          [id, `/uploads/${file.filename}`]
        );
      }
    }

    // Verify there is at least one primary image left, else set the first one as primary
    const remainingImages = await dbAll('SELECT * FROM product_images WHERE product_id = ? ORDER BY id ASC', [id]);
    if (remainingImages.length > 0) {
      const hasPrimary = remainingImages.some(img => img.is_primary === 1);
      if (!hasPrimary) {
        await dbRun('UPDATE product_images SET is_primary = 1 WHERE id = ?', [remainingImages[0].id]);
      }
    }

    return res.json({ message: 'Product updated successfully.' });
  } catch (err) {
    return res.status(500).json({ message: `Failed to update product: ${err.message}` });
  }
});

app.post('/api/admin/products/:id/duplicate', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const original = await dbGet('SELECT * FROM products WHERE id = ?', [id]);
    if (!original) return res.status(404).json({ message: 'Original product not found.' });

    const newName = original.name + ' (Copy)';
    const newSku = original.sku ? original.sku + '-COPY' : 'COPY-' + Date.now();
    const newSlug = original.slug + '-copy-' + Date.now().toString().slice(-4);

    const dupRes = await dbRun(`
      INSERT INTO products (
        name, slug, description, short_description, category_id, deity_category, price, discount_price, sku, 
        material, dimensions, weight, stock_quantity, is_published, tags, 
        is_bestseller, is_new_arrival, is_featured, video_url, seo_title, seo_description
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      newName, newSlug, original.description, original.short_description || '', original.category_id, original.deity_category || '', original.price,
      original.discount_price, newSku, original.material, original.dimensions, original.weight,
      original.stock_quantity, original.is_published, original.tags,
      original.is_bestseller || 0, original.is_new_arrival || 0, original.is_featured || 0, original.video_url || '', original.seo_title || '', original.seo_description || ''
    ]);

    const newProductId = dupRes.id;

    // Duplicate original images paths in database
    const origImages = await dbAll('SELECT * FROM product_images WHERE product_id = ?', [id]);
    for (const img of origImages) {
      await dbRun(
        'INSERT INTO product_images (product_id, image_path, is_primary) VALUES (?, ?, ?)',
        [newProductId, img.image_path, img.is_primary]
      );
    }

    return res.json({ message: 'Product duplicated.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to duplicate product.' });
  }
});

app.delete('/api/admin/products/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // Delete image files
    const images = await dbAll('SELECT image_path FROM product_images WHERE product_id = ?', [id]);
    for (const img of images) {
      // Remove physically if it resides in dynamic uploads directory
      if (img.image_path.startsWith('/uploads/')) {
        const fullPath = path.join(__dirname, img.image_path);
        if (fs.existsSync(fullPath)) {
          try { fs.unlinkSync(fullPath); } catch(e){}
        }
      }
    }

    // Delete product row (cascades or drops product_images automatically in sqlite if foreign keys on delete cascade enabled)
    await dbRun('DELETE FROM product_images WHERE product_id = ?', [id]);
    await dbRun('DELETE FROM products WHERE id = ?', [id]);
    
    return res.json({ message: 'Product deleted.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete product.' });
  }
});


// ==================== ADMIN: CATEGORIES CRUD ====================

app.post('/api/admin/categories', authenticateAdmin, upload.single('image'), async (req, res) => {
  const { name, is_hidden, type } = req.body;
  if (!name) return res.status(400).json({ message: 'Category Name is required.' });

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const image_path = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    await dbRun(
      'INSERT INTO categories (name, slug, image_path, is_hidden, type) VALUES (?, ?, ?, ?, ?)',
      [name, slug, image_path, parseInt(is_hidden || 0), type || 'deity']
    );
    return res.status(201).json({ message: 'Category created.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create category.' });
  }
});

app.put('/api/admin/categories/:id', authenticateAdmin, upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { name, is_hidden, existing_image, type } = req.body;

  if (!name) return res.status(400).json({ message: 'Category Name is required.' });

  let image_path = existing_image || null;
  if (req.file) {
    // Delete older image file
    if (existing_image && existing_image.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, existing_image);
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch(e){}
      }
    }
    image_path = `/uploads/${req.file.filename}`;
  }

  try {
    await dbRun(
      'UPDATE categories SET name = ?, image_path = ?, is_hidden = ?, type = ? WHERE id = ?',
      [name, image_path, parseInt(is_hidden || 0), type || 'deity', id]
    );
    return res.json({ message: 'Category updated.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update category.' });
  }
});

app.delete('/api/admin/categories/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const cat = await dbGet('SELECT image_path FROM categories WHERE id = ?', [id]);
    if (cat && cat.image_path && cat.image_path.startsWith('/uploads/')) {
      const fullPath = path.join(__dirname, cat.image_path);
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch(e){}
      }
    }

    await dbRun('UPDATE products SET category_id = NULL WHERE category_id = ?', [id]);
    await dbRun('DELETE FROM categories WHERE id = ?', [id]);
    
    return res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete category.' });
  }
});


// ==================== ADMIN: SETTINGS UPDATING ====================

app.put('/api/admin/settings', authenticateAdmin, async (req, res) => {
  const { settings } = req.body;
  if (!settings) return res.status(400).json({ message: 'Missing settings payload.' });

  try {
    for (const [key, value] of Object.entries(settings)) {
      await dbRun('INSERT OR REPLACE INTO website_settings (key, value) VALUES (?, ?)', [key, value]);
    }
    return res.json({ message: 'Settings saved.' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to save website configurations.' });
  }
});


// ==================== ADMIN: PRODUCTS CSV EXPORT/IMPORT ====================

// CSV lines parser helper (handles double quotes correctly)
function parseCSVLine(line) {
  const result = [];
  let cell = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuote = !inQuote;
    } else if (char === ',' && !inQuote) {
      result.push(cell.trim());
      cell = '';
    } else {
      cell += char;
    }
  }
  result.push(cell.trim());
  return result;
}

app.post('/api/admin/products/import', authenticateAdmin, upload.single('csvFile'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'CSV file required.' });

  try {
    const csvContent = fs.readFileSync(req.file.path, 'utf8');
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    
    if (lines.length <= 1) return res.status(400).json({ message: 'CSV is empty or lacks header rows.' });

    // Parse header and index mapping
    const headers = parseCSVLine(lines[0]);
    
    const idxSku = headers.indexOf('sku');
    const idxName = headers.indexOf('name');
    const idxPrice = headers.indexOf('price');
    const idxDiscount = headers.indexOf('discount_price');
    const idxStock = headers.indexOf('stock_quantity');
    const idxMaterial = headers.indexOf('material');
    const idxDimensions = headers.indexOf('dimensions');
    const idxWeight = headers.indexOf('weight');
    const idxDesc = headers.indexOf('description');
    const idxShortDesc = headers.indexOf('short_description');
    const idxDeityCat = headers.indexOf('deity_category');
    const idxBestseller = headers.indexOf('is_bestseller');
    const idxNewArrival = headers.indexOf('is_new_arrival');
    const idxFeatured = headers.indexOf('is_featured');
    const idxVideo = headers.indexOf('video_url');
    const idxSeoTitle = headers.indexOf('seo_title');
    const idxSeoDesc = headers.indexOf('seo_description');

    if (idxSku === -1 || idxName === -1 || idxPrice === -1) {
      return res.status(400).json({ message: 'Missing required columns in CSV (sku, name, price).' });
    }

    let insertCount = 0;
    // Process items rows
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < headers.length) continue;

      const sku = values[idxSku];
      const name = values[idxName];
      const price = parseFloat(values[idxPrice]);
      const discount_price = idxDiscount !== -1 && values[idxDiscount] ? parseFloat(values[idxDiscount]) : null;
      const stock_quantity = idxStock !== -1 && values[idxStock] ? parseInt(values[idxStock]) : 10;
      const material = idxMaterial !== -1 ? values[idxMaterial] : '';
      const dimensions = idxDimensions !== -1 ? values[idxDimensions] : '';
      const weight = idxWeight !== -1 && values[idxWeight] ? parseFloat(values[idxWeight]) : null;
      const description = idxDesc !== -1 ? values[idxDesc] : '';
      const short_description = idxShortDesc !== -1 ? values[idxShortDesc] : '';
      const deity_category = idxDeityCat !== -1 ? values[idxDeityCat] : '';
      const is_bestseller = idxBestseller !== -1 && values[idxBestseller] ? parseInt(values[idxBestseller]) : 0;
      const is_new_arrival = idxNewArrival !== -1 && values[idxNewArrival] ? parseInt(values[idxNewArrival]) : 0;
      const is_featured = idxFeatured !== -1 && values[idxFeatured] ? parseInt(values[idxFeatured]) : 0;
      const video_url = idxVideo !== -1 ? values[idxVideo] : '';
      const seo_title = idxSeoTitle !== -1 ? values[idxSeoTitle] : '';
      const seo_description = idxSeoDesc !== -1 ? values[idxSeoDesc] : '';

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-3);

      // Check if product with SKU already exists -> update it, else insert
      const existing = await dbGet('SELECT id FROM products WHERE sku = ?', [sku]);
      
      if (existing) {
        await dbRun(`
          UPDATE products SET 
            name = ?, price = ?, discount_price = ?, stock_quantity = ?, 
            material = ?, dimensions = ?, weight = ?, description = ?,
            short_description = ?, deity_category = ?, is_bestseller = ?, is_new_arrival = ?, is_featured = ?, 
            video_url = ?, seo_title = ?, seo_description = ?
          WHERE id = ?
        `, [
          name, price, discount_price, stock_quantity, material, dimensions, weight, description,
          short_description, deity_category, is_bestseller, is_new_arrival, is_featured,
          video_url, seo_title, seo_description, existing.id
        ]);
      } else {
        await dbRun(`
          INSERT INTO products (
            name, slug, price, discount_price, sku, stock_quantity, material, dimensions, weight, description,
            short_description, deity_category, is_bestseller, is_new_arrival, is_featured, video_url, seo_title, seo_description
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          name, slug, price, discount_price, sku, stock_quantity, material, dimensions, weight, description,
          short_description, deity_category, is_bestseller, is_new_arrival, is_featured, video_url, seo_title, seo_description
        ]);
      }
      insertCount++;
    }

    // Clean uploaded csv file
    fs.unlinkSync(req.file.path);

    return res.json({ message: 'Products imported successfully', count: insertCount });

  } catch (err) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch(e){}
    }
    return res.status(500).json({ message: `CSV Import failed: ${err.message}` });
  }
});

app.get('/api/admin/products/export', authenticateAdmin, async (req, res) => {
  try {
    const products = await dbAll('SELECT * FROM products');
    
    // Construct CSV content string
    let csv = 'sku,name,price,discount_price,stock_quantity,material,dimensions,weight,description,short_description,deity_category,is_bestseller,is_new_arrival,is_featured,video_url,seo_title,seo_description\n';
    
    products.forEach(p => {
      // Escape text commas and quotes
      const escName = `"${(p.name || '').replace(/"/g, '""')}"`;
      const escDesc = `"${(p.description || '').replace(/"/g, '""')}"`;
      const escShortDesc = `"${(p.short_description || '').replace(/"/g, '""')}"`;
      const escMat = `"${(p.material || '').replace(/"/g, '""')}"`;
      const escDim = `"${(p.dimensions || '').replace(/"/g, '""')}"`;
      const escDeity = `"${(p.deity_category || '').replace(/"/g, '""')}"`;
      const escVideo = `"${(p.video_url || '').replace(/"/g, '""')}"`;
      const escSeoTitle = `"${(p.seo_title || '').replace(/"/g, '""')}"`;
      const escSeoDesc = `"${(p.seo_description || '').replace(/"/g, '""')}"`;
      
      csv += `${p.sku || ''},${escName},${p.price},${p.discount_price || ''},${p.stock_quantity},${escMat},${escDim},${p.weight || ''},${escDesc},${escShortDesc},${escDeity},${p.is_bestseller || 0},${p.is_new_arrival || 0},${p.is_featured || 0},${escVideo},${escSeoTitle},${escSeoDesc}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products_catalog.csv');
    return res.status(200).send(csv);

  } catch(err) {
    return res.status(500).send('CSV Export failed.');
  }
});


// ==================== SYSTEM DIAGNOSTICS: BACKUP/RESTORE ====================

app.get('/api/admin/backup', authenticateAdmin, (req, res) => {
  if (isPostgres()) {
    return res.status(400).send('Database backup file download is only supported in SQLite fallback mode.');
  }

  if (!fs.existsSync(dbPath)) return res.status(404).send('Database file not found.');
  
  res.setHeader('Content-Type', 'application/x-sqlite3');
  res.setHeader('Content-Disposition', 'attachment; filename=anantarts_backup.sqlite');
  return res.sendFile(dbPath);
});

app.post('/api/admin/restore', authenticateAdmin, upload.single('dbFile'), async (req, res) => {
  if (isPostgres()) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch(e){}
    }
    return res.status(400).json({ message: 'Database state restoration is only supported in SQLite fallback mode.' });
  }

  if (!req.file) return res.status(400).json({ message: 'SQLite database file required.' });

  try {
    // 1. Close current connection
    await closeDb();
    
    // 2. Overwrite local sqlite file
    fs.copyFileSync(req.file.path, dbPath);
    
    // Clean temporary upload
    fs.unlinkSync(req.file.path);
    
    // 3. Re-open connection
    reconnectDb();

    return res.json({ message: 'Database state restored successfully.' });
  } catch (err) {
    // Re-establish connection just in case
    reconnectDb();
    return res.status(500).json({ message: `Database restoration failed: ${err.message}` });
  }
});

// ==================== NEW CUSTOMER MANAGEMENT APIs ====================

app.get('/api/admin/customers', authenticateAdmin, async (req, res) => {
  const search = req.query.search || '';
  try {
    let query = `
      SELECT 
        customer_name, 
        customer_email, 
        customer_phone, 
        COUNT(id) as orders_count, 
        SUM(total_amount) as total_spent 
      FROM orders 
      WHERE customer_name LIKE ? OR customer_email LIKE ? OR customer_phone LIKE ?
      GROUP BY customer_email, customer_name, customer_phone
    `;
    const searchParam = `%${search}%`;
    const rows = await dbAll(query, [searchParam, searchParam, searchParam]);
    return res.json(rows);
  } catch (err) {
    console.error("SQL Error in /api/admin/customers:", err);
    return res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/customers/:email/orders', authenticateAdmin, async (req, res) => {
  const { email } = req.params;
  try {
    const rows = await dbAll('SELECT * FROM orders WHERE customer_email = ? ORDER BY id DESC', [email]);
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/customers/export', authenticateAdmin, async (req, res) => {
  try {
    const query = `
      SELECT 
        customer_name, 
        customer_email, 
        customer_phone, 
        COUNT(id) as orders_count, 
        SUM(total_amount) as total_spent 
      FROM orders 
      GROUP BY customer_email, customer_name, customer_phone
    `;
    const rows = await dbAll(query);
    let csv = 'Customer Name,Customer Email,Customer Phone,Orders Count,Total Spent (INR)\n';
    rows.forEach(r => {
      csv += `"${r.customer_name.replace(/"/g, '""')}","${r.customer_email.replace(/"/g, '""')}","${r.customer_phone}",${r.orders_count},${r.total_spent}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customers_export.csv');
    return res.send(csv);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

// ==================== NEW BLOG MANAGEMENT APIs ====================

app.get('/api/admin/blogs', async (req, res) => {
  try {
    const rows = await dbAll('SELECT blogs.*, categories.name as category_name FROM blogs LEFT JOIN categories ON blogs.category_id = categories.id ORDER BY publish_date DESC');
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/blogs', authenticateAdmin, upload.single('featured_image'), async (req, res) => {
  const { title, content, short_desc, category_id, publish_date, is_published } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const featured_image = req.file ? `/uploads/${req.file.filename}` : null;
  const pDate = publish_date || new Date().toISOString();
  
  try {
    await dbRun(
      'INSERT INTO blogs (title, slug, content, short_desc, featured_image, category_id, publish_date, is_published) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, slug, content, short_desc, featured_image, category_id ? parseInt(category_id) : null, pDate, is_published === 'false' ? 0 : 1]
    );
    return res.status(201).json({ message: 'Blog post created successfully.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.put('/api/admin/blogs/:id', authenticateAdmin, upload.single('featured_image'), async (req, res) => {
  const { id } = req.params;
  const { title, content, short_desc, category_id, publish_date, is_published } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  try {
    let query = 'UPDATE blogs SET title = ?, slug = ?, content = ?, short_desc = ?, category_id = ?, publish_date = ?, is_published = ?';
    let params = [title, slug, content, short_desc, category_id ? parseInt(category_id) : null, publish_date, is_published === 'false' ? 0 : 1];
    
    if (req.file) {
      query += ', featured_image = ?';
      params.push(`/uploads/${req.file.filename}`);
    }
    query += ' WHERE id = ?';
    params.push(parseInt(id));
    
    await dbRun(query, params);
    return res.json({ message: 'Blog post updated successfully.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.delete('/api/admin/blogs/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await dbRun('DELETE FROM blogs WHERE id = ?', [parseInt(id)]);
    return res.json({ message: 'Blog post deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ==================== NEW MARKETING & NEWSLETTER APIs ====================

app.post('/api/newsletter/subscribe', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });
  try {
    await dbRun('INSERT INTO newsletter_subscribers (email) VALUES (?)', [email.trim().toLowerCase()]);
    return res.json({ message: 'Subscribed successfully!' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.json({ message: 'You are already subscribed!' });
    }
    return res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/subscribers', authenticateAdmin, async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM newsletter_subscribers ORDER BY id DESC');
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/subscribers/export', authenticateAdmin, async (req, res) => {
  try {
    const rows = await dbAll('SELECT email, subscribed_at FROM newsletter_subscribers ORDER BY id DESC');
    let csv = 'Email Address,Subscription Date\n';
    rows.forEach(r => {
      csv += `${r.email},${new Date(r.subscribed_at).toLocaleString()}\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=newsletter_subscribers.csv');
    return res.send(csv);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

// ==================== EXCEL/CSV EXPORT FOR ORDERS ====================

app.get('/api/admin/orders/export', authenticateAdmin, async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM orders ORDER BY id DESC');
    let csv = 'Order ID,Customer Name,Email,Phone,Shipping Address,Billing Address,Subtotal,Discount,Total Paid,Payment Method,Payment Status,Order Status,Date Placed,Tracking Number\n';
    rows.forEach(r => {
      csv += `"${r.order_number}","${r.customer_name.replace(/"/g, '""')}","${r.customer_email}","${r.customer_phone}","${r.shipping_address.replace(/"/g, '""')}","${r.billing_address.replace(/"/g, '""')}",${r.subtotal},${r.discount_amount},${r.total_amount},"${r.payment_method}","${r.payment_status}","${r.order_status}","${new Date(r.created_at).toLocaleString()}","${r.tracking_number || ''}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders_export.csv');
    return res.send(csv);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

// Start Express Listener and boot up Database
if (process.env.VERCEL) {
  module.exports = async (req, res) => {
    await initDb();
    app(req, res);
  };
} else {
  initDb().then(() => {
    app.listen(PORT, () => {
      console.log(`Anant Arts Server is running at http://localhost:${PORT}`);
    });
  }).catch(err => {
    console.error('Fatal: Database setup failed.', err);
  });
}
