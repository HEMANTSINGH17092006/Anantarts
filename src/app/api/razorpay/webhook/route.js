import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { createAdminClient } from '@/lib/supabase/admin';
import { withTransaction } from '@/lib/db-transaction';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        return NextResponse.json({ message: 'Invalid webhook signature.' }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;

    console.log(`[Webhook Event Received]: ${eventType}`);
    const supabase = createAdminClient();

    if (eventType === 'payment.captured') {
      const payment = payload.payment.entity;
      const paymentId = payment.id;
      const razorpayOrderId = payment.order_id;

      if (!razorpayOrderId) {
        console.error("Webhook received capture without order ID. Ignoring or fallback handling required.");
        return NextResponse.json({ success: true });
      }

      // Find the pending order
      const { data: order } = await supabase.from('orders').select('*').eq('razorpay_order_id', razorpayOrderId).single();
      
      if (!order) {
        console.error(`[Webhook] Order missing for Razorpay Order ID: ${razorpayOrderId}`);
        return NextResponse.json({ success: true });
      }

      if (order.payment_status === 'Captured') {
        console.log(`[Webhook] Order ${order.order_number} already captured (likely by verify-payment). Acknowledging.`);
        return NextResponse.json({ success: true });
      }

      console.log(`[Webhook] Executing Capture Transaction for Order ${order.order_number}`);

      await withTransaction(async (client) => {
        // 1. Update Order
        await client.query(`
          UPDATE orders 
          SET payment_status = 'Captured', order_status = 'Processing', razorpay_payment_id = $1, captured_at = $2
          WHERE id = $3
        `, [paymentId, new Date().toISOString(), order.id]);

        // 2. Fetch order items to deduct stock
        const itemsRes = await client.query(`SELECT product_id, quantity FROM order_items WHERE order_id = $1`, [order.id]);
        
        for (const item of itemsRes.rows) {
          // 3. Deduct Stock Permanently
          await client.query(`UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - $1) WHERE id = $2`, [item.quantity, item.product_id]);
        }

        // 4. Release Inventory Locks
        await client.query(`DELETE FROM inventory_locks WHERE order_number = $1`, [order.order_number]);
      });

      // 5. Queue Notifications
      const { data: itemsData } = await supabase.from('order_items').select('*').eq('order_id', order.id);
      await supabase.from('background_jobs').insert([
        { type: 'whatsapp_admin', payload: JSON.stringify({ order: { ...order, payment_status: 'Captured', razorpay_payment_id: paymentId }, items: itemsData || [] }) },
        { type: 'email_customer', payload: JSON.stringify({ to: order.customer_email, orderNumber: order.order_number, amount: order.total_amount }) }
      ]);
      console.log(`[Webhook] Successfully processed capture for ${order.order_number}`);
    } 
    else if (eventType === 'payment.failed') {
      const payment = payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      const failureReason = payment.error_description || 'Payment failed';

      if (razorpayOrderId) {
        await supabase.from('orders').update({
          payment_status: 'Failed',
          notes: `Payment Failed: ${failureReason}`
        }).eq('razorpay_order_id', razorpayOrderId);

        // Optionally queue a failure email here
      }
    }

    return NextResponse.json({ success: true, event: eventType });
  } catch (err) {
    console.error('API /api/razorpay/webhook error:', err);
    return NextResponse.json({ success: false, message: 'Webhook processing error.' }, { status: 500 });
  }
}
