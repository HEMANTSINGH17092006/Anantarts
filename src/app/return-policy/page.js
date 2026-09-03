import { getSettings } from '@/lib/db-helpers';
import Link from 'next/link';
import { constructMetadata } from '@/lib/seo';

export const revalidate = 3600;

export const metadata = constructMetadata({
  title: 'Return & Replacement Policy | 100% Transit Safe Guarantee | Anant Arts',
  description: 'Anant Arts return and replacement policy. In the rare event of transit damages, we provide hassle-free immediate replacement under full insurance coverage.',
  canonical: '/return-policy',
});

export default async function ReturnPolicyPage() {
  const settings = await getSettings();
  const text = settings.return_policy || 'Because each sculpture is custom electroplated and highly delicate, we accept returns and provide immediate free replacements in the rare case of transit damages. Please record a continuous, unedited unboxing video upon receiving the package. If any damage is noticed, notify us within 24 hours with the video for priority replacement.';

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', marginBottom: '8px' }}>Return &amp; Replacement Policy</h1>
        <div className="gold-line" style={{ margin: '8px 0 24px 0' }}></div>
        
        <div style={{ background: 'white', padding: '32px', borderRadius: '12px', border: '1px solid var(--primary-gold-border)', fontSize: '0.92rem', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
          {text}
        </div>
        
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link href="/shop" className="btn-primary btn-md">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
