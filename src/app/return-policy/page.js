import { getSettings } from '@/lib/db-helpers';
import Link from 'next/link';

export const revalidate = 3600;

export default async function ReturnPolicyPage() {
  const settings = await getSettings();
  const text = settings.return_policy || 'Because each idol is custom electroplated and highly delicate, we accept returns only in case of transit damages. Please record an unboxing video upon receiving the package. If any damage is noticed, notify us within 24 hours with the video for a free replacement.';

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '8px' }}>Return & Replacement Policy</h1>
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
