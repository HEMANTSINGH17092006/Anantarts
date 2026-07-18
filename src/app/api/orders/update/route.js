import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { orderId, action, data } = await req.json();

    if (!orderId || !action) {
      return NextResponse.json({ message: 'Order ID and Action are required.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch order details to verify status
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 });
    }

    // Restriction: Changes allowed only before shipping
    const restrictedStatuses = ['Shipped', 'Delivered', 'Cancelled'];
    if (restrictedStatuses.includes(order.order_status)) {
      return NextResponse.json({ 
        message: `Changes not allowed. Order has already been ${order.order_status.toLowerCase()}.` 
      }, { status: 400 });
    }

    if (action === 'cancel') {
      // Update order status to Cancelled
      const { error: updateErr } = await supabase
        .from('orders')
        .update({ order_status: 'Cancelled' })
        .eq('id', order.id);

      if (updateErr) {
        return NextResponse.json({ message: 'Failed to cancel the order.' }, { status: 500 });
      }

      // Restock inventory
      const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      if (items && items.length > 0) {
        for (const item of items) {
          if (item.product_id) {
            const { data: prod } = await supabase
              .from('products')
              .select('stock_quantity')
              .eq('id', item.product_id)
              .single();

            if (prod) {
              const restoredStock = prod.stock_quantity + item.quantity;
              await supabase
                .from('products')
                .update({ stock_quantity: restoredStock })
                .eq('id', item.product_id);
            }
          }
        }
      }

      // Create admin notification
      await supabase
        .from('notifications')
        .insert({
          message: `🚫 Order Cancelled: Customer cancelled order ${order.order_number}.`,
          is_read: 0,
          type: 'info',
          link: `/admin/orders`
        });

      return NextResponse.json({ success: true, message: 'Order successfully cancelled.' });

    } else if (action === 'update_shipping') {
      const { name, phone, address, city, state, zip } = data || {};

      if (!name || !name.trim()) {
        return NextResponse.json({ message: 'Recipient name is required.' }, { status: 400 });
      }
      if (!phone || !phone.trim() || !/^\+?[0-9\s\-]{8,15}$/.test(phone.trim())) {
        return NextResponse.json({ message: 'Please enter a valid phone number.' }, { status: 400 });
      }
      if (!address || !address.trim()) {
        return NextResponse.json({ message: 'Street address cannot be empty.' }, { status: 400 });
      }
      if (!city || !city.trim()) {
        return NextResponse.json({ message: 'City is required.' }, { status: 400 });
      }
      if (!state || !state.trim()) {
        return NextResponse.json({ message: 'State is required.' }, { status: 400 });
      }
      if (!zip || !zip.trim() || !/^[0-9]{5,6}$/.test(zip.trim())) {
        return NextResponse.json({ message: 'Please enter a valid pincode/zipcode.' }, { status: 400 });
      }

      const formattedAddress = `${address.trim()}, ${city.trim()}, ${state.trim()} - ${zip.trim()}, India`;

      const { error: updateErr } = await supabase
        .from('orders')
        .update({
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          shipping_address: formattedAddress,
          billing_address: formattedAddress
        })
        .eq('id', order.id);

      if (updateErr) {
        return NextResponse.json({ message: 'Failed to update delivery details.' }, { status: 500 });
      }

      // Create admin notification
      await supabase
        .from('notifications')
        .insert({
          message: `✍️ Order Update: Delivery details updated for order ${order.order_number} by customer.`,
          is_read: 0,
          type: 'info',
          link: `/admin/orders`
        });

      return NextResponse.json({ success: true, message: 'Delivery details successfully updated.' });
    }

    return NextResponse.json({ message: 'Invalid action requested.' }, { status: 400 });

  } catch (err) {
    console.error('Order update endpoint error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
