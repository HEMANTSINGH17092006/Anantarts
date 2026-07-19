import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createAdminClient();

  try {
    const { data: audits } = await supabase.from('payment_audit').select('*').order('created_at', { ascending: false }).limit(20);
    const { data: jobs } = await supabase.from('background_jobs').select('*').order('created_at', { ascending: false }).limit(20);
    const { data: locks } = await supabase.from('inventory_locks').select('*').order('created_at', { ascending: false });

    return NextResponse.json({ audits, jobs, locks });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
