import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendAdminOrderNotification } from '@/lib/whatsapp';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(price);
}

export async function GET(req) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  console.log('[CRON] Processing background jobs queue...');

  // Fetch up to 20 pending jobs, or jobs that failed but have < 3 attempts
  const { data: jobs, error } = await supabase
    .from('background_jobs')
    .select('*')
    .in('status', ['pending', 'failed'])
    .lt('attempts', 3)
    .order('created_at', { ascending: true })
    .limit(20);

  if (error || !jobs || jobs.length === 0) {
    return NextResponse.json({ success: true, message: 'No pending jobs.' });
  }

  let processedCount = 0;

  for (const job of jobs) {
    let success = false;
    let errMsg = null;
    
    try {
      const payload = JSON.parse(job.payload);

      if (job.type === 'whatsapp_admin') {
        const { data: settingsData } = await supabase.from('website_settings').select('*');
        const settings = {};
        if (settingsData) settingsData.forEach(r => { settings[r.key] = r.value; });
        await sendAdminOrderNotification(payload.order, payload.items, settings);
        success = true;
      } 
      else if (job.type === 'email_customer') {
        await sendEmail({
          to: payload.to,
          subject: `Order Confirmation #${payload.orderNumber} - Anant Arts`,
          html: `<div style="padding:24px; border:1px solid #D4AF37;"><h2>Anant Arts</h2><p>Payment captured. Order Ref: ${payload.orderNumber}</p></div>`,
          text: `Payment captured. Order Ref: ${payload.orderNumber}`
        });
        success = true;
      }
    } catch (err) {
      errMsg = err.message;
      console.error(`[CRON] Job ${job.id} failed:`, errMsg);
    }

    if (success) {
      await supabase.from('background_jobs').update({
        status: 'completed',
        attempts: job.attempts + 1,
        updated_at: new Date().toISOString()
      }).eq('id', job.id);
    } else {
      await supabase.from('background_jobs').update({
        status: 'failed',
        error_message: errMsg,
        attempts: job.attempts + 1,
        updated_at: new Date().toISOString()
      }).eq('id', job.id);
    }
    processedCount++;
  }

  return NextResponse.json({ success: true, processed: processedCount });
}
