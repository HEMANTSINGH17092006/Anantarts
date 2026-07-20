import CustomerManager from '@/components/admin/CustomerManager';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  try {
    const supabase = createAdminClient();
    const res = await supabase
      .from('orders')
      .select('customer_name, customer_email, customer_phone, total_amount, created_at')
      .order('created_at', { ascending: false });
    const orders = Array.isArray(res?.data) ? res.data : [];
    return <CustomerManager orders={orders} />;
  } catch (err) {
    console.error('[AdminCustomersPage] Error:', err);
    return <CustomerManager orders={[]} />;
  }
}
