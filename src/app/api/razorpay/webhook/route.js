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

    if (!signature) {
      console.error('[Razorpay Webhook] Missing x-razorpay-signature header.');
      return NextResponse.json({ success: false, message: 'Missing webhook signature header.' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Check environment first, then fallback to database settings
    let webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      const { data: secretSetting } = await supabase
        .from('website_settings')
        .select('value')
        .eq('key', 'razorpay_webhook_secret')
        .maybeSingle();

      if (secretSetting?.value) {
        webhookSecret = secretSetting.value;
      }
    }

    if (!webhookSecret) {
      console.error('[Razorpay Webhook Security Error] RAZORPAY_WEBHOOK_SECRET is not configured.');
      return NextResponse.json({ success: false, message: 'Webhook secret is not configured on the server.' }, { status: 500 });
    }

    // Require valid webhook signature verification unconditionally
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error('[Razorpay Webhook Security Error] Invalid webhook signature detected.');
      return NextResponse.json({ success: false, message: 'Invalid webhook signature.' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;

    console.log(`[Webhook Event Verified]: ${eventType}`);

    if (eventType === 'payment.captured') {
      const payment = payload?.payment?.entity;
      if (!payment) {
        return NextResponse.json({ success: false, message: 'Invalid payment payload.' }, { status: 400 });
      }

      const paymentId = payment.id;
      const razorpayOrderId = payment.order_id;

      if (!razorpayOrderId) {
        console.error('[Webhook] Capture event received without order ID.');
        return NextResponse.json({ success: false, message: 'Missing order_id in payment payload.' }, { status: 400 });
      }

      // Find the order
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('razorpay_order_id', razorpayOrderId)
        .maybeSingle();
      
      if (orderErr || !order) {
        console.error(`[Webhook] Order missing for Razorpay Order ID: ${razorpayOrderId}`);
        return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
      }

      // Idempotency: If already captured, acknowledge immediately without duplicate processing
      if (order.payment_status === 'Captured') {
        console.log(`[Webhook Idempotent] Order ${order.order_number} already marked Captured. Acknowledging.`);
        return NextResponse.json({ success: true, message: 'Order already captured.' });
      }

      // Verify payment amount and currency match authoritative order records
      const expectedPaise = Math.round(Number(order.total_amount) * 100);
      if (typeof payment.amount === 'number' && payment.amount !== expectedPaise) {
        console.error(`[Webhook Security Alert] Amount mismatch for order ${order.order_number}: expected ${expectedPaise} paise, received ${payment.amount} paise.`);
        return NextResponse.json({ success: false, message: 'Payment amount mismatch.' }, { status: 400 });
      }

      if (payment.currency && String(payment.currency).toUpperCase() !== 'INR') {
        console.error(`[Webhook Security Alert] Currency mismatch for order ${order.order_number}: expected INR, received ${payment.currency}.`);
        return NextResponse.json({ success: false, message: 'Invalid currency.' }, { status: 400 });
      }

      console.log(`[Webhook] Executing Capture Transaction for Order ${order.order_number}`);

      let capturedInWebhook = false;

      await withTransaction(async (client) => {
        // Atomic status transition check to guarantee exactly-once processing
        const updateRes = await client.query(`
          UPDATE orders 
          SET payment_status = 'Captured', order_status = 'Processing', razorpay_payment_id = $1, captured_at = $2
          WHERE id = $3 AND payment_status != 'Captured'
          RETURNING id
        `, [paymentId, new Date().toISOString(), order.id]);

        if (updateRes.rowCount > 0) {
          capturedInWebhook = true;

          // 2. Fetch order items to deduct stock
          const itemsRes = await client.query(`SELECT product_id, quantity FROM order_items WHERE order_id = $1`, [order.id]);
          
          for (const item of itemsRes.rows) {
            // 3. Deduct Stock Permanently with non-negative guard
            await client.query(`UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - $1) WHERE id = $2`, [item.quantity, item.product_id]);
          }

          // 4. Release Inventory Locks
          await client.query(`DELETE FROM inventory_locks WHERE order_number = $1`, [order.order_number]);
        }
      });

      // 5. Queue Notifications only if the transition occurred in this call
      if (capturedInWebhook) {
        const { data: itemsData } = await supabase.from('order_items').select('*').eq('order_id', order.id);
        await supabase.from('background_jobs').insert([
          { type: 'whatsapp_admin', payload: JSON.stringify({ order: { ...order, payment_status: 'Captured', razorpay_payment_id: paymentId }, items: itemsData || [] }) },
          { type: 'email_customer', payload: JSON.stringify({ to: order.customer_email, orderNumber: order.order_number, amount: order.total_amount }) }
        ]);
        console.log(`[Webhook] Successfully processed capture and queued jobs for ${order.order_number}`);
      } else {
        console.log(`[Webhook] Order ${order.order_number} was concurrently captured by another process. Skipping duplicate side effects.`);
      }
    } 
    else if (eventType === 'payment.failed') {
      const payment = payload?.payment?.entity;
      const razorpayOrderId = payment?.order_id;
      const failureReason = payment?.error_description || 'Payment failed';

      if (razorpayOrderId) {
        // Prevent overwriting orders that have already been Captured
        await supabase
          .from('orders')
          .update({
            payment_status: 'Failed',
            notes: `Payment Failed: ${failureReason}`
          })
          .eq('razorpay_order_id', razorpayOrderId)
          .neq('payment_status', 'Captured');
      }
    }

    return NextResponse.json({ success: true, event: eventType });
  } catch (err) {
    console.error('API /api/razorpay/webhook error:', err);
    return NextResponse.json({ success: false, message: 'Webhook processing error.' }, { status: 500 });
  }
}
