import { NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db-transaction';
import { createAdminClient } from '@/lib/supabase/admin';
import { logPaymentEvent } from '@/lib/payment-logger';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  // Simple cron token verification if needed
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  console.log('[CRON] Starting payment reconciliation and recovery job...');

  // Fetch all unrecovered payment audit logs that failed during order creation
  const { data: failedAudits, error: fetchErr } = await supabase
    .from('payment_audit')
    .select('*')
    .eq('recovered', 0)
    .eq('step_failed', 'ORDER_CREATION_TRANSACTION');

  if (fetchErr) {
    console.error('[CRON] Error fetching failed audits:', fetchErr);
    return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 });
  }

  if (!failedAudits || failedAudits.length === 0) {
    return NextResponse.json({ success: true, message: 'No pending recoveries found.' });
  }

  let recoveredCount = 0;
  let failedCount = 0;
  const results = [];

  for (const audit of failedAudits) {
    try {
      if (!audit.payload) throw new Error("Missing payload for recovery.");
      
      const orderDetails = JSON.parse(audit.payload);
      const razorpay_payment_id = audit.payment_id;
      
      // Idempotency check before recovery
      const { data: existing } = await supabase.from('orders').select('id').eq('razorpay_payment_id', razorpay_payment_id).single();
      
      if (existing) {
        // Order already exists, mark as recovered
        await supabase.from('payment_audit').update({ recovered: 1, recovery_notes: 'Found existing order. Marked recovered.' }).eq('id', audit.id);
        recoveredCount++;
        continue;
      }

      console.log(`[CRON] Attempting recovery for payment ${razorpay_payment_id}`);

      let orderRecordId = null;
      await withTransaction(async (client) => {
        const orderRes = await client.query(`
          INSERT INTO orders (
            order_number, customer_name, customer_email, customer_phone,
            shipping_address, billing_address, coupon_id, discount_amount,
            shipping_charge, subtotal, total_amount, payment_method,
            payment_status, order_status, razorpay_order_id,
            razorpay_payment_id, captured_at, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          RETURNING id
        `, [
          orderDetails.order_number, orderDetails.customer_name, orderDetails.customer_email, orderDetails.customer_phone,
          orderDetails.shipping_address, orderDetails.billing_address || orderDetails.shipping_address,
          orderDetails.coupon_id || null, orderDetails.discount_amount || 0, orderDetails.shipping_charge || 0,
          orderDetails.subtotal || orderDetails.total_amount, orderDetails.total_amount, 'Razorpay',
          audit.status, 'Processing', null, razorpay_payment_id, new Date().toISOString(), 'Recovered automatically by CRON job'
        ]);

        orderRecordId = orderRes.rows[0].id;

        if (orderDetails.items && Array.isArray(orderDetails.items)) {
          for (const item of orderDetails.items) {
            await client.query(`
              INSERT INTO order_items (order_id, product_id, product_name, price, quantity, total_price)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [orderRecordId, item.product_id, item.product_name, item.price, item.quantity, item.price * item.quantity]);

            await client.query(`UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - $1) WHERE id = $2`, [item.quantity, item.product_id]);
          }
        }

        if (orderDetails.coupon_id) {
          await client.query(`UPDATE coupons SET times_used = COALESCE(times_used, 0) + 1 WHERE id = $1`, [orderDetails.coupon_id]);
        }
      });

      // Mark as recovered
      await supabase.from('payment_audit').update({ recovered: 1, recovery_notes: 'Recovered successfully via transaction.' }).eq('id', audit.id);
      
      // Queue notifications
      const orderRecord = { id: orderRecordId, ...orderDetails, payment_status: audit.status, payment_method: 'Razorpay' };
      await supabase.from('background_jobs').insert([
        { type: 'whatsapp_admin', payload: JSON.stringify({ order: orderRecord, items: orderDetails.items }) },
        { type: 'email_customer', payload: JSON.stringify({ to: orderDetails.customer_email, orderNumber: orderDetails.order_number, amount: orderDetails.total_amount }) }
      ]);

      await logPaymentEvent({ eventType: 'order_recovered', orderNumber: orderDetails.order_number, status: 'success' });
      
      recoveredCount++;
      results.push({ id: audit.id, status: 'recovered' });
    } catch (err) {
      console.error(`[CRON] Recovery failed for audit ${audit.id}:`, err);
      await supabase.from('payment_audit').update({ recovery_notes: `Failed: ${err.message}` }).eq('id', audit.id);
      failedCount++;
      results.push({ id: audit.id, status: 'failed', error: err.message });
    }
  }

  return NextResponse.json({
    success: true,
    processed: failedAudits.length,
    recoveredCount,
    failedCount,
    results
  });
}
