import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: !!process.env.DATABASE_URL,
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      RAZORPAY_KEY_ID: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
      RAZORPAY_WEBHOOK_SECRET: !!process.env.RAZORPAY_WEBHOOK_SECRET
    },
    database: {
      connected: false,
      tables: {}
    }
  };

  try {
    const supabase = createAdminClient();
    
    // Check tables
    const tablesToCheck = ['payment_audit', 'inventory_locks', 'background_jobs', 'orders'];
    for (const table of tablesToCheck) {
      const { error } = await supabase.from(table).select('id').limit(1);
      health.database.tables[table] = !error ? 'Exists' : `Error: ${error.message}`;
    }
    health.database.connected = true;

  } catch (err) {
    health.database.connected = false;
    health.database.error = err.message;
  }

  // Identify root causes based on env
  const warnings = [];
  if (!health.environment.RAZORPAY_KEY_SECRET) {
    warnings.push("CRITICAL: RAZORPAY_KEY_SECRET is missing. Payment popup will crash with 'Oops! Something went wrong' because the backend generates a fake client-side order_id.");
  }
  if (!health.environment.RAZORPAY_WEBHOOK_SECRET) {
    warnings.push("WARNING: RAZORPAY_WEBHOOK_SECRET is missing. Webhooks cannot be verified securely.");
  }

  health.warnings = warnings;

  return NextResponse.json(health);
}
