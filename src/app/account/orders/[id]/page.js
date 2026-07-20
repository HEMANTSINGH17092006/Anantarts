import { getSessionCustomer } from '@/app/auth/actions';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import TrackingTimeline from '@/components/TrackingTimeline';

export const metadata = {
  title: 'Order Tracking Detail - Anant Arts',
};

export default async function CustomerOrderDetailPage({ params }) {
  const customer = await getSessionCustomer();
  if (!customer) {
    redirect('/login?next=/account/orders');
  }

  const { id: orderParam } = await params;
  const cleanId = (orderParam || '').trim();

  const supabase = createAdminClient();

  let query = supabase
    .from('orders')
    .select(`
      id, user_id, order_number, customer_name, customer_email, customer_phone,
      shipping_address, billing_address, coupon_id, discount_amount, shipping_charge,
      subtotal, total_amount, payment_method, payment_status, order_status, notes,
      tracking_number, courier_name, estimated_delivery, created_at,
      order_items (
        id, product_id, product_name, price, quantity, total_price
      )
    `);

  const isNumeric = /^\d+$/.test(cleanId);
  if (isNumeric) {
    query = query.or(`order_number.eq.${cleanId},id.eq.${parseInt(cleanId, 10)}`);
  } else {
    query = query.eq('order_number', cleanId);
  }

  // Filter by user session
  const customerEmail = (customer.email || '').toLowerCase();
  const customerPhone = (customer.phone || '').trim();

  let orClauses = [`user_id.eq.${customer.id}`];
  if (customerEmail) orClauses.push(`customer_email.eq.${customerEmail}`);
  if (customerPhone) orClauses.push(`customer_phone.eq.${customerPhone}`);

  query = query.or(orClauses.join(','));

  const { data: orders = [] } = await query;
  const order = orders.length > 0 ? orders[0] : null;

  if (!order) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '32px', background: 'white', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--primary-gold-border)' }}>
        <i className="fas fa-search" style={{ fontSize: '2.5rem', color: 'var(--primary-gold)', marginBottom: '16px' }}></i>
        <h2 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 8px 0' }}>Order Not Found</h2>
        <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '24px' }}>We could not find an order matching &quot;{cleanId}&quot; in your account history.</p>
        <Link href="/account/orders" className="btn-gold" style={{ display: 'inline-block', padding: '10px 24px', textDecoration: 'none' }}>
          ← Back to My Orders
        </Link>
      </div>
    );
  }

  // Fetch tracking events
  const { data: trackingEvents = [] } = await supabase
    .from('order_tracking_events')
    .select('*')
    .eq('order_id', order.id)
    .order('timestamp', { ascending: true });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <Link href="/account/orders" style={{ fontSize: '0.85rem', color: 'var(--primary-gold)', fontWeight: '600', textDecoration: 'none' }}>
            ← Back to My Orders
          </Link>
          <h2 style={{ fontFamily: 'var(--font-heading)', margin: '8px 0 0 0', fontSize: '1.5rem', color: '#333' }}>
            Order Shipment Detail
          </h2>
        </div>
      </div>

      <TrackingTimeline order={order} trackingEvents={trackingEvents} />
    </div>
  );
}
