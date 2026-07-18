import CouponManager from '@/components/admin/CouponManager';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminCouponsPage() {
  const supabase = createAdminClient();

  const { data: coupons = [] } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: flashSales = [] } = await supabase
    .from('flash_sales')
    .select('*')
    .order('id', { ascending: false });

  const { data: subscribers = [] } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false });

  return (
    <CouponManager coupons={coupons} flashSales={flashSales} subscribers={subscribers} />
  );
}
