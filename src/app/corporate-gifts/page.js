import { constructMetadata } from '@/lib/seo';
import CorporateGiftsClient from '@/components/corporate/CorporateGiftsClient';
import Link from 'next/link';

export const revalidate = 3600;

export const metadata = constructMetadata({
  title: 'Corporate Gifts India — Premium & Customized Business Gifting | Anant Arts',
  description: 'Explore premium corporate gifts in India by Anant Arts. Custom logo-engraved 24K gold electroplated idols, luxury desk sets, and executive hampers for clients and teams.',
  canonical: '/corporate-gifts',
  keywords: [
    'corporate gifts India',
    'premium corporate gifts',
    'customized corporate gifts',
    'corporate gifts for clients',
    'employee gifts',
    'corporate gifting solutions',
    'luxury corporate gifts'
  ]
});

export default function CorporateGiftsPage() {
  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 2rem' }}>
        
        {/* Semantic H1 Section Heading */}
        <div className="section-heading" style={{ marginBottom: '3.5rem' }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
            B2B &amp; Executive Solutions
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 2.6rem)', color: 'var(--text-dark)', marginTop: '8px', marginBottom: '12px' }}>
            Corporate Gifts India — Premium &amp; Customized Executive Gifting
          </h1>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', fontSize: '0.95rem' }}>
            Leave a permanent impression on clients, partners, and high-performing teams with custom 24K gold electroplated idols and luxury presentation packaging.
          </p>
        </div>

        <CorporateGiftsClient />

        {/* Commercial Links */}
        <div style={{ marginTop: '4rem', textAlign: 'center', padding: '32px', background: 'white', borderRadius: '12px', border: '1px solid var(--primary-gold-border)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: '8px' }}>
            Explore Core Corporate Catalog
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto 20px auto' }}>
            Browse through popular executive murtis, desk plaques, and spiritual gifts suitable for volume customization.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/shop?category=corporate-gifts" className="btn-primary btn-md">View Corporate Items</Link>
            <Link href="/shop?category=idols" className="btn-secondary btn-md">Browse Idol Catalog</Link>
            <Link href="/contact" className="btn-secondary btn-md">Direct Studio Inquiry</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
