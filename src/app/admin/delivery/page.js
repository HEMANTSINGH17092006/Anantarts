import DeliveryManager from '@/components/admin/DeliveryManager';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminDeliveryPage() {
  try {
    const supabase = createAdminClient();

    const [ordersRes, itemsRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('order_items').select('*')
    ]);

    const rawOrders = Array.isArray(ordersRes?.data) ? ordersRes.data : [];
    const rawItems = Array.isArray(itemsRes?.data) ? itemsRes.data : [];

    const itemsMap = {};
    rawItems.forEach(item => {
      if (item && item.order_id) {
        if (!itemsMap[item.order_id]) itemsMap[item.order_id] = [];
        itemsMap[item.order_id].push(item);
      }
    });

    const orders = rawOrders.map(order => ({
      ...order,
      items: itemsMap[order.id] || []
    }));

    return <DeliveryManager initialOrders={orders} />;
  } catch (err) {
    console.error('[AdminDeliveryPage] Error:', err);
    return <DeliveryManager initialOrders={[]} />;
  }
}
