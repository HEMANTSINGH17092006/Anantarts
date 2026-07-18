import CustomerManager from '@/components/admin/CustomerManager';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  const supabase = createAdminClient();

  // Fetch orders data to build dynamic customer profiles
  const { data: orders = [] } = await supabase
    .from('orders')
    .select('customer_name, customer_email, customer_phone, total_amount, created_at')
    .order('created_at', { ascending: false });

  return (
    <CustomerManager orders={orders} />
  );
}
