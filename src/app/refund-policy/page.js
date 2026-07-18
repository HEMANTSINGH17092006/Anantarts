import { getSettings } from '@/lib/db-helpers';

export async function generateMetadata() {
  return {
    title: 'Refund Policy | Anant Arts',
    description: 'Read the Refund Policy of Anant Arts. We process refunds within 7-10 business days for confirmed transit-damaged orders. Contact orders@anantarts.in to initiate a claim.',
    alternates: {
      canonical: 'https://anantarts.in/refund-policy',
    },
    robots: { index: true, follow: true },
  };
}

export default async function RefundPolicyPage() {
  const settings = await getSettings();
  const content = settings.refund_policy || `
<h3>Our Refund Commitment</h3>
<p>At Anant Arts, every idol is crafted with utmost care and packed with multiple layers of protective packaging. We stand behind the quality of our products 100%.</p>

<h3>Eligibility for Refund</h3>
<p>Refunds or replacements are offered <strong>only</strong> in cases of transit damage. If your idol arrives damaged:</p>
<ol>
  <li>Record an unboxing video clearly showing the package and the damage.</li>
  <li>Email the video to <a href="mailto:orders@anantarts.in">orders@anantarts.in</a> within <strong>24 hours</strong> of delivery.</li>
  <li>Include your Order ID in the subject line.</li>
</ol>

<h3>Refund Processing</h3>
<p>Once our team reviews your claim:</p>
<ul>
  <li>For online payments (UPI, cards): Refund processed within <strong>7-10 business days</strong> to the original payment method.</li>
  <li>For COD orders: Refund transferred to your bank account within 10-12 business days.</li>
  <li>Alternatively, we offer a free replacement for the damaged idol.</li>
</ul>

<h3>Non-Refundable Items</h3>
<ul>
  <li>Custom or made-to-order idols (unless transit damaged)</li>
  <li>Products showing signs of use, wear, or external damage not caused in transit</li>
  <li>Claims made after 24 hours of delivery</li>
</ul>

<h3>Contact for Refund Claims</h3>
<p>Email: <a href="mailto:orders@anantarts.in">orders@anantarts.in</a><br/>
Phone: <a href="tel:+917275819354">+91 72758 19354</a> (Mon–Sat, 10AM–6PM)</p>
`;

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '5rem 0', minHeight: '60vh' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 2rem' }}>
        
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ color: 'var(--primary-gold)', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase' }}>Legal</span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginTop: '8px', color: 'var(--text-dark)' }}>
            Refund Policy
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Last updated: July 2025</p>
          <div style={{ width: '60px', height: '3px', background: 'var(--primary-gold)', margin: '1rem auto 0' }}></div>
        </div>

        {/* Highlight Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.05))',
          border: '1px solid var(--primary-gold-border)',
          borderRadius: '8px',
          padding: '1.25rem 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}>
          <i className="fas fa-shield-alt" style={{ color: 'var(--primary-gold)', fontSize: '1.5rem' }}></i>
          <div>
            <strong style={{ color: 'var(--text-dark)' }}>100% Transit Damage Protection</strong>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Contact us within 24 hours of delivery with your unboxing video for a full refund or free replacement.
            </p>
          </div>
        </div>

        {/* Content Card */}
        <div
          style={{
            background: 'white',
            padding: '3rem',
            borderRadius: '12px',
            border: '1px solid var(--primary-gold-border)',
            boxShadow: 'var(--shadow-sm)',
            lineHeight: '1.85',
            color: 'var(--text-dark)',
            fontSize: '0.95rem',
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
}
