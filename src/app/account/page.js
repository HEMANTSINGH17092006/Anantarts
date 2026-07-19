import { getSessionCustomer } from '../auth/actions';

export const metadata = {
  title: 'My Profile - Anant Arts',
};

export default async function AccountProfilePage() {
  const customer = await getSessionCustomer();

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 24px 0', fontSize: '1.5rem', color: '#333' }}>Profile Settings</h2>
      
      <div style={{ display: 'grid', gap: '20px', maxWidth: '400px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: '#555' }}>Full Name</label>
          <input 
            type="text" 
            defaultValue={customer.name} 
            disabled 
            style={{ width: '100%', padding: '12px', border: '1px solid #EAEAEA', borderRadius: '8px', background: '#F9F9F9', color: '#666' }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: '#555' }}>Phone Number</label>
          <input 
            type="text" 
            defaultValue={customer.phone || 'Not provided'} 
            disabled 
            style={{ width: '100%', padding: '12px', border: '1px solid #EAEAEA', borderRadius: '8px', background: '#F9F9F9', color: '#666' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: '#555' }}>Email Address</label>
          <input 
            type="email" 
            defaultValue={customer.email || 'Not provided'} 
            disabled 
            style={{ width: '100%', padding: '12px', border: '1px solid #EAEAEA', borderRadius: '8px', background: '#F9F9F9', color: '#666' }}
          />
        </div>
      </div>
      
      <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '24px' }}>
        * To update your mobile number or email, please contact customer support.
      </p>
    </div>
  );
}
