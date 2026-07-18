import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      order_number,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      billing_address,
      coupon_id,
      discount_amount,
      shipping_charge,
      subtotal,
      total_amount,
      payment_method,
      payment_status,
      payment_id,
      items
    } = body;

    if (!order_number || !customer_name || !customer_email || !customer_phone || !shipping_address || !items || items.length === 0) {
      return NextResponse.json({ message: 'Missing required order details.' }, { status: 400 });
    }

    // Use service role admin client to bypass RLS and perform database insertions
    const supabase = createAdminClient();

    // 1. Verify stock availability for all products before creating the order
    for (const item of items) {
      const { data: prod, error: prodErr } = await supabase
        .from('products')
        .select('name, stock_quantity')
        .eq('id', item.product_id)
        .single();

      if (prodErr || !prod) {
        return NextResponse.json({ message: `Product check failed for item: ${item.product_name}.` }, { status: 400 });
      }

      if (prod.stock_quantity < item.quantity) {
        return NextResponse.json({ 
          message: `Insufficient stock for product "${prod.name}". Only ${prod.stock_quantity} left in stock.` 
        }, { status: 400 });
      }
    }

    // 2. Insert order record
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        order_number,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        billing_address,
        coupon_id,
        discount_amount,
        shipping_charge,
        subtotal,
        total_amount,
        payment_method,
        payment_status: payment_status || 'Pending',
        order_status: 'Pending',
        notes: payment_id ? `Payment Gateway Transaction ID: ${paymentId}` : ''
      })
      .select('*')
      .single();

    if (orderErr || !order) {
      console.error('Order Insert Error:', orderErr);
      return NextResponse.json({ message: 'Failed to create order record.' }, { status: 500 });
    }

    // 3. Process items, adjust stock levels, and check stock warnings
    for (const item of items) {
      // Insert order item
      const { error: itemErr } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          price: item.price,
          quantity: item.quantity,
          total_price: item.price * item.quantity
        });

      if (itemErr) {
        console.error('Order Item Insert Error:', itemErr);
        // Continue but log error
      }

      // Fetch current stock to subtract
      const { data: prod } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single();
        
      const nextStock = Math.max(0, prod.stock_quantity - item.quantity);

      // Update product stock
      await supabase
        .from('products')
        .update({ stock_quantity: nextStock })
        .eq('id', item.product_id);

      // Low Stock Alert Notification
      if (nextStock < 5) {
        await supabase
          .from('notifications')
          .insert({
            message: `⚠️ Low Stock Alert: Product "${item.product_name}" is down to ${nextStock} items in inventory.`,
            is_read: 0,
            type: 'warning',
            link: `/admin/products?search=${encodeURIComponent(item.product_name)}`
          });
      }
    }

    // 4. Update coupon usage count if coupon applied
    if (coupon_id) {
      const { data: c } = await supabase.from('coupons').select('times_used').eq('id', coupon_id).single();
      if (c) {
        await supabase
          .from('coupons')
          .update({ times_used: (c.times_used || 0) + 1 })
          .eq('id', coupon_id);
      }
    }

    // 5. Create general order alert notification for Admin
    await supabase
      .from('notifications')
      .insert({
        message: `🎉 New Order Registered: Order ${order_number} placed by ${customer_name} for ${formatPrice(total_amount)}.`,
        is_read: 0,
        type: 'success',
        link: `/admin/orders`
      });

    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error('Order Process Error:', err);
    return NextResponse.json({ message: 'Internal Server Error while completing check-out.' }, { status: 500 });
  }
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(price);
}
