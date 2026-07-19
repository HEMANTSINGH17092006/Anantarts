import { NextResponse } from 'next/server';
import { verifySignature } from '@/lib/razorpay';
import { createAdminClient } from '@/lib/supabase/admin';
import { withTransaction } from '@/lib/db-transaction';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req) {
  try {
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_payment_id || !razorpay_order_id) {
      return NextResponse.json({ success: false, message: 'Missing payment references.' }, { status: 400 });
    }

    const isHmacValid = verifySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature });
    if (!isHmacValid) {
      return NextResponse.json({ success: false, message: 'Signature verification failed.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: order } = await supabase.from('orders').select('*').eq('razorpay_order_id', razorpay_order_id).single();

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    if (order.payment_status === 'Captured') {
      // Webhook beat us to it, just return success
      return NextResponse.json({
        success: true,
        order_number: order.order_number,
        order_id: order.id,
        payment_status: 'Captured'
      });
    }

    let capturedInFastPath = false;

    // Fast-path transaction
    try {
      await withTransaction(async (client) => {
        // We add a strict WHERE condition to ensure we only update if it's still Pending
        const updateRes = await client.query(`
          UPDATE orders 
          SET payment_status = 'Captured', order_status = 'Processing', razorpay_payment_id = $1, razorpay_signature = $2, captured_at = $3
          WHERE id = $4 AND payment_status != 'Captured'
          RETURNING id
        `, [razorpay_payment_id, razorpay_signature, new Date().toISOString(), order.id]);

        if (updateRes.rowCount > 0) {
          capturedInFastPath = true;
          // Deduct stock
          const itemsRes = await client.query(`SELECT product_id, quantity FROM order_items WHERE order_id = $1`, [order.id]);
          for (const item of itemsRes.rows) {
            await client.query(`UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - $1) WHERE id = $2`, [item.quantity, item.product_id]);
          }
          // Remove locks
          await client.query(`DELETE FROM inventory_locks WHERE order_number = $1`, [order.order_number]);
        }
      });
      
      if (capturedInFastPath) {
        // Queue notifications
        const { data: itemsData } = await supabase.from('order_items').select('*').eq('order_id', order.id);
        await supabase.from('background_jobs').insert([
          { type: 'whatsapp_admin', payload: JSON.stringify({ order: { ...order, payment_status: 'Captured', razorpay_payment_id: razorpay_payment_id }, items: itemsData || [] }) },
          { type: 'email_customer', payload: JSON.stringify({ to: order.customer_email, orderNumber: order.order_number, amount: order.total_amount }) }
        ]);
      }

      return NextResponse.json({
        success: true,
        order_number: order.order_number,
        order_id: order.id,
        payment_status: 'Captured'
      });

    } catch (txErr) {
      console.error("Fast-path transaction failed, webhook will handle it:", txErr);
      return NextResponse.json({
        success: true,
        order_number: order.order_number,
        order_id: order.id,
        payment_status: 'Processing',
        warning: 'Payment verified. Order is processing in background.'
      });
    }

  } catch (err) {
    console.error('API /api/razorpay/verify-payment error:', err);
    return NextResponse.json({ success: false, message: `Server error: ${err.message}` }, { status: 500 });
  }
}
