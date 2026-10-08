import { constructMetadata } from '@/lib/seo';
import OrderTrackingClient from '@/components/tracking/OrderTrackingClient';
import Link from 'next/link';

export const revalidate = 3600;

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in').replace(/\/$/, '');

export const metadata = constructMetadata({
  title: 'Track Your Order | Insured Express Delivery | Anant Arts',
  description: 'Track the live transit status of your handcrafted 24K gold and silver electroplated idol from our workshop to your doorstep across India.',
  canonical: '/order-tracking',
  keywords: [
    'track order Anant Arts',
    'live shipment tracking',
    'handicraft order status',
    'express delivery tracking India'
  ]
});

export default function OrderTrackingPage() {
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Track Order', item: `${BASE_URL}/order-tracking` }
    ]
  };

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0', minHeight: '80vh' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div style={{ maxWidth: '880px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>Live Order Tracking</span>
        </nav>

        {/* Semantic H1 Section Heading */}
        <header className="section-heading" style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
            Live Dispatch Portal
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 2.6rem)', color: 'var(--text-dark)', marginTop: '8px', marginBottom: '12px' }}>
            Live Order &amp; Consignment Tracking
          </h1>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', fontSize: '0.95rem', lineHeight: '1.7' }}>
            Monitor your divine sculpture through master artisan quality inspection, insured wooden crate packaging, express cargo handover, and doorstep delivery.
          </p>
        </header>

        {/* Client Tracking Form Component */}
        <OrderTrackingClient />

        {/* Order Fulfillment Journey Stages */}
        <section style={{
          marginTop: '4rem',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid var(--primary-gold-border)',
          padding: '36px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', color: 'var(--text-dark)', marginBottom: '20px', textAlign: 'center' }}>
            The 4 Stages of Your Anant Arts Consignment
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', textAlign: 'center' }}>
            <div style={{ padding: '16px', background: 'var(--bg-cream)', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '8px' }}>🔍</span>
              <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--primary-gold-hover)', margin: '0 0 6px 0' }}>1. Quality Assurance</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>Inspection of 24K gold plating luster, facial chisel clarity, and base stability.</p>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-cream)', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '8px' }}>🎁</span>
              <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--primary-gold-hover)', margin: '0 0 6px 0' }}>2. Velvet Box Enclosure</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>Placed in acid-free silk wrap and cushioned royal red/saffron velvet presentation box.</p>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-cream)', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '8px' }}>📦</span>
              <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--primary-gold-hover)', margin: '0 0 6px 0' }}>3. Wooden Crate Armor</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>Reinforced with high-density EPE foam chambers and banded outer wooden frame.</p>
            </div>
            <div style={{ padding: '16px', background: 'var(--bg-cream)', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '8px' }}>✈️</span>
              <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--primary-gold-hover)', margin: '0 0 6px 0' }}>4. Insured Express Transit</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.5' }}>Handed to BlueDart / Delhivery Air with live GPS tracking and delivery OTP.</p>
            </div>
          </div>
        </section>

        {/* Support Card */}
        <div style={{ marginTop: '2.5rem', textAlign: 'center', padding: '28px', background: 'white', borderRadius: '12px', border: '1px solid var(--primary-gold-border)' }}>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-dark)', margin: '0 0 16px 0', fontWeight: '500' }}>
            Need direct assistance with your shipment? Our dedicated dispatch desk is available Monday through Saturday.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contact" className="btn-primary btn-sm">Contact Dispatch Support</Link>
            <Link href="/shipping-policy" className="btn-secondary btn-sm">View Shipping Policy</Link>
            <Link href="/return-policy" className="btn-secondary btn-sm">Return Policy &rarr;</Link>
          </div>
        </div>

      </div>
    </div>
  );
}

