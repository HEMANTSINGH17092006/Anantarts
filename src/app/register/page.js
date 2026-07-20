import { Suspense } from 'react';
import RegisterClient from './RegisterClient';
import { getSessionCustomer } from '../auth/actions';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Create Account - Anant Arts',
  description: 'Create your Anant Arts account to shop premium divine idols, track orders, and save your addresses.',
};

export default async function RegisterPage() {
  const customer = await getSessionCustomer();
  if (customer) {
    redirect('/account');
  }

  return (
    <div style={{ background: '#FAFAFA', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ maxWidth: '440px', width: '100%', background: '#FFF', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ background: '#000', padding: '30px 24px', textAlign: 'center', color: '#D4AF37' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', margin: 0, fontSize: '1.75rem', fontWeight: '600' }}>Anant Arts</h1>
          <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#FFF', letterSpacing: '1px' }}>CREATE YOUR ACCOUNT</p>
        </div>
        <div style={{ padding: '32px 24px' }}>
          <Suspense fallback={<div>Loading...</div>}>
            <RegisterClient />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
