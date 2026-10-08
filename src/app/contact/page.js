import { getSettings } from '@/lib/db-helpers';
import { constructMetadata } from '@/lib/seo';
import ContactClient from '@/components/contact/ContactClient';
import Link from 'next/link';

export const revalidate = 3600;

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in').replace(/\/$/, '');

export const metadata = constructMetadata({
  title: 'Contact Anant Arts — Customer Support & Custom Studio Orders',
  description: 'Get in touch with Anant Arts. Contact our master artisan studio for custom deity sculptures, bulk corporate orders, express order tracking, and patron support.',
  canonical: '/contact',
  keywords: [
    'Anant Arts contact',
    'Anant Arts phone number',
    'Anant Arts address',
    'custom idol inquiry India',
    'Jaipur handicraft studio contact'
  ]
});

export default async function ContactPage() {
  const settings = await getSettings();

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Contact Us', item: `${BASE_URL}/contact` }
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
          <span style={{ color: 'var(--text-dark)', fontWeight: '600' }}>Contact Us</span>
        </nav>

        {/* Semantic H1 Section Heading */}
        <header className="section-heading" style={{ marginBottom: '3.5rem', textAlign: 'center' }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
            Direct Patron Assistance
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 2.6rem)', color: 'var(--text-dark)', marginTop: '8px', marginBottom: '12px' }}>
            Contact Anant Arts Support &amp; Custom Orders
          </h1>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', fontSize: '0.95rem', lineHeight: '1.7' }}>
            Reach out for bespoke sizing, custom order tracking, bulk corporate gifting catalogs, or Jaipur master foundry inquiries. We are here to assist you 7 days a week.
          </p>
        </header>

        {/* Client Interactive Contact Form & Studio Details */}
        <ContactClient
          defaultPhone={settings.contact_phone}
          defaultEmail={settings.contact_email}
          defaultAddress={settings.contact_address}
          defaultWhatsapp={settings.whatsapp_number}
        />

        {/* Dedicated Support Channels Card */}
        <section style={{
          marginTop: '4rem',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid var(--primary-gold-border)',
          padding: '36px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', color: 'var(--text-dark)', marginBottom: '20px', textAlign: 'center' }}>
            Specialized Department Desks
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div style={{ background: 'var(--bg-cream)', padding: '20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary-gold-hover)', marginBottom: '8px' }}>
                📦 Dispatch &amp; Tracking Desk
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: '0 0 10px 0' }}>
                For live consignment updates, express delivery queries, or unboxing assistance.
              </p>
              <Link href="/order-tracking" style={{ fontSize: '0.82rem', color: 'var(--primary-gold-hover)', fontWeight: '600', textDecoration: 'underline' }}>
                Live Tracking Portal &rarr;
              </Link>
            </div>
            <div style={{ background: 'var(--bg-cream)', padding: '20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary-gold-hover)', marginBottom: '8px' }}>
                🎨 Bespoke &amp; Temple Murtis
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: '0 0 10px 0' }}>
                Commission custom deity postures, oversized temple sculptures, or Vastu layouts.
              </p>
              <Link href="/consultation" style={{ fontSize: '0.82rem', color: 'var(--primary-gold-hover)', fontWeight: '600', textDecoration: 'underline' }}>
                Book Consultation &rarr;
              </Link>
            </div>
            <div style={{ background: 'var(--bg-cream)', padding: '20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--primary-gold-hover)', marginBottom: '8px' }}>
                💼 Corporate &amp; Bulk Gifting
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: '0 0 10px 0' }}>
                Custom laser brand etching, volume tier quotation, and festive hampers.
              </p>
              <Link href="/corporate-gifts" style={{ fontSize: '0.82rem', color: 'var(--primary-gold-hover)', fontWeight: '600', textDecoration: 'underline' }}>
                Corporate Portal &rarr;
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

