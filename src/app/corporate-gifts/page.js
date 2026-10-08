import { constructMetadata } from '@/lib/seo';
import CorporateGiftsClient from '@/components/corporate/CorporateGiftsClient';
import Link from 'next/link';

export const revalidate = 3600;

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in').replace(/\/$/, '');

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
    'luxury corporate gifts',
    'brass corporate awards',
    'Diwali corporate gifting'
  ]
});

export default function CorporateGiftsPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Corporate Gifts', item: `${BASE_URL}/corporate-gifts` }
    ]
  };

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0', minHeight: '80vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>Corporate Gifting</span>
        </nav>

        {/* Semantic H1 Section Heading */}
        <header className="section-heading" style={{ marginBottom: '3.5rem', textAlign: 'center' }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
            B2B &amp; Executive Solutions
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 2.6rem)', color: 'var(--text-dark)', marginTop: '8px', marginBottom: '12px' }}>
            Corporate Gifts India — Premium &amp; Customized Executive Gifting
          </h1>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', fontSize: '0.95rem', lineHeight: '1.7' }}>
            Leave a permanent impression on clients, leadership teams, and valued partners with custom 24K gold electroplated sculptures, etched brass plaques, and royal velvet presentation packaging.
          </p>
        </header>

        {/* Client Interactive Quotation & Inquiry Form */}
        <CorporateGiftsClient />

        {/* Corporate Solutions Pillars */}
        <section style={{
          marginTop: '4rem',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid var(--primary-gold-border)',
          padding: '36px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--text-dark)', marginBottom: '16px', textAlign: 'center' }}>
            Why Leading Enterprises Partner with Anant Arts
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            <div style={{ background: 'var(--bg-cream)', padding: '20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--primary-gold-hover)', marginBottom: '8px' }}>
                🏷️ Precision Laser Brand Etching
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                Embed company logos, leadership signatures, milestone dates, and recipient names on polished brass or rosewood pedestals.
              </p>
            </div>
            <div style={{ background: 'var(--bg-cream)', padding: '20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--primary-gold-hover)', marginBottom: '8px' }}>
                🎁 Royal Velvet Curation
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                Every corporate gift arrives in a handcrafted gold-embossed presentation box with authentic artisanal certificates and customized greeting cards.
              </p>
            </div>
            <div style={{ background: 'var(--bg-cream)', padding: '20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--primary-gold-hover)', marginBottom: '8px' }}>
                🚚 Multi-Location Direct Dispatch
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                We manage multi-address pan-India courier distributions for corporate offsites, Diwali campaigns, and Annual General Meetings.
              </p>
            </div>
          </div>
        </section>

        {/* Commercial Links */}
        <div style={{ marginTop: '3.5rem', textAlign: 'center', padding: '32px', background: 'white', borderRadius: '12px', border: '1px solid var(--primary-gold-border)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: '8px' }}>
            Explore Corporate Ready Collections
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto 20px auto' }}>
            Browse through popular executive murtis, desk plaques, and spiritual gifts suitable for volume customization.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/category/corporate-gifts" className="btn-primary btn-md">View Corporate Items</Link>
            <Link href="/category/spiritual-collection" className="btn-secondary btn-md">Browse Idol Catalog</Link>
            <Link href="/contact" className="btn-secondary btn-md">Direct Studio Inquiry</Link>
          </div>
        </div>

      </div>
    </div>
  );
}

