import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    console.warn('[CRON] Reconciliation aborted: Missing Razorpay credentials.');
    return NextResponse.json({ success: false, message: 'Missing credentials' });
  }

  const razorpay = new Razorpay({ key_id, key_secret });
  const supabase = createAdminClient();
  console.log('[CRON] Starting Daily Razorpay Reconciliation...');

  try {
    // Fetch payments captured in the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const fromTimestamp = Math.floor(yesterday.getTime() / 1000);

    const paymentsRes = await razorpay.payments.all({
      from: fromTimestamp,
      count: 100 // Paginating would be better for massive volume, but 100 is fine for now
    });

    const capturedPayments = paymentsRes.items.filter(p => p.status === 'captured');
    let anomalies = 0;

    for (const payment of capturedPayments) {
      const { data: order } = await supabase
        .from('orders')
        .select('id, payment_status')
        .eq('razorpay_payment_id', payment.id)
        .single();

      if (!order) {
        // Anomaly! Money is in Razorpay, but not locally.
        console.error(`[Reconciliation Anomaly] Payment ${payment.id} is captured in Razorpay but missing in DB!`);
        anomalies++;
        
        await supabase.from('notifications').insert({
          message: `🚨 RECONCILIATION ANOMALY: Payment ${payment.id} (₹${payment.amount / 100}) is captured in Razorpay but has no corresponding completed order in our database.`,
          is_read: 0,
          type: 'danger',
          link: '/admin/payment-recovery'
        });
      } else if (order.payment_status !== 'Captured') {
        console.warn(`[Reconciliation Mismatch] Order ${order.id} payment_status is ${order.payment_status}, but Razorpay says captured.`);
      }
    }

    console.log(`[CRON] Reconciliation complete. Anomalies found: ${anomalies}`);
    return NextResponse.json({ success: true, anomalies });

  } catch (err) {
    console.error('[CRON] Reconciliation failed:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
