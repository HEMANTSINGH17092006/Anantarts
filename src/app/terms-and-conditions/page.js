import { getSettings } from '@/lib/db-helpers';

export async function generateMetadata() {
  return {
    title: 'Terms & Conditions | Anant Arts',
    description: 'Read the Terms and Conditions of Anant Arts. By placing an order on anantarts.in, you agree to these terms covering payment, delivery, cancellations, and more.',
    alternates: {
      canonical: 'https://anantarts.in/terms-and-conditions',
    },
    robots: { index: true, follow: true },
  };
}

export default async function TermsAndConditionsPage() {
  const settings = await getSettings();
  const content = settings.terms_conditions || `
By accessing and placing orders on anantarts.in, you accept and agree to be bound by the terms and conditions outlined below.

<h3>1. General</h3>
<p>All prices listed on anantarts.in are in Indian Rupees (INR) and include applicable taxes. We reserve the right to change prices without prior notice. Product availability is subject to change without notice.</p>

<h3>2. Orders & Payment</h3>
<p>Orders are confirmed only after successful payment. We accept payments via Razorpay (UPI, Credit/Debit Cards, Net Banking). In case of payment failure, no amount will be deducted from your account. If a deduction occurs, it will be refunded within 5-7 business days.</p>

<h3>3. Cancellations</h3>
<p>Orders can be cancelled within 24 hours of placement. Once dispatched, orders cannot be cancelled. Custom orders are non-cancellable and non-refundable unless damaged in transit.</p>

<h3>4. Delivery</h3>
<p>We deliver all over India. Delivery timelines are estimates and may vary due to courier partner delays or unforeseen circumstances. We are not responsible for delays caused by courier companies or natural events.</p>

<h3>5. Limitation of Liability</h3>
<p>Anant Arts is not liable for any indirect, incidental, or consequential damages arising from the use of our products or services beyond the purchase price paid.</p>

<h3>6. Governing Law</h3>
<p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Thane, Maharashtra.</p>

<h3>7. Contact</h3>
<p>For any queries related to these terms, contact us at <a href="mailto:support@anantarts.in">support@anantarts.in</a>.</p>
`;

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '5rem 0', minHeight: '60vh' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 2rem' }}>
        
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ color: 'var(--primary-gold)', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase' }}>Legal</span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginTop: '8px', color: 'var(--text-dark)' }}>
            Terms & Conditions
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Last updated: July 2025</p>
          <div style={{ width: '60px', height: '3px', background: 'var(--primary-gold)', margin: '1rem auto 0' }}></div>
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
