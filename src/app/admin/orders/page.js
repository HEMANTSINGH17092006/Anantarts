import OrderManager from '@/components/admin/OrderManager';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const supabase = createAdminClient();

  // Fetch all orders
  const { data: ordersData = [] } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch all order items and map them to their parent orders
  const orders = [];
  for (const order of ordersData) {
    const { data: items = [] } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);
      
    orders.push({
      ...order,
      items
    });
  }

  return (
    <OrderManager initialOrders={orders} />
  );
}
