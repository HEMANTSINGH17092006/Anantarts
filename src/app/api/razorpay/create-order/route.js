import { NextResponse } from 'next/server';
import { createRazorpayOrder, validateAndConvertAmount } from '@/lib/razorpay';
import { createAdminClient } from '@/lib/supabase/admin';
import { withTransaction } from '@/lib/db-transaction';
import { getSessionCustomer } from '../../../auth/actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req) {
  let requestBody = {};
  try {
    requestBody = await req.json();
    console.log("[create-order] Request Body parsed");
    
    // We now expect the FULL order payload from the checkout page
    const { 
      total_amount, order_number, customer_name, customer_email, customer_phone,
      shipping_address, billing_address, coupon_id, discount_amount, shipping_charge,
      subtotal, items, create_account, street_address, city, state, zip
    } = requestBody;

    if (!order_number || !items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, message: 'Invalid order payload.' }, { status: 400 });
    }

    let validated;
    try {
      validated = validateAndConvertAmount(total_amount);
    } catch (amountErr) {
      return NextResponse.json({ message: amountErr.message }, { status: 400 });
    }

    // 1. Create Order in Razorpay First to get the ID
    const orderResult = await createRazorpayOrder({
      amount: validated.amountInRupees,
      currency: 'INR',
      receipt: order_number,
      notes: {
        order_number: order_number
      }
    });

    console.log("[create-order] Razorpay Order Created:", orderResult.order.id);
    const razorpay_order_id = orderResult.order.id;

    // Get authenticated customer
    const customer = await getSessionCustomer();
    let user_id = customer ? customer.id : null;

    const supabase = createAdminClient();

    if (customer) {
      // User is logged in, do nothing extra here (we handle addresses in orders/create if needed, 
      // but maybe we should handle it here too for Razorpay?)
      // Actually we handled it above. 
    } else if (create_account) {
      // Guest requested account creation
      const sanitizedEmail = (customer_email || '').toLowerCase().trim();
      let { data: existingUser } = await supabase.from('users').select('*').eq('email', sanitizedEmail).single();
      
      if (!existingUser) {
        const { data: newUser } = await supabase.from('users').insert({
          name: customer_name,
          email: sanitizedEmail,
          phone: customer_phone,
          role: 'customer'
        }).select('*').single();
        existingUser = newUser;
      }

      if (existingUser) {
        user_id = existingUser.id;
        // Optionally save address
        const { data: existingAddrs } = await supabase.from('user_addresses').select('id').eq('user_id', user_id);
        if (!existingAddrs || existingAddrs.length === 0 && street_address) {
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

    // 2. Pre-Order Generation & Inventory Locking via Transaction
    await withTransaction(async (client) => {
      // Create Pending Order
      const orderRes = await client.query(`
        INSERT INTO orders (
          order_number, user_id, customer_name, customer_email, customer_phone,
          shipping_address, billing_address, coupon_id, discount_amount,
          shipping_charge, subtotal, total_amount, payment_method,
          payment_status, order_status, razorpay_order_id, created_at, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING id
      `, [
        order_number, user_id, customer_name, customer_email, customer_phone,
        shipping_address, billing_address || shipping_address,
        coupon_id || null, discount_amount || 0, shipping_charge || 0,
        subtotal || total_amount, total_amount, 'Razorpay',
        'Pending', 'Pending', razorpay_order_id, new Date().toISOString(), 'Pre-Order Generated awaiting payment.'
      ]);

      const orderRecordId = orderRes.rows[0].id;

      // Insert Items & Create Inventory Locks
      const expiresAt = new Date(Date.now() + 15 * 60000).toISOString(); // 15 mins lock

      for (const item of items) {
        await client.query(`
          INSERT INTO order_items (order_id, product_id, product_name, price, quantity, total_price)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [orderRecordId, item.product_id, item.product_name, item.price, item.quantity, item.price * item.quantity]);

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
        message: `🚨 URGENT: Pre-Order Creation Failed for Order "${requestBody.order_number || 'N/A'}": ${err.message}`,
        is_read: 0,
        type: 'danger',
        link: '/admin/orders'
      });
    } catch (e) {}

    return NextResponse.json({ 
      success: false, 
      message: "Unable to lock inventory or create order. Please try again." 
    }, { status: 500 });
  }
}
