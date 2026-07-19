import { getSessionCustomer } from '../../auth/actions';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

export const metadata = {
  title: 'My Orders - Anant Arts',
};

function formatPrice(price) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(price);
}

export default async function AccountOrdersPage() {
  const customer = await getSessionCustomer();
  const supabase = createAdminClient();

  // Fetch orders based on customer ID or email/phone
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (customer.id) query = query.eq('user_id', customer.id);
  else query = query.or(`customer_email.eq.${customer.email},customer_phone.eq.${customer.phone}`);

  const { data: orders = [] } = await query;

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 24px 0', fontSize: '1.5rem', color: '#333' }}>My Orders</h2>
      
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#F9F9F9', borderRadius: '12px', border: '1px solid #EAEAEA' }}>
          <i className="fas fa-box-open" style={{ fontSize: '3rem', color: '#DDD', marginBottom: '16px' }}></i>
          <h3 style={{ margin: '0 0 8px', color: '#333' }}>No Orders Found</h3>
          <p style={{ color: '#777', fontSize: '0.9rem', marginBottom: '24px' }}>Looks like you haven't placed an order yet.</p>
          <Link href="/shop" style={{ display: 'inline-block', background: 'var(--primary-gold)', color: '#FFF', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map(order => (
            <div key={order.id} style={{ border: '1px solid #EAEAEA', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ background: '#F9F9F9', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #EAEAEA' }}>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: '#777', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order Placed</p>
                  <p style={{ margin: 0, fontWeight: '600', color: '#333' }}>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: '#777', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</p>
                  <p style={{ margin: 0, fontWeight: '600', color: '#333' }}>{formatPrice(order.total_amount)}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.75rem', color: '#777', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order ID</p>
                  <p style={{ margin: 0, fontWeight: '600', color: '#333' }}>{order.order_number}</p>
                </div>
              </div>
              
              <div style={{ padding: '24px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem', 
                    fontWeight: '700', 
                    background: order.order_status === 'Delivered' ? 'rgba(46,125,50,0.1)' : 'rgba(212,175,55,0.1)', 
                    color: order.order_status === 'Delivered' ? '#2E7D32' : 'var(--primary-gold-hover)',
                    textTransform: 'uppercase'
                  }}>
                    {order.order_status}
                  </div>
                  {order.tracking_number && (
                    <span style={{ fontSize: '0.85rem', color: '#666' }}>Tracking: <strong>{order.tracking_number}</strong></span>
                  )}
                </div>
                
                <Link href={`/order-tracking?id=${order.order_number}&phone=${order.customer_phone}`} style={{ fontSize: '0.85rem', color: 'var(--primary-gold)', fontWeight: '600', textDecoration: 'none' }}>
                  View Detailed Tracking <i className="fas fa-arrow-right" style={{ marginLeft: '4px' }}></i>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
