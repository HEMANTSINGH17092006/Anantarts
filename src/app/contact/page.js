import { getSettings } from '@/lib/db-helpers';
import { constructMetadata } from '@/lib/seo';
import ContactClient from '@/components/contact/ContactClient';

export const revalidate = 3600;

export const metadata = constructMetadata({
  title: 'Contact Anant Arts — Customer Support & Custom Orders',
  description: 'Get in touch with Anant Arts, India. Contact our master artisan studio for custom deity sculptures, bulk corporate orders, and client support.',
  canonical: '/contact',
  keywords: [
    'Anant Arts contact',
    'Anant Arts India',
    'handicraft store India'
  ]
});

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 2rem' }}>
        
        {/* Semantic H1 Section Heading */}
        <div className="section-heading" style={{ marginBottom: '3.5rem' }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
            Direct Patron Assistance
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 2.6rem)', color: 'var(--text-dark)', marginTop: '8px', marginBottom: '12px' }}>
            Contact Anant Arts Support &amp; Custom Orders
          </h1>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', fontSize: '0.95rem' }}>
            Reach out for bespoke sizing, custom order tracking, bulk corporate gifting catalogs, or Jaipur studio inquiries.
          </p>
        </div>

        <ContactClient
          defaultPhone={settings.contact_phone}
          defaultEmail={settings.contact_email}
          defaultAddress={settings.contact_address}
          defaultWhatsapp={settings.whatsapp_number}
        />

      </div>
    </div>
  );
}
