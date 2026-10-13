import { Suspense } from 'react';
import LoginClient from './LoginClient';
import { getSessionCustomer } from '../auth/actions';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Login',
  description: 'Login to your Anant Arts account to view orders, saved addresses, and shop premium divine idols.',
};

export default async function LoginPage() {
  const customer = await getSessionCustomer();
  if (customer) {
    redirect('/account');
  }

  return (
    <div style={{ background: '#FAFAFA', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: '400px', width: '100%', background: '#FFF', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ background: '#000', padding: '30px 24px', textAlign: 'center', color: '#D4AF37' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', margin: 0, fontSize: '1.75rem', fontWeight: '600' }}>Anant Arts</h1>
          <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#FFF', letterSpacing: '1px' }}>LOGIN TO YOUR ACCOUNT</p>
        </div>
        <div style={{ padding: '32px 24px' }}>
          <Suspense fallback={<div>Loading...</div>}>
            <LoginClient />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
