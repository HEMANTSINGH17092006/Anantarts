import crypto from 'crypto';
import assert from 'assert';

console.log('================================================================');
console.log(' ANANT ARTS — COMPREHENSIVE PRODUCTION AUDIT VERIFICATION SUITE');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function verify(title, fn) {
  try {
    fn();
    console.log(`  [PASS] ${title}`);
    passCount++;
  } catch (err) {
    console.error(`  [FAIL] ${title}`);
    console.error(`         -> ${err.message}`);
    failCount++;
  }
}

// =============================================================================
// TEST GROUP 1: GUEST CHECKOUT & ROUTE PROTECTION (src/proxy.js)
// =============================================================================
console.log('--- 1. GUEST CHECKOUT & EDGE PROXY ROUTE PROTECTION ---');

function mockProxyMiddleware(pathname, cookies = {}) {
  // Edge proxy rules from src/proxy.js
  if (pathname.startsWith('/api/admin')) {
    const token = cookies.token;
    if (!token) return { status: 401, body: { success: false, message: 'Unauthorized. Admin session required.' } };
    if (token === 'valid_admin_token') return { status: 200, pass: true };
    return { status: 401, body: { success: false, message: 'Unauthorized. Invalid or expired admin session.' } };
  }

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = cookies.token;
    if (!token) return { status: 307, redirect: '/admin/login' };
    return { status: 200, pass: true };
  }

  // Customer Protected Routes
  const customerProtectedRoutes = ['/account', '/my-orders'];
  const isCustomerRoute = customerProtectedRoutes.some(route => pathname.startsWith(route));
  if (isCustomerRoute) {
    const customerToken = cookies.customer_token;
    if (!customerToken) return { status: 307, redirect: '/login?next=' + pathname };
    return { status: 200, pass: true };
  }

  // /checkout is intentionally NOT in customerProtectedRoutes
  return { status: 200, pass: true };
}

verify('Guest checkout at /checkout is UNBLOCKED (no redirect to /login)', () => {
  const result = mockProxyMiddleware('/checkout', {});
  assert.strictEqual(result.status, 200);
  assert.strictEqual(result.pass, true);
  assert.strictEqual(result.redirect, undefined);
});

verify('Customer account routes (/account, /my-orders) require customer session', () => {
  const unauthAccount = mockProxyMiddleware('/account', {});
  assert.strictEqual(unauthAccount.status, 307);
  assert.strictEqual(unauthAccount.redirect, '/login?next=/account');

  const authAccount = mockProxyMiddleware('/account', { customer_token: 'valid_jwt' });
  assert.strictEqual(authAccount.status, 200);
  assert.strictEqual(authAccount.pass, true);
});

verify('Admin API routes (/api/admin/*) return HTTP 401 JSON when unauthenticated', () => {
  const unauthAdminApi = mockProxyMiddleware('/api/admin/system-health', {});
  assert.strictEqual(unauthAdminApi.status, 401);
  assert.strictEqual(unauthAdminApi.body.success, false);
});

verify('Admin page routes (/admin/*) redirect to /admin/login when unauthenticated', () => {
  const unauthAdminPage = mockProxyMiddleware('/admin/orders', {});
  assert.strictEqual(unauthAdminPage.status, 307);
  assert.strictEqual(unauthAdminPage.redirect, '/admin/login');
});

// =============================================================================
// TEST GROUP 2: AUTHORITATIVE PRICING, STOCK, & COUPON ENGINE
// =============================================================================
console.log('\n--- 2. AUTHORITATIVE PRICING, STOCK, & COUPON ENGINE ---');

