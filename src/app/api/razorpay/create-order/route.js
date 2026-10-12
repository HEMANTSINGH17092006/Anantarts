import { NextResponse } from 'next/server';
import { createRazorpayOrder, validateAndConvertAmount, validateCredentials } from '@/lib/razorpay';
import { createAdminClient } from '@/lib/supabase/admin';
import { withTransaction } from '@/lib/db-transaction';
import { validateAndCalculateOrderPrices } from '@/lib/order-pricing';
import { getSessionCustomer } from '../../../auth/actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req) {
  let requestBody = {};
  try {
    requestBody = await req.json();

    const {
      total_amount,
      order_number,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      billing_address,
      coupon_id,
      items,
      create_account,
      street_address,
      city,
      state,
      zip,
      currency = 'INR'
    } = requestBody;

    // 1. Payload validation
    if (!order_number || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid order payload. Items are required.' }, { status: 400 });
    }

    // Currency strictly INR
    if (currency && String(currency).toUpperCase() !== 'INR') {
      return NextResponse.json({ success: false, message: 'Invalid currency. Only INR transactions are supported.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 2. Idempotency Check: prevent duplicate pre-order submission
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, order_number, payment_status, total_amount, razorpay_order_id')
      .eq('order_number', order_number)
      .maybeSingle();

    if (existingOrder) {
      if (existingOrder.payment_status === 'Captured' || existingOrder.payment_status === 'Paid') {
        return NextResponse.json({
          success: false,
          message: `Order ${order_number} has already been paid.`
        }, { status: 409 });
      }

      // If already created and pending with a valid razorpay_order_id, return it cleanly
      if (existingOrder.razorpay_order_id) {
        const creds = validateCredentials();
        return NextResponse.json({
          success: true,
          order_id: existingOrder.razorpay_order_id,
          key_id: creds.key_id,
          amount: Math.round(Number(existingOrder.total_amount) * 100),
          currency: 'INR'
        });
      }
    }

    // 3. Authoritative Server-Side Price, Stock, Coupon, and Shipping Recalculation
    const pricingResult = await validateAndCalculateOrderPrices({
      items,
      coupon_id,
      clientTotalAmount: total_amount,
      supabaseClient: supabase
    });

    if (!pricingResult.success) {
      return NextResponse.json({
        success: false,
        message: pricingResult.message
      }, { status: pricingResult.statusCode || 400 });
    }

    const {
      authoritativeSubtotal,
      authoritativeDiscount,
      appliedCouponId,
      authoritativeShipping,
      authoritativeTotal,
      authoritativeItems
    } = pricingResult;

    // 4. Validate authoritative amount and create Order in Razorpay
    const validated = validateAndConvertAmount(authoritativeTotal);

    const orderResult = await createRazorpayOrder({
      amount: validated.amountInRupees,
      currency: 'INR',
      receipt: order_number,
      notes: {
        order_number: order_number
      }
    });

    const razorpay_order_id = orderResult.order.id;

    // 5. Customer Session / Guest Account Setup
    const customer = await getSessionCustomer();
    let user_id = customer ? customer.id : null;

    if (!customer && create_account && customer_email) {
      const sanitizedEmail = String(customer_email).toLowerCase().trim();
      let { data: existingUser } = await supabase.from('users').select('id').eq('email', sanitizedEmail).maybeSingle();

      if (!existingUser) {
        const { data: newUser } = await supabase.from('users').insert({
          name: customer_name,
          email: sanitizedEmail,
          phone: customer_phone,
          role: 'customer'
        }).select('id').single();
        existingUser = newUser;
      }

      if (existingUser) {
        user_id = existingUser.id;
        if (street_address) {
          const { data: existingAddrs } = await supabase.from('user_addresses').select('id').eq('user_id', user_id);
          if (!existingAddrs || existingAddrs.length === 0) {
            await supabase.from('user_addresses').insert({
              user_id: user_id,
              name: customer_name,
              phone: customer_phone,
              address: street_address,
              city: city,
              state: state,
              pincode: zip,
              is_default: 1
            });
          }
        }
      }
    }

    // 6. Pre-Order Generation & Inventory Locking via Database Transaction
    await withTransaction(async (client) => {
      // Create Pending Order with authoritative calculated figures
      const orderRes = await client.query(`
        INSERT INTO orders (
          order_number, user_id, customer_name, customer_email, customer_phone,
          shipping_address, billing_address, coupon_id, discount_amount,
          shipping_charge, subtotal, total_amount, payment_method,
          payment_status, order_status, razorpay_order_id, created_at, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id
      `, [
        order_number,
        user_id,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        billing_address || shipping_address,
        appliedCouponId,
        authoritativeDiscount,
        authoritativeShipping,
        authoritativeSubtotal,
        authoritativeTotal,
        'Razorpay',
        'Pending',
        'Pending',
        razorpay_order_id,
        new Date().toISOString(),
        'Pre-Order Generated awaiting payment.'
      ]);

      const orderRecordId = orderRes.rows[0].id;

      // Insert Items & Create Inventory Locks
      const expiresAt = new Date(Date.now() + 15 * 60000).toISOString(); // 15 mins lock

      for (const item of authoritativeItems) {
        await client.query(`
          INSERT INTO order_items (order_id, product_id, product_name, price, quantity, total_price)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [orderRecordId, item.product_id, item.product_name, item.price, item.quantity, item.total_price]);

        await client.query(`
          INSERT INTO inventory_locks (order_number, product_id, quantity, expires_at)
          VALUES ($1, $2, $3, $4)
        `, [order_number, item.product_id, item.quantity, expiresAt]);
      }
    });

    return NextResponse.json({
      success: true,
      order_id: razorpay_order_id,
      key_id: orderResult.key_id,
      amount: orderResult.order.amount,
      currency: orderResult.order.currency
    });
  } catch (err) {
    console.error('API /api/razorpay/create-order execution exception:', err);
    try {
      const supabase = createAdminClient();
      await supabase.from('notifications').insert({
        message: `🚨 URGENT: Pre-Order Creation Failed for Order "${requestBody?.order_number || 'N/A'}": ${err.message}`,
        is_read: 0,
        type: 'danger',
        link: '/admin/orders'
      });
    } catch (e) {}

    return NextResponse.json({
      success: false,
      message: err.message || 'Unable to initialize payment or lock inventory. Please try again.'
    }, { status: 500 });
  }
}
