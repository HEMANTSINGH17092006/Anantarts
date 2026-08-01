import OrderManager from '@/components/admin/OrderManager';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  let orders = [];
  try {
    const supabase = createAdminClient();

    // Fetch orders with order_items and joined products + product_images in a single query
    const { data: rawOrders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          order_id,
          product_id,
          product_name,
          price,
          quantity,
          total_price,
          products (
            id,
            name,
            slug,
            product_images (
              image_path,
              is_primary
            )
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[AdminOrdersPage] Single Query Error:', error);
    } else {
      orders = (rawOrders || []).map(order => {
        const items = (order.order_items || []).map(item => {
          const productImgs = item.products?.product_images || [];
          const primaryImg = productImgs.find(img => img.is_primary === 1) || productImgs[0];
          return {
            id: item.id,
            order_id: item.order_id,
            product_id: item.product_id,
            product_name: item.product_name,
            price: item.price,
            quantity: item.quantity,
            total_price: item.total_price || (item.price * item.quantity),
            image_path: primaryImg?.image_path || '/images/placeholder.jpg'
          };
        });

        return {
          ...order,
          items
        };
      });
    }
  } catch (err) {
    console.error('[AdminOrdersPage] Exception:', err);
  }

  return <OrderManager initialOrders={orders} />;
}

