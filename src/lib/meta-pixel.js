/**
 * Meta (Facebook) Pixel / Dataset Client-side Tracking Utility
 * Pixel / Dataset ID: 1487336739900897
 *
 * Implements Standard Meta E-commerce Events:
 * - PageView
 * - ViewContent
 * - AddToCart
 * - InitiateCheckout
 * - Purchase (strictly verified & deduplicated)
 */

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1487336739900897';

const DEDUPE_KEY = 'anant_meta_purchase_tracked_orders';

/**
 * Check if an order has already had its Purchase event recorded
 * Prevents duplicate events across page refreshes, back-navigation, and revisits.
 */
export function isPurchaseTracked(orderIdOrNumber) {
  if (typeof window === 'undefined' || !orderIdOrNumber) return true;
  try {
    const raw = localStorage.getItem(DEDUPE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) && list.includes(String(orderIdOrNumber));
  } catch (e) {
    return false;
  }
}

/**
 * Record an order as having had its Purchase event recorded
 */
export function markPurchaseTracked(orderIdOrNumber) {
  if (typeof window === 'undefined' || !orderIdOrNumber) return;
  try {
    const raw = localStorage.getItem(DEDUPE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const idStr = String(orderIdOrNumber);
    if (Array.isArray(list) && !list.includes(idStr)) {
      list.push(idStr);
      // Keep last 200 orders in storage
      if (list.length > 200) list.shift();
      localStorage.setItem(DEDUPE_KEY, JSON.stringify(list));
    }
  } catch (e) {}
}

/**
 * Safe wrapper for fbq calls
 */
export function fbqTrack(event, data = {}, options = null) {
  if (typeof window === 'undefined') return;
  try {
    if (typeof window.fbq === 'function') {
      if (options) {
        window.fbq('track', event, data, options);
      } else {
        window.fbq('track', event, data);
      }
    }
  } catch (err) {
    console.debug('[MetaPixel] Event track error:', err);
  }
}

/**
 * Track PageView
 */
export function trackPageView() {
  fbqTrack('PageView');
}

/**
 * Track ViewContent (Product detail page view)
 * @param {Object} product
 */
export function trackViewContent(product) {
  if (!product) return;
  const activePrice = Number(
    product.discount_price && product.discount_price > 0
      ? product.discount_price
      : product.price
  ) || 0;

  fbqTrack('ViewContent', {
    content_ids: [String(product.sku || product.id || '')],
    content_type: 'product',
    content_name: String(product.name || '').trim(),
    value: activePrice,
    currency: 'INR',
  });
}

// In-memory single-click debounce tracker to prevent duplicate AddToCart from a single click
let lastAddToCart = { id: null, time: 0 };

/**
 * Track AddToCart (Fires only after successful add action)
 * @param {Object} product
 * @param {number} quantity
 */
export function trackAddToCart(product, quantity = 1) {
  if (!product) return;
  const productId = String(product.sku || product.id || '');
  const now = Date.now();

  // Prevent duplicate events from rapid double-clicks within 600ms
  if (lastAddToCart.id === productId && now - lastAddToCart.time < 600) {
    return;
  }
  lastAddToCart = { id: productId, time: now };

  const activePrice = Number(
    product.discount_price && product.discount_price > 0
      ? product.discount_price
      : product.price
  ) || 0;

  const totalValue = activePrice * Math.max(1, Number(quantity) || 1);

  fbqTrack('AddToCart', {
    content_ids: [productId],
    content_type: 'product',
    content_name: String(product.name || '').trim(),
    value: totalValue,
    currency: 'INR',
  });
}

/**
 * Track InitiateCheckout (When customer enters checkout page with items)
 * @param {Array} cart
 * @param {number} total
 */
export function trackInitiateCheckout(cart = [], total = 0) {
  if (!Array.isArray(cart) || cart.length === 0) return;

  const contentIds = cart
    .map(item => String(item.sku || item.id || ''))
    .filter(Boolean);

  const numItems = cart.reduce(
    (acc, item) => acc + (Number(item.quantity) || 1),
    0
  );

  const cartTotal = Number(total) || 0;

  fbqTrack('InitiateCheckout', {
    content_ids: contentIds,
    content_type: 'product',
    value: cartTotal,
    currency: 'INR',
    num_items: numItems,
  });
}

/**
 * Track Purchase
 * STRICT RULES:
 * - Only genuine paid/confirmed orders
 * - NEVER on Pending Verification, Failed, or Rejected
 * - Deduplicated using order number & eventID
 * - NEVER sends personal information (no phone, email, address, UPI ID, UTR)
 *
 * @param {Object} order
 */
export function trackPurchase(order) {
  if (!order) return;

  const orderNumber = String(order.order_number || order.order_id || order.id || '').trim();
  if (!orderNumber) return;

  // 1. STRICT STATUS CHECK: Must be genuinely Paid or Captured
  const status = String(order.payment_status || '').toLowerCase().trim();
  const isPaid = status === 'paid' || status === 'captured';

  if (!isPaid) {
    // STRICTLY DO NOT FIRE for 'pending verification', 'pending', 'rejected', 'failed'
    return;
  }

  // 2. DEDUPLICATION CHECK: Never fire twice for the same order
  if (isPurchaseTracked(orderNumber)) {
    return;
  }

  // 3. Extract safe cart/order items
  const items = Array.isArray(order.items)
    ? order.items
    : Array.isArray(order.order_items)
    ? order.order_items
    : [];

  const contentIds = items
    .map(i => String(i.sku || i.product_id || i.id || ''))
    .filter(Boolean);

  const numItems = items.reduce(
    (acc, i) => acc + (Number(i.quantity) || 1),
    0
  ) || 1;

  const finalTotal = Number(order.total_amount) || Number(order.total) || 0;

  // 4. Fire standard Purchase event with official eventID deduplication
  fbqTrack(
    'Purchase',
    {
      content_ids: contentIds.length > 0 ? contentIds : [orderNumber],
      content_type: 'product',
      value: finalTotal,
      currency: 'INR',
      num_items: numItems,
    },
    { eventID: orderNumber }
  );

  // 5. Mark as tracked locally to protect against page refreshes / revisits
  markPurchaseTracked(orderNumber);
}
