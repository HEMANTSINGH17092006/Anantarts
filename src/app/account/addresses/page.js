import { getSessionCustomer } from '../../auth/actions';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata = {
  title: 'Saved Addresses - Anant Arts',
};

export default async function AccountAddressesPage() {
  const customer = await getSessionCustomer();
  const supabase = createAdminClient();

  const { data: addresses = [] } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', customer.id)
    .order('is_default', { ascending: false });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', margin: 0, fontSize: '1.5rem', color: '#333' }}>Saved Addresses</h2>
      </div>
      
      {addresses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#F9F9F9', borderRadius: '12px', border: '1px solid #EAEAEA' }}>
          <i className="fas fa-map-marked-alt" style={{ fontSize: '2.5rem', color: '#DDD', marginBottom: '16px' }}></i>
          <h3 style={{ margin: '0 0 8px', color: '#333', fontSize: '1.1rem' }}>No Addresses Saved</h3>
          <p style={{ color: '#777', fontSize: '0.85rem' }}>Your saved addresses will appear here after your first order.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {addresses.map(address => (
            <div key={address.id} style={{ padding: '20px', border: address.is_default ? '2px solid var(--primary-gold)' : '1px solid #EAEAEA', borderRadius: '12px', position: 'relative' }}>
              {address.is_default === 1 && (
                <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--primary-gold)', color: '#FFF', fontSize: '0.65rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>
                  Default
                </span>
              )}
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', color: '#333' }}>{address.name}</h4>
              <p style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#666' }}>{address.phone}</p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', lineHeight: '1.4' }}>
                {address.address}<br />
                {address.city}, {address.state} - {address.pincode}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
