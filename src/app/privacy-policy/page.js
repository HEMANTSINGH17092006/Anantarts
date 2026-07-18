import { getSettings } from '@/lib/db-helpers';
import Link from 'next/link';

export const revalidate = 3600;

export default async function PrivacyPolicyPage() {
  const settings = await getSettings();
  const text = settings.privacy_policy || 'Anant Arts values your privacy. We store customer emails, shipping details, and purchase records securely. We do not share customer information with third parties. Online payments are securely processed through Razorpay Sandbox and UPI networks.';

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '8px' }}>Privacy Policy</h1>
        <div className="gold-line" style={{ margin: '8px 0 24px 0' }}></div>
        
        <div style={{ background: 'white', padding: '32px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', fontSize: '0.9rem', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
          {text}
        </div>
        
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link href="/shop" className="btn-gold">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