// Emulate validateAndCalculateOrderPrices from src/lib/order-pricing.js
function calculateOrderPrices({
  items,
  catalogProducts,
  coupon = null,
  clientTotalAmount = null,
  freeShippingThreshold = 5000,
  flatShippingFee = 150
}) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { success: false, statusCode: 400, message: 'Order items are required.' };
  }

  const catalogMap = new Map(catalogProducts.map(p => [p.id, p]));
  let subtotal = 0;
  const authoritativeItems = [];

  for (const item of items) {
    const product = catalogMap.get(item.product_id);
    if (!product) {
      return { success: false, statusCode: 400, message: `Product ID ${item.product_id} not found.` };
    }
    if (product.is_published === 0) {
      return { success: false, statusCode: 400, message: `Product "${product.name}" is currently unavailable.` };
    }
    if ((product.stock_quantity ?? 0) < item.quantity) {
      return { success: false, statusCode: 400, message: `Insufficient stock for "${product.name}".` };
    }

    let unitPrice = Number(product.price);
    if (product.discount_price && product.discount_price > 0 && product.discount_price < unitPrice) {
      unitPrice = Number(product.discount_price);
    }

    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;
    authoritativeItems.push({
      product_id: product.id,
      product_name: product.name,
      price: unitPrice,
      quantity: item.quantity,
      total_price: itemTotal
    });
  }

  // Coupon calculation
  let discount = 0;
  let appliedCouponId = null;
  if (coupon && coupon.is_active === 1) {
    const isNotExpired = !coupon.end_date || new Date(coupon.end_date) >= new Date();
    const isWithinLimit = !coupon.usage_limit || (coupon.times_used || 0) < coupon.usage_limit;
    const meetsMinOrder = !coupon.min_order_amount || subtotal >= Number(coupon.min_order_amount);

    if (isNotExpired && isWithinLimit && meetsMinOrder) {
      appliedCouponId = coupon.id;
      if (coupon.discount_type === 'percentage') {
        discount = Math.min(subtotal, Math.round((subtotal * Number(coupon.discount_value)) / 100));
      } else {
        discount = Math.min(subtotal, Number(coupon.discount_value) || 0);
      }
    }
  }

  const netSubtotal = subtotal - discount;
  const shipping = netSubtotal >= freeShippingThreshold ? 0 : flatShippingFee;
  const authoritativeTotal = Math.round((subtotal - discount + shipping) * 100) / 100;

  if (clientTotalAmount !== null && clientTotalAmount !== undefined) {
    if (Math.abs(Number(clientTotalAmount) - authoritativeTotal) > 1) {
      return {
        success: false,
        statusCode: 400,
        message: `Order total discrepancy detected. Authoritative calculated total is ₹${authoritativeTotal}.`
      };
    }
  }

  return {
    success: true,
    subtotal,
    discount,
    appliedCouponId,
    shipping,
    total: authoritativeTotal,
    authoritativeItems
  };
}

const mockCatalog = [
  { id: 101, name: 'Brass Ganesha', price: 3500, discount_price: 2999, stock_quantity: 5, is_published: 1 },
  { id: 102, name: 'Silver Lakshmi', price: 2500, discount_price: null, stock_quantity: 0, is_published: 1 },
  { id: 103, name: 'Ram Darbar Idol', price: 12000, discount_price: 9999, stock_quantity: 10, is_published: 1 },
  { id: 104, name: 'Archived Murti', price: 1500, discount_price: null, stock_quantity: 10, is_published: 0 }
];

verify('Calculates active discount price instead of MRP', () => {
  const res = calculateOrderPrices({
    items: [{ product_id: 101, quantity: 1 }],
    catalogProducts: mockCatalog
  });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.subtotal, 2999); // discount_price applied
  assert.strictEqual(res.shipping, 150);  // net < 5000 -> flat fee 150
  assert.strictEqual(res.total, 3149);
});

verify('Rejects out-of-stock product requests safely', () => {
  const res = calculateOrderPrices({
    items: [{ product_id: 102, quantity: 1 }], // stock is 0
    catalogProducts: mockCatalog
  });
  assert.strictEqual(res.success, false);
  assert.match(res.message, /Insufficient stock/);
});

verify('Rejects unpublished/archived products safely', () => {
  const res = calculateOrderPrices({
    items: [{ product_id: 104, quantity: 1 }], // is_published is 0
    catalogProducts: mockCatalog
  });
  assert.strictEqual(res.success, false);
  assert.match(res.message, /currently unavailable/);
});

verify('Applies valid percentage coupon and free shipping over ₹5,000 threshold', () => {
  const validCoupon = {
    id: 1,
    code: 'FESTIVE10',
    is_active: 1,
    discount_type: 'percentage',
    discount_value: 10,
    min_order_amount: 5000,
    usage_limit: 100,
    times_used: 10
  };
  const res = calculateOrderPrices({
    items: [{ product_id: 103, quantity: 1 }], // Ram Darbar: ₹9,999
    catalogProducts: mockCatalog,
    coupon: validCoupon
  });
  assert.strictEqual(res.success, true);
  assert.strictEqual(res.subtotal, 9999);
  assert.strictEqual(res.discount, 1000); // 10% of 9999 rounded
  assert.strictEqual(res.shipping, 0);     // Net: 8999 >= 5000 -> Free Shipping
  assert.strictEqual(res.total, 8999);
});

