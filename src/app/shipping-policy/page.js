import { getSettings } from '@/lib/db-helpers';
import Link from 'next/link';

export const revalidate = 3600;

export default async function ShippingPolicyPage() {
  const settings = await getSettings();
  const text = settings.shipping_policy || 'We offer free insured shipping all over India on orders above ₹10,000. All idols are securely packed in premium multi-layered bubble packaging and wooden crates (where necessary) to prevent damage. Standard delivery takes 3-7 business days.';

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '8px' }}>Shipping & Delivery Policy</h1>
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
