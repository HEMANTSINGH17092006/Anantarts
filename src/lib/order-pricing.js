import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Validates order line items, catalog prices, stock levels, coupons, and shipping fees.
 * Produces authoritative calculated totals directly from database records.
 *
 * @param {Object} params
 * @param {Array} params.items - Array of { product_id, quantity }
 * @param {number|string|null} [params.coupon_id] - Optional coupon ID
 * @param {number|null} [params.clientTotalAmount] - Optional client total to verify against
 * @param {Object} [params.supabaseClient] - Optional Supabase admin client instance
 * @returns {Promise<Object>} Authoritative pricing breakdown or error
 */
export async function validateAndCalculateOrderPrices({
  items,
  coupon_id = null,
  clientTotalAmount = null,
  supabaseClient = null,
}) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return {
      success: false,
      statusCode: 400,
      message: 'Order items are required and must be a non-empty array.',
    };
  }

  const supabase = supabaseClient || createAdminClient();

  // 1. Validate Product Identifiers
  const productIds = items
    .map((item) => Number(item.product_id))
    .filter((id) => !isNaN(id) && id > 0);

  if (productIds.length !== items.length) {
    return {
      success: false,
      statusCode: 400,
      message: 'Invalid product identifiers in order items.',
    };
  }

  // 2. Fetch Authoritative Product Catalog Records
  const { data: dbProducts, error: dbProdErr } = await supabase
    .from('products')
    .select('id, name, price, discount_price, stock_quantity, is_published')
    .in('id', productIds);

  if (dbProdErr || !dbProducts) {
    console.error('[Order Pricing] Database product fetch error:', dbProdErr);
    return {
      success: false,
      statusCode: 500,
      message: 'Failed to verify product prices from catalog.',
    };
  }

  const dbProductMap = new Map();
  dbProducts.forEach((p) => dbProductMap.set(p.id, p));

  let authoritativeSubtotal = 0;
  const authoritativeItems = [];

  // 3. Line Item Validation: Existence, Stock, and Authoritative Price
  for (const item of items) {
    const pId = Number(item.product_id);
    const qty = parseInt(item.quantity, 10);

    if (isNaN(qty) || qty < 1 || qty > 50) {
      return {
        success: false,
        statusCode: 400,
        message: `Invalid quantity for item ID ${pId}. Must be between 1 and 50.`,
      };
    }

    const dbProduct = dbProductMap.get(pId);
    if (!dbProduct) {
      return {
        success: false,
        statusCode: 400,
        message: `Product ID ${pId} not found in catalog.`,
      };
    }

    if (dbProduct.is_published === 0) {
      return {
        success: false,
        statusCode: 400,
        message: `Product "${dbProduct.name}" is currently unavailable.`,
      };
    }

    // Check stock quantity
    const availableStock = dbProduct.stock_quantity ?? 0;
    if (availableStock < qty) {
      return {
        success: false,
        statusCode: 400,
        message: `Insufficient stock for "${dbProduct.name}". Only ${availableStock} available.`,
      };
    }

    // Authoritative unit price: prioritize active discount_price if valid
    let unitPrice = Number(dbProduct.price);
    if (dbProduct.discount_price !== null && dbProduct.discount_price !== undefined) {
      const discPrice = Number(dbProduct.discount_price);
      if (!isNaN(discPrice) && discPrice > 0 && discPrice < unitPrice) {
        unitPrice = discPrice;
      }
    }

    const itemTotalPrice = unitPrice * qty;
    authoritativeSubtotal += itemTotalPrice;

    authoritativeItems.push({
      product_id: dbProduct.id,
      product_name: dbProduct.name,
      price: unitPrice,
      quantity: qty,
      total_price: itemTotalPrice,
    });
  }

  // 4. Authoritative Coupon Discount Calculation
  let authoritativeDiscount = 0;
  let appliedCouponId = null;

  if (coupon_id) {
    const cId = Number(coupon_id);
    if (!isNaN(cId) && cId > 0) {
      const { data: dbCoupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('id', cId)
        .maybeSingle();

      if (dbCoupon && dbCoupon.is_active === 1) {
        const now = new Date();
        const isNotExpired = !dbCoupon.end_date || new Date(dbCoupon.end_date) >= now;
        const isWithinUsageLimit =
          !dbCoupon.usage_limit || (dbCoupon.times_used || 0) < dbCoupon.usage_limit;
        const meetsMinAmount =
          !dbCoupon.min_order_amount || authoritativeSubtotal >= Number(dbCoupon.min_order_amount);

        if (isNotExpired && isWithinUsageLimit && meetsMinAmount) {
          appliedCouponId = dbCoupon.id;
          if (dbCoupon.discount_type === 'percentage') {
            const rawDiscount = (authoritativeSubtotal * Number(dbCoupon.discount_value)) / 100;
            authoritativeDiscount = Math.round(rawDiscount);
          } else {
            authoritativeDiscount = Number(dbCoupon.discount_value) || 0;
          }
          // Cap discount at subtotal
          authoritativeDiscount = Math.min(authoritativeDiscount, authoritativeSubtotal);
        }
      }
    }
  }

  // 5. Authoritative Shipping Calculation from Store Settings
  const { data: settingsData } = await supabase.from('website_settings').select('key, value');
  const settingsMap = {};
  if (settingsData) {
    settingsData.forEach((r) => {
      settingsMap[r.key] = r.value;
    });
  }

  const freeShippingThreshold = Number(settingsMap.free_shipping_threshold) || 5000;
  const flatShippingFee = Number(settingsMap.flat_shipping_fee) || 150;

  const netSubtotal = authoritativeSubtotal - authoritativeDiscount;
  const authoritativeShipping = netSubtotal >= freeShippingThreshold ? 0 : flatShippingFee;

  // 6. Authoritative Total Calculation
  const authoritativeTotal =
    Math.round((authoritativeSubtotal - authoritativeDiscount + authoritativeShipping) * 100) / 100;

  // 7. Strict Client Price Anti-Manipulation Check
  if (clientTotalAmount !== undefined && clientTotalAmount !== null) {
    const clientTotalNum = Number(clientTotalAmount);
    if (Math.abs(clientTotalNum - authoritativeTotal) > 1) {
      console.error(
        `[Price Manipulation Alert] Authoritative total ₹${authoritativeTotal} vs Client total ₹${clientTotalNum}`
      );
      return {
        success: false,
        statusCode: 400,
        message: `Order total discrepancy detected. Authoritative calculated total is ₹${authoritativeTotal}. Please refresh your cart.`,
      };
    }
  }

  return {
    success: true,
    authoritativeSubtotal,
    authoritativeDiscount,
    appliedCouponId,
    authoritativeShipping,
    authoritativeTotal,
    authoritativeItems,
    settingsMap,
  };
}