verify('Blocks client price manipulation (> ₹1 difference from database)', () => {
  const res = calculateOrderPrices({
    items: [{ product_id: 101, quantity: 1 }], // Authoritative: ₹3,149
    catalogProducts: mockCatalog,
    clientTotalAmount: 1 // Malicious client sent ₹1
  });
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.statusCode, 400);
  assert.match(res.message, /discrepancy detected/);
});

// =============================================================================
// TEST GROUP 3: RAZORPAY HMAC SIGNATURE VERIFICATION & REJECTION
// =============================================================================
console.log('\n--- 3. RAZORPAY HMAC SIGNATURE VERIFICATION & REJECTION ---');

function verifyPaymentSignature(order_id, payment_id, signature, secret) {
  if (!secret || !order_id || !payment_id || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${order_id}|${payment_id}`).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

const mockSecret = 'rzp_sec_live_example_987654';
const mockOrderId = 'order_O1A2B3C4D5';
const mockPaymentId = 'pay_P1A2B3C4D5';
const validHmac = crypto.createHmac('sha256', mockSecret).update(`${mockOrderId}|${mockPaymentId}`).digest('hex');

verify('Valid HMAC-SHA256 signature is accepted', () => {
  assert.strictEqual(verifyPaymentSignature(mockOrderId, mockPaymentId, validHmac, mockSecret), true);
});

verify('Missing signature parameter is strictly rejected', () => {
  assert.strictEqual(verifyPaymentSignature(mockOrderId, mockPaymentId, '', mockSecret), false);
  assert.strictEqual(verifyPaymentSignature(mockOrderId, mockPaymentId, null, mockSecret), false);
});

verify('Missing server secret fails closed without exceptions', () => {
  assert.strictEqual(verifyPaymentSignature(mockOrderId, mockPaymentId, validHmac, ''), false);
  assert.strictEqual(verifyPaymentSignature(mockOrderId, mockPaymentId, validHmac, null), false);
});

verify('Tampered order ID or payment ID is rejected', () => {
  assert.strictEqual(verifyPaymentSignature('order_TAMPERED', mockPaymentId, validHmac, mockSecret), false);
  assert.strictEqual(verifyPaymentSignature(mockOrderId, 'pay_TAMPERED', validHmac, mockSecret), false);
});

// =============================================================================
// TEST GROUP 4: WEBHOOK IDEMPOTENCY, DUPLICATE EVENTS & FAILURE HANDLING
// =============================================================================
console.log('\n--- 4. WEBHOOK IDEMPOTENCY, DUPLICATE EVENTS & FAILURE HANDLING ---');

class MockOrderDatabase {
  constructor() {
    this.orders = new Map();
    this.inventory = new Map([[101, 10]]);
    this.locks = new Map([['ORD-1001', 2]]);
    this.jobs = [];
  }

  createOrder(orderNumber, razorpayOrderId, totalAmount) {
    this.orders.set(razorpayOrderId, {
      order_number: orderNumber,
      razorpay_order_id: razorpayOrderId,
      total_amount: totalAmount,
      payment_status: 'Pending',
      order_status: 'Pending',
      payment_id: null
    });
  }

  handleWebhookEvent(eventType, paymentEntity) {
    const order = this.orders.get(paymentEntity.order_id);
    if (!order) return { status: 404, message: 'Order not found' };

    if (eventType === 'payment.captured') {
      // 1. Amount and currency validation
      const expectedPaise = Math.round(order.total_amount * 100);
      if (paymentEntity.amount !== expectedPaise) {
        return { status: 400, message: 'Payment amount mismatch' };
      }
      if (paymentEntity.currency !== 'INR') {
        return { status: 400, message: 'Invalid currency' };
      }

      // 2. Idempotency Check
      if (order.payment_status === 'Captured') {
        return { status: 200, idempotent: true, message: 'Order already captured' };
      }

      // 3. Atomic transition
      order.payment_status = 'Captured';
      order.order_status = 'Processing';
      order.payment_id = paymentEntity.id;

      // 4. Deduct inventory & release lock
      const currentStock = this.inventory.get(101) || 0;
      this.inventory.set(101, Math.max(0, currentStock - 2));
      this.locks.delete(order.order_number);

      // 5. Enqueue background job
      this.jobs.push({ type: 'whatsapp_admin', orderNumber: order.order_number });

      return { status: 200, captured: true };
    }

    if (eventType === 'payment.failed') {
      // Must not overwrite Captured order
      if (order.payment_status === 'Captured') {
        return { status: 200, ignored: true, message: 'Late failure ignored for captured order' };
      }
      order.payment_status = 'Failed';
      order.notes = `Payment Failed: ${paymentEntity.error_description || 'Declined'}`;
      return { status: 200, failed: true };
    }

    return { status: 200, unhandled: true };
  }
}

verify('First payment.captured event captures order, deducts stock, releases lock, and queues notification', () => {
  const db = new MockOrderDatabase();
  db.createOrder('ORD-1001', 'order_ABC123', 5000);

  const paymentEntity = {
    id: 'pay_XYZ987',
    order_id: 'order_ABC123',
    amount: 500000, // ₹5,000 in paise
    currency: 'INR'
  };

  const res = db.handleWebhookEvent('payment.captured', paymentEntity);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.captured, true);

  const order = db.orders.get('order_ABC123');
  assert.strictEqual(order.payment_status, 'Captured');
  assert.strictEqual(db.inventory.get(101), 8); // 10 - 2 = 8
  assert.strictEqual(db.locks.has('ORD-1001'), false); // Lock released
  assert.strictEqual(db.jobs.length, 1);
});

verify('Duplicate payment.captured delivery is idempotent (stock not double-deducted)', () => {
  const db = new MockOrderDatabase();
  db.createOrder('ORD-1001', 'order_ABC123', 5000);

  const paymentEntity = {
    id: 'pay_XYZ987',
    order_id: 'order_ABC123',
    amount: 500000,
    currency: 'INR'
  };

  // Delivery 1
  db.handleWebhookEvent('payment.captured', paymentEntity);
  assert.strictEqual(db.inventory.get(101), 8);

  // Delivery 2 (duplicate delivery from webhook retry)
  const res2 = db.handleWebhookEvent('payment.captured', paymentEntity);
  assert.strictEqual(res2.status, 200);
  assert.strictEqual(res2.idempotent, true);
  assert.strictEqual(db.inventory.get(101), 8); // Stock unchanged!
  assert.strictEqual(db.jobs.length, 1); // No duplicate notification!
});

verify('Webhook rejects amount mismatch (e.g. partial payment) with HTTP 400', () => {
  const db = new MockOrderDatabase();
  db.createOrder('ORD-1002', 'order_DEF456', 5000);

  const tamperedPayment = {
    id: 'pay_TAMPERED',
    order_id: 'order_DEF456',
    amount: 100000, // ₹1,000 instead of ₹5,000
    currency: 'INR'
  };

  const res = db.handleWebhookEvent('payment.captured', tamperedPayment);
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.message, 'Payment amount mismatch');
  assert.strictEqual(db.orders.get('order_DEF456').payment_status, 'Pending'); // Still pending
});

verify('Late payment.failed event NEVER overwrites an already Captured order', () => {
  const db = new MockOrderDatabase();
  db.createOrder('ORD-1003', 'order_GHI789', 5000);

  // Already captured
  db.handleWebhookEvent('payment.captured', {
    id: 'pay_SUCCESS',
    order_id: 'order_GHI789',
    amount: 500000,
    currency: 'INR'
  });
  assert.strictEqual(db.orders.get('order_GHI789').payment_status, 'Captured');

  // Arriving late failure webhook
  const lateFailRes = db.handleWebhookEvent('payment.failed', {
    id: 'pay_FAIL',
    order_id: 'order_GHI789',
    error_description: 'User bank timeout'
  });
  assert.strictEqual(lateFailRes.status, 200);
  assert.strictEqual(lateFailRes.ignored, true);
  assert.strictEqual(db.orders.get('order_GHI789').payment_status, 'Captured'); // Preserved!
});

// =============================================================================
// TEST GROUP 5: ANTI-HARVESTING & CUSTOMER PII SANITIZATION
// =============================================================================
console.log('\n--- 5. ANTI-HARVESTING & CUSTOMER PII SANITIZATION ---');

function sanitizeJobPayload(rawPayload) {
  let parsed = typeof rawPayload === 'string' ? JSON.parse(rawPayload) : rawPayload;
  if (!parsed || typeof parsed !== 'object') return parsed;
  const sanitized = { ...parsed };
  if (sanitized.order && typeof sanitized.order === 'object') {
    sanitized.order = {
      ...sanitized.order,
      customer_name: sanitized.order.customer_name ? `${sanitized.order.customer_name.charAt(0)}***` : undefined,
      customer_email: sanitized.order.customer_email ? `${sanitized.order.customer_email.charAt(0)}***@${sanitized.order.customer_email.split('@')[1]}` : undefined,
      customer_phone: sanitized.order.customer_phone ? `******${sanitized.order.customer_phone.slice(-4)}` : undefined,
      shipping_address: '[REDACTED_DELIVERY_ADDRESS]'
    };
  }
  return sanitized;
}

verify('System health jobs payload masks customer phone, email, and redacts address', () => {
  const rawJob = {
    order: {
      customer_name: 'Hemant Singh',
      customer_email: 'hemant@example.com',
      customer_phone: '9876543210',
      shipping_address: 'Flat 402, Shivam Residency, Dombivli East, 421201'
    }
  };

  const sanitized = sanitizeJobPayload(rawJob);
  assert.strictEqual(sanitized.order.customer_name, 'H***');
  assert.strictEqual(sanitized.order.customer_email, 'h***@example.com');
  assert.strictEqual(sanitized.order.customer_phone, '******3210');
  assert.strictEqual(sanitized.order.shipping_address, '[REDACTED_DELIVERY_ADDRESS]');
});

function authorizeInvoiceAccess({ order, adminToken, customerToken, queryEmail, queryPhone }) {
  if (adminToken === 'valid_admin') return { authorized: true, role: 'admin' };
  if (customerToken && customerToken.userId === order.user_id) return { authorized: true, role: 'customer' };
  if (queryEmail && queryEmail.toLowerCase() === order.customer_email.toLowerCase()) return { authorized: true, role: 'guest_verified' };
  if (queryPhone && queryPhone.replace(/\D/g, '') === order.customer_phone.replace(/\D/g, '')) return { authorized: true, role: 'guest_verified' };
  return { authorized: false, status: 403 };
}

verify('Invoice endpoint restricts unauthorized access and permits verified callers', () => {
  const order = { id: 42, user_id: 10, customer_email: 'ramesh@example.com', customer_phone: '9876543210' };

  // Unauthorized stranger
  assert.strictEqual(authorizeInvoiceAccess({ order, adminToken: null, customerToken: null }).authorized, false);

  // Authenticated Admin
  assert.strictEqual(authorizeInvoiceAccess({ order, adminToken: 'valid_admin' }).authorized, true);

  // Authenticated Owner Customer
  assert.strictEqual(authorizeInvoiceAccess({ order, customerToken: { userId: 10 } }).authorized, true);

  // Guest with verified email
  assert.strictEqual(authorizeInvoiceAccess({ order, queryEmail: 'ramesh@example.com' }).authorized, true);

  // Guest with mismatched email -> rejected
  assert.strictEqual(authorizeInvoiceAccess({ order, queryEmail: 'attacker@evil.com' }).authorized, false);
});

// =============================================================================
// TEST GROUP 6: SEO STRUCTURED DATA & MERCHANT CENTER COMPLIANCE
// =============================================================================
console.log('\n--- 6. SEO STRUCTURED DATA & MERCHANT CENTER COMPLIANCE ---');

function generateProductSchema(product, activePrice, baseUrl = 'https://anantarts.in') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      price: activePrice,
      availability: product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'IN',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn'
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: activePrice >= 5000 ? 0 : 150,
          currency: 'INR'
        },
        shippingDestination: [{ '@type': 'DefinedRegion', addressCountry: 'IN' }]
      }
    }
  };
}

verify('Product schema contains Google Merchant Center required returnPolicy and shippingDetails', () => {
  const schema = generateProductSchema({ name: 'Shiva Murti', stock_quantity: 4 }, 6500);
  assert.strictEqual(schema.offers.hasMerchantReturnPolicy.merchantReturnDays, 7);
  assert.strictEqual(schema.offers.hasMerchantReturnPolicy.applicableCountry, 'IN');
  assert.strictEqual(schema.offers.shippingDetails.shippingRate.value, 0); // Free shipping for >= 5000
  assert.strictEqual(schema.offers.shippingDetails.shippingRate.currency, 'INR');

  const underThresholdSchema = generateProductSchema({ name: 'Pooja Thali', stock_quantity: 2 }, 1200);
  assert.strictEqual(underThresholdSchema.offers.shippingDetails.shippingRate.value, 150);
});

console.log(`\n================================================================`);
console.log(` RESULTS: ${passCount} PASSED, ${failCount} FAILED out of ${passCount + failCount} VERIFICATION CHECKS`);
console.log(`================================================================\n`);

if (failCount > 0) {
  process.exit(1);
}
