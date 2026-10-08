import { getSettings } from '@/lib/db-helpers';
import Link from 'next/link';
import { constructMetadata } from '@/lib/seo';

export const revalidate = 3600;

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in').replace(/\/$/, '');

export const metadata = constructMetadata({
  title: 'Terms & Conditions | Patron Agreement & Purchase Terms | Anant Arts',
  description: 'Read the official Terms and Conditions of Anant Arts governing sculpture orders, 256-bit encrypted Razorpay payments, insured transit delivery, and jurisdictional clauses.',
  canonical: '/terms-and-conditions',
  keywords: [
    'Anant Arts terms and conditions',
    'patron agreement',
    'ecommerce purchase terms India',
    'handicraft terms of service'
  ]
});

export default async function TermsAndConditionsPage() {
  const settings = await getSettings();

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Terms & Conditions', item: `${BASE_URL}/terms-and-conditions` }
    ]
  };

  return (
    <div style={{ background: 'var(--bg-cream)', minHeight: '80vh', padding: '4rem 1.5rem' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>Terms &amp; Conditions</span>
        </nav>

        {/* Page Header */}
        <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ color: 'var(--primary-gold)', fontSize: '0.85rem', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase' }}>Legal Framework</span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginTop: '8px', color: 'var(--text-dark)' }}>
            Terms &amp; Conditions
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Official Patron Purchase &amp; Service Agreement</p>
          <div style={{ width: '60px', height: '3px', background: 'var(--primary-gold)', margin: '1rem auto 0' }}></div>
        </header>

        {/* Content Card */}
        <article
          style={{
            background: 'white',
            padding: '40px',
            borderRadius: '12px',
            border: '1px solid var(--primary-gold-border)',
            boxShadow: 'var(--shadow-sm)',
            lineHeight: '1.85',
            color: 'var(--text-dark)',
            fontSize: '0.94rem',
          }}
        >
          <p>
            Welcome to <strong>Anant Arts</strong> (<a href="https://anantarts.in" style={{ color: 'var(--primary-gold-hover)' }}>anantarts.in</a>). By browsing our digital catalogue, initiating a transaction, commissioning a sculpture, or booking a consultation, you agree to comply with and be bound by the following operational terms and conditions.
          </p>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--primary-gold-hover)', marginTop: '24px', marginBottom: '10px' }}>
            1. Pricing &amp; Currency
          </h2>
          <p>
            All prices listed on anantarts.in are denominated in Indian Rupees (INR) and are inclusive of Goods and Services Tax (GST) unless explicitly noted for B2B corporate bulk invoicing. We reserve the right to modify catalogue pricing in accordance with fluctuations in raw precious metal (24K Gold, Sterling Silver) and foundry brass costs.
          </p>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--primary-gold-hover)', marginTop: '24px', marginBottom: '10px' }}>
            2. Orders, Confirmation &amp; Payment Processing
          </h2>
          <p>
            Orders are confirmed upon successful authorization of payment through Razorpay (UPI, Credit/Debit Cards, Net Banking) or verified Cash on Delivery order authorization. In the event of a banking gateway network failure where an amount is debited without order generation, the funds are automatically refunded to your originating bank account within 5 to 7 business days.
          </p>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--primary-gold-hover)', marginTop: '24px', marginBottom: '10px' }}>
            3. Order Cancellations &amp; Modifications
          </h2>
          <p>
            Standard catalogue orders may be modified or cancelled within 24 hours of placement prior to packaging seal completion. Once an order is enclosed in its wooden crate and handed to the express courier, transit cancellation is not supported. Customized commissions featuring personalized text inscriptions are non-cancellable once casting or laser etching has commenced.
          </p>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--primary-gold-hover)', marginTop: '24px', marginBottom: '10px' }}>
            4. Insured Delivery &amp; Transit Liability
          </h2>
          <p>
            We deliver all over India in reinforced crates with full transit insurance. Delivery timelines are estimates provided by express logistics networks. In the rare instance of courier transit damage, our liability is fulfilled through our <Link href="/return-policy" style={{ color: 'var(--primary-gold-hover)', textDecoration: 'underline' }}>100% Free Replacement Guarantee</Link> upon receipt of the mandatory unboxing video within 24 hours.
          </p>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--primary-gold-hover)', marginTop: '24px', marginBottom: '10px' }}>
            5. Intellectual Property &amp; Shilpa Shastra Sculptures
          </h2>
          <p>
            All original photography, 3D clay prototype renderings, website layouts, metallurgical formulations, brand names, and editorial descriptions are the intellectual property of Anant Arts. Unauthorized duplication or commercial reproduction is strictly prohibited.
          </p>

          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--primary-gold-hover)', marginTop: '24px', marginBottom: '10px' }}>
            6. Governing Law &amp; Jurisdiction
          </h2>
          <p>
            These Terms &amp; Conditions are governed by and construed in accordance with the laws of India. Any legal proceedings arising out of or in connection with purchases on this website shall be subject to the exclusive jurisdiction of the competent courts in Thane/Mumbai, Maharashtra.
          </p>
        </article>

        {/* Quick Links */}
        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/privacy-policy" className="btn-secondary btn-sm">Privacy Policy &rarr;</Link>
          <Link href="/refund-policy" className="btn-secondary btn-sm">Refund Policy &rarr;</Link>
          <Link href="/shipping-policy" className="btn-secondary btn-sm">Shipping Policy &rarr;</Link>
          <Link href="/shop" className="btn-primary btn-sm">Continue Shopping</Link>
        </div>

      </div>
    </div>
  );
}

