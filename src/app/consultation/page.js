import { constructMetadata } from '@/lib/seo';
import ConsultationClient from '@/components/consultation/ConsultationClient';
import Link from 'next/link';

export const revalidate = 3600;

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in').replace(/\/$/, '');

export const metadata = constructMetadata({
  title: 'Mandir Vastu & Custom Handicraft Consultation | Anant Arts',
  description: 'Book a personalized handicraft consultation with Anant Arts for bespoke pooja room mandir design, custom deity sizing, and corporate gifting solutions.',
  canonical: '/consultation',
  keywords: [
    'handicraft consultation',
    'custom gifting consultation',
    'mandir vastu consultation',
    'pooja room design India',
    'custom idol sizing',
    'corporate gifting consultation'
  ]
});

export default function ConsultationPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Mandir Consultation', item: `${BASE_URL}/consultation` }
    ]
  };

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0', minHeight: '80vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>Vastu &amp; Custom Consultation</span>
        </nav>

        {/* Banner Card */}
        <div style={{
          background: 'var(--luxury-gradient)',
          color: 'white',
          borderRadius: '12px',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--primary-gold-border)',
          marginBottom: '3rem'
        }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '4px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '600' }}>
            Sacred Vastu Design &amp; Shilpa Shastra
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 2.6rem)', color: 'white', marginTop: '10px', marginBottom: '15px' }}>
            Mandir Vastu &amp; Custom Handicraft Consultation
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.96rem', lineHeight: '1.7', maxWidth: '650px', margin: '0 auto' }}>
            Consult directly with our master temple sthapatis and Jaipur lineage sculptors to plan sacred mandir layouts, determine deity proportions, and commission bespoke electroplated idols.
          </p>
        </div>

        {/* Consultation Form Component */}
        <ConsultationClient />

        {/* Advisory Services Breakdown */}
        <section style={{
          marginTop: '4rem',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid var(--primary-gold-border)',
          padding: '36px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', color: 'var(--text-dark)', marginBottom: '16px' }}>
            What Our Consultation Covers
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            <div style={{ background: 'var(--bg-cream)', padding: '20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary-gold-hover)', marginBottom: '8px' }}>
                🧭 Ishanya (Northeast) Alignment
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                Guidance on directional deity placements, sunlight illumination, altar heights, and energy flow for residential and commercial mandirs.
              </p>
            </div>
            <div style={{ background: 'var(--bg-cream)', padding: '20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary-gold-hover)', marginBottom: '8px' }}>
                📐 Sacred Shilpa Proportions
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                Selecting proportional murti sizes (6-inch desktop idols to 5-foot temple centerpieces) based on room square footage.
              </p>
            </div>
            <div style={{ background: 'var(--bg-cream)', padding: '20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary-gold-hover)', marginBottom: '8px' }}>
                ✨ Metallurgical Customization
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
                Custom plating combinations (24K Gold, Sterling Silver, Antique Copper) and wooden pedestal inscriptions.
              </p>
            </div>
          </div>
        </section>

        {/* Commercial Links */}
        <div style={{ marginTop: '3.5rem', textAlign: 'center', padding: '32px', background: 'white', borderRadius: '12px', border: '1px solid var(--primary-gold-border)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: '8px' }}>
            Explore Core Deity Collections
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto 20px auto' }}>
            Discover our complete portfolio of handcrafted 24K gold and pure silver electroplated murtis before your consultation.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/shop" className="btn-primary btn-md">Explore All Idols</Link>
            <Link href="/materials" className="btn-secondary btn-md">Materials Guide</Link>
            <Link href="/faq" className="btn-secondary btn-md">Care &amp; Placement FAQ</Link>
          </div>
        </div>

      </div>
    </div>
  );
}

