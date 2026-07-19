import Link from 'next/link';
import { getSessionCustomer, customerLogout } from '../auth/actions';
import { redirect } from 'next/navigation';

export default async function AccountLayout({ children }) {
  const customer = await getSessionCustomer();
  
  if (!customer) {
    redirect('/login');
  }

  return (
    <div style={{ background: '#FAFAFA', minHeight: '80vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
        
        {/* Sidebar */}
        <aside style={{ flex: '1 1 250px', background: '#FFF', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', alignSelf: 'start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #EEE' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--primary-gold)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>
              {customer.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Hello,</p>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: '#333' }}>{customer.name || 'Customer'}</h3>
            </div>
          </div>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link href="/account" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', color: '#444', textDecoration: 'none', fontWeight: '500', transition: 'background 0.2s' }}>
              <i className="fas fa-user" style={{ width: '20px', color: 'var(--primary-gold)' }}></i> Profile Settings
            </Link>
            <Link href="/account/orders" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', color: '#444', textDecoration: 'none', fontWeight: '500', transition: 'background 0.2s' }}>
              <i className="fas fa-box" style={{ width: '20px', color: 'var(--primary-gold)' }}></i> My Orders
            </Link>
            <Link href="/account/addresses" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', color: '#444', textDecoration: 'none', fontWeight: '500', transition: 'background 0.2s' }}>
              <i className="fas fa-map-marker-alt" style={{ width: '20px', color: 'var(--primary-gold)' }}></i> Saved Addresses
            </Link>
            
            <form action={async () => {
              'use server';
              await customerLogout();
              redirect('/');
            }} style={{ marginTop: '20px' }}>
              <button type="submit" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', color: '#D32F2F', background: 'transparent', border: '1px solid #FFCDD2', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }}>
                <i className="fas fa-sign-out-alt" style={{ width: '20px' }}></i> Logout
              </button>
            </form>
          </nav>
        </aside>
        
        {/* Main Content */}
        <main style={{ flex: '3 1 600px', background: '#FFF', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
