import { getSettings } from '@/lib/db-helpers';
import Link from 'next/link';
import { constructMetadata } from '@/lib/seo';

export const revalidate = 3600;

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in').replace(/\/$/, '');

export const metadata = constructMetadata({
  title: 'Shipping & Delivery Policy | Insured Pan-India Transit | Anant Arts',
  description: 'Read the comprehensive Anant Arts shipping policy. All 24K gold and silver electroplated sculptures are shipped with 100% transit insurance in custom reinforced wooden crates across 25,000+ Indian pincodes.',
  canonical: '/shipping-policy',
  keywords: [
    'Anant Arts shipping policy',
    'handicraft delivery India',
    'insured idol shipping',
    'express temple delivery',
    'pan India handicraft shipping'
  ]
});

export default async function ShippingPolicyPage() {
  const settings = await getSettings();

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Shipping Policy', item: `${BASE_URL}/shipping-policy` }
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
          <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>Shipping Policy</span>
        </nav>

        {/* Page Header */}
        <header className="section-heading" style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
            Safe Transit Assurance
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 2.6rem)', color: 'var(--text-dark)', marginTop: '8px', marginBottom: '12px' }}>
            Shipping &amp; Delivery Policy
          </h1>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', fontSize: '0.95rem', lineHeight: '1.7' }}>
            Every Anant Arts creation is treated as a sacred heirloom. Discover our insured express dispatch standards, multi-layer crate packaging, and pan-India delivery timelines.
          </p>
        </header>

        {/* Highlight Banner */}
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
          <span style={{ fontSize: '2.2rem' }}>📦</span>
          <div>
            <strong style={{ color: 'var(--text-dark)', fontSize: '1.05rem', display: 'block', marginBottom: '4px' }}>
              100% Insured Pan-India Express Dispatch
            </strong>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              We partner with India&apos;s premier express logistics networks (BlueDart, Delhivery Air, DTDC Express) to deliver across 25,000+ pincodes with zero transit damage risk.
            </p>
          </div>
        </div>

        {/* Main Content Body */}
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
            1. Delivery Coverage &amp; Pincodes
          </h2>
          <p>
            Anant Arts delivers across all states and Union Territories in India, covering more than 25,000 active pincodes. Whether delivering to metropolitan centers (Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Kolkata, Pune) or tier-2 and tier-3 towns, your shipment travels under dedicated surface or air cargo routes.
          </p>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--primary-gold-hover)', marginTop: '28px', marginBottom: '12px' }}>
            2. 4-Layer Master Artisan Packaging Protocol
          </h2>
          <p>
            Given the delicate electroplated gold detailing and significant weight of our cast sculptures, each order undergoes our strict 4-stage packaging protocol:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
            <li><strong>Layer 1 — Acid-Free Silk Wrap:</strong> Direct contact wrap protecting mirror-finish 24K gold and silver electroplated coatings from atmospheric friction.</li>
            <li><strong>Layer 2 — Handcrafted Royal Velvet Box:</strong> Saffron or crimson cushioned presentation box preserving fine facial chisel work.</li>
            <li><strong>Layer 3 — High-Density EPE Foam Moulding:</strong> Custom CNC cut dense foam casing absorbing sudden drops, vibrations, and shockwaves.</li>
            <li><strong>Layer 4 — Reinforced Heavy Corrugated / Wooden Crate:</strong> 7-ply export-grade outer carton or wooden frame banded with tamper-evident security seals.</li>
          </ul>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--primary-gold-hover)', marginTop: '28px', marginBottom: '12px' }}>
            3. Order Processing &amp; Dispatch Timelines
          </h2>
          <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-cream)', borderBottom: '2px solid var(--primary-gold-border)' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Product Category</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Processing Time</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Estimated Delivery</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--bg-cream-dark)' }}>
                  <td style={{ padding: '12px' }}>In-Stock Ready Sculptures</td>
                  <td style={{ padding: '12px' }}>24 - 48 hours</td>
                  <td style={{ padding: '12px' }}>3 - 6 business days</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--bg-cream-dark)' }}>
                  <td style={{ padding: '12px' }}>Custom Engraved / Bespoke Orders</td>
                  <td style={{ padding: '12px' }}>3 - 5 business days</td>
                  <td style={{ padding: '12px' }}>5 - 8 business days</td>
                </tr>
                <tr>
                  <td style={{ padding: '12px' }}>Large Temple Murtis (2+ feet)</td>
                  <td style={{ padding: '12px' }}>7 - 12 business days</td>
                  <td style={{ padding: '12px' }}>Special freight (7-14 days)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--primary-gold-hover)', marginTop: '28px', marginBottom: '12px' }}>
            4. Real-Time Tracking &amp; Notifications
          </h2>
          <p>
            The moment your consignment is handed to our express courier partner, you will receive an automated tracking link via SMS, Email, and WhatsApp. You can also monitor real-time transit milestones on our <Link href="/order-tracking" style={{ color: 'var(--primary-gold-hover)', textDecoration: 'underline' }}>Live Order Tracking</Link> portal using your Order ID and contact number.
          </p>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--primary-gold-hover)', marginTop: '28px', marginBottom: '12px' }}>
            5. Cash on Delivery (COD) Guidelines
          </h2>
          <p>
            Cash on Delivery is available across most serviceable pin codes for orders up to ₹50,000. For high-value custom temple sculptures and bespoke commissions exceeding ₹50,000, we require a partial advance deposit to initiate Jaipur foundry casting.
          </p>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--primary-gold-hover)', marginTop: '28px', marginBottom: '12px' }}>
            6. Transit Damage &amp; Free Replacement Protocol
          </h2>
          <p>
            Every single shipment is 100% insured against loss, theft, and accidental handling damage. In the extremely rare event that your package arrives in a damaged condition, we provide an immediate, free replacement. Please ensure you record a continuous, unedited unboxing video upon receiving the package and notify us within 24 hours.
          </p>
        </article>

        {/* Quick Navigation Links */}
        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/order-tracking" className="btn-primary btn-sm">Live Order Tracking &rarr;</Link>
          <Link href="/return-policy" className="btn-secondary btn-sm">Return &amp; Replacement Policy &rarr;</Link>
          <Link href="/faq" className="btn-secondary btn-sm">FAQ Helpdesk &rarr;</Link>
          <Link href="/shop" className="btn-secondary btn-sm">Continue Shopping</Link>
        </div>

      </div>
    </div>
  );
}

