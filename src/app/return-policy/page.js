import { getSettings } from '@/lib/db-helpers';
import Link from 'next/link';
import { constructMetadata } from '@/lib/seo';

export const revalidate = 3600;

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in').replace(/\/$/, '');

export const metadata = constructMetadata({
  title: 'Return & Replacement Policy | 100% Transit Safe Guarantee | Anant Arts',
  description: 'Read the official Anant Arts return and replacement policy. Due to sacred craftsmanship and electroplating delicacy, we offer a 100% free immediate replacement guarantee for transit damages.',
  canonical: '/return-policy',
  keywords: [
    'Anant Arts return policy',
    'idol replacement guarantee',
    'transit damage policy',
    'handicraft return policy India',
    'safe unboxing protocol'
  ]
});

export default async function ReturnPolicyPage() {
  const settings = await getSettings();

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Return Policy', item: `${BASE_URL}/return-policy` }
    ]
  };

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0', minHeight: '80vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>Return &amp; Replacement Policy</span>
        </nav>

        {/* Page Header */}
        <header className="section-heading" style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
            Patron Protection Promise
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 2.6rem)', color: 'var(--text-dark)', marginTop: '8px', marginBottom: '12px' }}>
            Return &amp; Replacement Policy
          </h1>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', fontSize: '0.95rem', lineHeight: '1.7' }}>
            We stand with complete devotion behind our craftsmanship. Learn about our sacred return guidelines, transit damage replacement guarantee, and simple unboxing verification.
          </p>
        </header>

        {/* Assurance Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.04))',
          border: '1px solid var(--primary-gold-border)',
          borderRadius: '12px',
          padding: '1.5rem 2rem',
          marginBottom: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem'
        }}>
          <span style={{ fontSize: '2.2rem' }}>🛡️</span>
          <div>
            <strong style={{ color: 'var(--text-dark)', fontSize: '1.05rem', display: 'block', marginBottom: '4px' }}>
              100% Free Replacement on Transit Damages
            </strong>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              If your idol or sculpture sustains damage during courier handling, our studio will craft and dispatch a brand new piece at zero additional cost to you.
            </p>
          </div>
        </div>

        {/* Content Body */}
        <article style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          border: '1px solid var(--primary-gold-border)',
          boxShadow: 'var(--shadow-sm)',
          fontSize: '0.94rem',
          lineHeight: '1.8',
          color: 'var(--text-dark)'
        }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--primary-gold-hover)', marginTop: '0', marginBottom: '12px' }}>
            1. Why Sacred Statues Have Specific Return Guidelines
          </h2>
          <p>
            Each Anant Arts sculpture is a sacred creation involving days of clay modelling, foundry bell metal casting, 24K gold molecular electro-deposition, and optical lacquer baking. Because these items are consecrated and intended for sacred sanctuaries, pooja rooms, and celebratory milestones, they cannot be returned for arbitrary reasons once unsealed.
          </p>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--primary-gold-hover)', marginTop: '28px', marginBottom: '12px' }}>
            2. When Are Replacements Provided?
          </h2>
          <p>
            We provide an immediate, unconditional free replacement or full refund under the following situations:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
            <li><strong>Transit Damage:</strong> Cracks, fractures, dents, or detachment incurred during courier handling.</li>
            <li><strong>Manufacturing Flaw:</strong> Plating defects or incorrect finish significantly deviating from catalogue specifications.</li>
            <li><strong>Incorrect Item Received:</strong> If an incorrect deity posture, size, or material variant was dispatched by error.</li>
          </ul>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--primary-gold-hover)', marginTop: '28px', marginBottom: '12px' }}>
            3. The 3-Step Video Unboxing Protocol
          </h2>
          <p>
            To activate your transit insurance claim and priority replacement dispatch, please follow this straightforward procedure:
          </p>
          <ol style={{ paddingLeft: '20px', marginBottom: '20px' }}>
            <li><strong>Record Before Opening:</strong> Start a continuous, unedited video showing the unopened outer cardboard/wooden crate with the shipping label clearly visible.</li>
            <li><strong>Unbox on Camera:</strong> Open the security seals, remove the foam chambers and velvet box, and gently inspect the sculpture on video.</li>
            <li><strong>Share within 24 Hours:</strong> Send the unedited video along with your Order ID to <a href="mailto:anantarts39@gmail.com" style={{ color: 'var(--primary-gold-hover)', fontWeight: '600' }}>anantarts39@gmail.com</a> or WhatsApp our dispatch desk at <a href="https://wa.me/917275819354" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', fontWeight: '600' }}>+91 72758 19354</a> within 24 hours of delivery.</li>
          </ol>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--primary-gold-hover)', marginTop: '28px', marginBottom: '12px' }}>
            4. Replacement Processing Timeline
          </h2>
          <p>
            Once our quality assurance team verifies the unboxing video (typically within 4 to 6 business hours), a fresh replacement is queued for priority dispatch from our Jaipur workshop. You will receive a new express tracking number within 24–48 hours.
          </p>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--primary-gold-hover)', marginTop: '28px', marginBottom: '12px' }}>
            5. Non-Returnable Scenarios
          </h2>
          <p>
            The following cases are not eligible for return or refund:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
            <li>Claims submitted without a clear, continuous unboxing video or reported after 24 hours of confirmed delivery.</li>
            <li>Customized commissions with personalized patron name engravings or bespoke dimensions requested by the buyer.</li>
            <li>Items that have been subjected to chemical cleaners, abrasive scrubbers, or intentional tampering after delivery.</li>
          </ul>
        </article>

        {/* Navigation Links */}
        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/refund-policy" className="btn-primary btn-sm">Refund Policy &rarr;</Link>
          <Link href="/shipping-policy" className="btn-secondary btn-sm">Shipping Policy &rarr;</Link>
          <Link href="/order-tracking" className="btn-secondary btn-sm">Live Order Tracking &rarr;</Link>
          <Link href="/shop" className="btn-secondary btn-sm">Continue Shopping</Link>
        </div>

      </div>
    </div>
  );
}

