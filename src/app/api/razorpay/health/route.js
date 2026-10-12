import { NextResponse } from 'next/server';
import { validateCredentials } from '@/lib/razorpay';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const creds = validateCredentials();
  let dbStatus = 'healthy';

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('website_settings').select('key').limit(1);
    if (error) dbStatus = 'warning';
  } catch (e) {
    dbStatus = 'warning';
  }

  // Payment Gateway is healthy if both Key ID and Secret are loaded and active
  const isHealthy = creds.valid;

  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'degraded',
    healthy: isHealthy,
    database: dbStatus,
    credentials: {
      has_key_id: creds.has_key_id,
      has_key_secret: creds.has_key_secret,
    },
    timestamp: new Date().toISOString()
  });
}
