import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'anant_arts_divine_key_999');

export async function POST(request) {
  try {
    // 1. Authenticate Admin Token
    const tokenCookie = request.cookies.get('token');
    const token = tokenCookie?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized. Admin authentication required.' }, { status: 401 });
    }

    try {
      const { payload } = await jose.jwtVerify(token, JWT_SECRET_KEY);
      const adminRoles = ['admin', 'super_admin', 'manager'];
      if (!adminRoles.includes(payload.role)) {
        return NextResponse.json({ message: 'Forbidden. Admin privileges required.' }, { status: 403 });
      }
    } catch (authErr) {
      return NextResponse.json({ message: 'Unauthorized. Invalid or expired admin token.' }, { status: 401 });
    }

    // 2. Parse Order ID & Number
    const body = await request.json();
    const { orderId, orderNumber } = body;

    if (!orderId) {
      return NextResponse.json({ message: 'Order ID is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 3. Verify Order Exists
    const { data: existingOrder, error: fetchErr } = await supabase
      .from('orders')
      .select('id, order_number, payment_status')
      .eq('id', orderId)
      .maybeSingle();

    if (fetchErr || !existingOrder) {
      return NextResponse.json({ message: 'Order not found in database.' }, { status: 404 });
    }

    const targetOrderNumber = orderNumber || existingOrder.order_number;

    // 4. Delete related child records first to maintain relational integrity
    // a. Delete order_items
    await supabase.from('order_items').delete().eq('order_id', orderId);

    // b. Delete order_tracking_events
    await supabase.from('order_tracking_events').delete().eq('order_id', orderId);

    // c. Delete optional related tables if they exist
    try {
      await supabase.from('invoices').delete().eq('order_id', orderId);
    } catch (e) { /* table may not exist */ }

    try {
      if (targetOrderNumber) {
        await supabase.from('payment_logs').delete().eq('order_number', targetOrderNumber);
        await supabase.from('inventory_locks').delete().eq('order_number', targetOrderNumber);
      }
    } catch (e) { /* optional log tables */ }

    try {
      if (targetOrderNumber) {
        await supabase.from('notifications').delete().like('link', `%${targetOrderNumber}%`);
      }
    } catch (e) { /* optional notifications table */ }

    // 5. Delete parent record from orders table (Physical DELETE)
    const { error: deleteOrderErr } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (deleteOrderErr) {
      console.error('Error deleting order from orders table:', deleteOrderErr);
      return NextResponse.json({ message: 'Failed to delete order. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Order permanently deleted.'
    });

  } catch (err) {
    console.error('Permanent Order Delete Error:', err);
    return NextResponse.json({ message: 'Failed to delete order. Please try again.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  return POST(request);
}
