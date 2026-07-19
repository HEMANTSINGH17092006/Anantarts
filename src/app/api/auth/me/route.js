import { NextResponse } from 'next/server';
import { getSessionCustomer } from '../../../auth/actions';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const customer = await getSessionCustomer();
    if (!customer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: user } = await supabase.from('users').select('*').eq('id', customer.id).single();
    const { data: addresses } = await supabase.from('user_addresses').select('*').eq('user_id', customer.id).order('is_default', { ascending: false });

    return NextResponse.json({ user, addresses });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
