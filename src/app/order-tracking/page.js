import { constructMetadata } from '@/lib/seo';
import OrderTrackingClient from '@/components/tracking/OrderTrackingClient';
import Link from 'next/link';

export const metadata = constructMetadata({
  title: 'Track Your Order | Insured Express Delivery | Anant Arts',
  description: 'Track the live transit status of your handcrafted 24K gold and silver electroplated idol from our workshop to your doorstep.',
  canonical: '/order-tracking',
});

export default function OrderTrackingPage() {
  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0', minHeight: '80vh' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Semantic H1 Section Heading */}
        <div className="section-heading" style={{ marginBottom: '2.5rem' }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
            Live Dispatch Portal
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 2.6rem)', color: 'var(--text-dark)', marginTop: '8px', marginBottom: '12px' }}>
            Live Order Tracking
          </h1>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '0.95rem' }}>
            Monitor your divine sculpture through artisan quality inspection, insured wooden crate packaging, and doorstep logistics.
          </p>
        </div>

        <OrderTrackingClient />

        <div style={{ marginTop: '3.5rem', textAlign: 'center', padding: '24px', background: 'white', borderRadius: '12px', border: '1px solid var(--primary-gold-border)' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
            Need assistance with your consignment? Our dispatch desk is available 7 days a week.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/contact" className="btn-secondary btn-sm">Contact Dispatch Support</Link>
            <Link href="/shipping-policy" className="btn-secondary btn-sm">View Shipping Policy</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
