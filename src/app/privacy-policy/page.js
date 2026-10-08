import { getSettings } from '@/lib/db-helpers';
import Link from 'next/link';
import { constructMetadata } from '@/lib/seo';

export const revalidate = 3600;

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in').replace(/\/$/, '');

export const metadata = constructMetadata({
  title: 'Privacy Policy | Data Protection & Payment Security | Anant Arts',
  description: 'Read the official Anant Arts privacy policy. We protect your personal data with 256-bit SSL encryption, secure Razorpay payments, and strict confidentiality.',
  canonical: '/privacy-policy',
  keywords: [
    'Anant Arts privacy policy',
    'data protection',
    'payment security',
    'customer privacy India',
    'ecommerce security'
  ]
});

export default async function PrivacyPolicyPage() {
  const settings = await getSettings();

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: `${BASE_URL}/privacy-policy` }
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
          <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>Privacy Policy</span>
        </nav>

        {/* Page Header */}
        <header className="section-heading" style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
            Patron Confidentiality
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 2.6rem)', color: 'var(--text-dark)', marginTop: '8px', marginBottom: '12px' }}>
            Privacy &amp; Data Security Policy
          </h1>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', fontSize: '0.95rem', lineHeight: '1.7' }}>
            At Anant Arts, preserving the confidentiality of our patrons and corporate clients is fundamental. Understand how we secure your data, orders, and payment transactions.
          </p>
        </header>

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
            1. Information We Collect
          </h2>
          <p>
            When you browse our catalogue, purchase a sculpture, request a Vastu consultation, or subscribe to the Anant Arts Privilege Circle, we collect only essential information required to fulfill your orders:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
            <li><strong>Contact Details:</strong> Full name, verified mobile phone number, and email address.</li>
            <li><strong>Shipping Credentials:</strong> Complete delivery address, landmark, state, city, and pincode for insured express courier dispatch.</li>
            <li><strong>Customization Instructions:</strong> Specific patron inscriptions, deity sizing preferences, and Sanskrit shlokas for bespoke commissions.</li>
            <li><strong>Technical Analytics:</strong> Anonymized browsing metrics, device types, and page interactions to enhance platform speed and navigation.</li>
          </ul>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--primary-gold-hover)', marginTop: '28px', marginBottom: '12px' }}>
            2. 256-Bit SSL Encrypted Payment Architecture
          </h2>
          <p>
            Anant Arts does <strong>not</strong> store, access, or log your credit card numbers, debit card PINs, CVV codes, or net banking passwords. All financial transactions are securely processed through our certified payment partner, <strong>Razorpay</strong>, using banking-grade 256-bit SSL encryption and UPI secure rails.
          </p>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--primary-gold-hover)', marginTop: '28px', marginBottom: '12px' }}>
            3. How We Use Your Data
          </h2>
          <p>
            Your information is used strictly for legitimate commercial and customer service operations:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
            <li>Processing, packing, and dispatching your insured orders with express logistics partners.</li>
            <li>Sending automated SMS and WhatsApp tracking milestones, delivery confirmations, and invoice receipts.</li>
            <li>Providing direct master artisan support for custom sizing, Pooja room dimensions, or corporate branding.</li>
            <li>Sending private previews of festive collections and artisan releases if you opted into our newsletter (with 1-click unsubscribe available at any time).</li>
          </ul>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--primary-gold-hover)', marginTop: '28px', marginBottom: '12px' }}>
            4. Third-Party Data Sharing Prohibition
          </h2>
          <p>
            We adhere to a strict zero-spam, zero-monetization data policy. Anant Arts will <strong>never</strong> sell, lease, rent, or trade your personal information to third-party telemarketers, data brokers, or advertising networks. Data is shared exclusively with our audited operational logistics providers (e.g. BlueDart, Delhivery, DTDC) solely to facilitate delivery.
          </p>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--primary-gold-hover)', marginTop: '28px', marginBottom: '12px' }}>
            5. Cookies &amp; Platform Preferences
          </h2>
          <p>
            We use essential session cookies to preserve your cart items, remember your wishlist, and ensure seamless checkout navigation. Anonymized performance telemetry (Google Analytics 4) helps us identify slow page loads and optimize mobile responsiveness.
          </p>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--primary-gold-hover)', marginTop: '28px', marginBottom: '12px' }}>
            6. Patron Data Rights &amp; Grievance Redressal
          </h2>
          <p>
            Under Indian information technology laws and data protection frameworks, you maintain the right to inspect, update, or request the permanent deletion of your customer profile. For any data inquiries or privacy concerns, please contact our Data Governance Officer at:
          </p>
          <p style={{ background: 'var(--bg-cream)', padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
            <strong>Anant Arts Studio &amp; Data Desk</strong><br />
            Email: <a href="mailto:anantarts39@gmail.com" style={{ color: 'var(--primary-gold-hover)', fontWeight: '600' }}>anantarts39@gmail.com</a><br />
            Phone: <a href="tel:+917275819354" style={{ color: 'inherit', fontWeight: '600' }}>+91 72758 19354</a><br />
            Address: Bhoirwadi, Dombivli East, Maharashtra, India
          </p>
        </article>

        {/* Navigation Links */}
        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/terms-and-conditions" className="btn-secondary btn-sm">Terms &amp; Conditions &rarr;</Link>
          <Link href="/shipping-policy" className="btn-secondary btn-sm">Shipping Policy &rarr;</Link>
          <Link href="/refund-policy" className="btn-secondary btn-sm">Refund Policy &rarr;</Link>
          <Link href="/shop" className="btn-primary btn-sm">Continue Shopping</Link>
        </div>

      </div>
    </div>
  );
}

