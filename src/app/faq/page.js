import { constructMetadata, generateFaqSchema, FAQ_DATA } from '@/lib/seo';
import FaqClient from '@/components/faq/FaqClient';

export const revalidate = 3600;

export const metadata = constructMetadata({
  title: 'Frequently Asked Questions (FAQ) & Care Guide | Anant Arts',
  description: 'Find answers about 24K gold electroplating longevity, lost-wax casting, cleaning instructions, insured wooden crate packaging, and returns at Anant Arts.',
  canonical: '/faq',
});

export default function FAQPage() {
  const faqSchema = generateFaqSchema(FAQ_DATA);

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0' }}>
      {/* FAQPage JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div style={{ maxWidth: '850px', margin: '0 auto', padding: '0 2rem' }}>
        
        {/* Semantic H1 Section Heading */}
        <div className="section-heading" style={{ marginBottom: '3.5rem' }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
            Patron Assurance &amp; Care
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 2.6rem)', color: 'var(--text-dark)', marginTop: '8px', marginBottom: '12px' }}>
            Frequently Asked Questions
          </h1>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', fontSize: '0.95rem' }}>
            Everything you need to know about our Jaipur craftsmanship, lacquer bake durability, insured crate packaging, and sacred care.
          </p>
        </div>

        <FaqClient />

      </div>
    </div>
  );
}
