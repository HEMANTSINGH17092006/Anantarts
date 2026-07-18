import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { contactInfo } = await req.json();
    if (!contactInfo || !contactInfo.trim()) {
      return NextResponse.json({ message: 'Email or Phone number is required.' }, { status: 400 });
    }

    const value = contactInfo.trim();
    const supabase = createAdminClient();

    // Query orders matching email or phone
    const { data: orders, error: ordersErr } = await supabase
      .from('orders')
      .select('*')
      .or(`customer_email.ilike.%${value}%,customer_phone.eq.${value}`)
      .order('created_at', { ascending: false });

    if (ordersErr) {
      console.error('Error fetching orders:', ordersErr);
      return NextResponse.json({ message: 'Error retrieving orders.' }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: true, orders: [] });
    }

    const orderIds = orders.map(o => o.id);

    // Fetch order items
    const { data: items, error: itemsErr } = await supabase
      .from('order_items')
      .select('*, products(id, product_images(image_path, is_primary))')
      .in('order_id', orderIds);

    if (itemsErr) {
      console.error('Error fetching order items:', itemsErr);
      return NextResponse.json({ message: 'Error retrieving order items.' }, { status: 500 });
    }

    // Attach items to orders, mapping product images
    const ordersWithItems = orders.map(order => {
      const orderItems = items
        .filter(item => item.order_id === order.id)
        .map(item => {
          const images = item.products?.product_images || [];
          const primaryImg = images.find(img => img.is_primary === 1) || images[0];
          return {
            id: item.id,
            product_id: item.product_id,
            product_name: item.product_name,
            price: item.price,
            quantity: item.quantity,
            total_price: item.total_price,
            image_path: primaryImg?.image_path || '/images/placeholder.jpg'
          };
        });

      return {
        ...order,
        items: orderItems
      };
    });

    return NextResponse.json({ success: true, orders: ordersWithItems });
  } catch (err) {
    console.error('Retrieve orders error:', err);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
