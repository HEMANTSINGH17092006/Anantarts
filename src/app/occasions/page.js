import Link from 'next/link';
import { constructMetadata } from '@/lib/seo';

export const revalidate = 3600;

export const metadata = constructMetadata({
  title: 'Premium Gifts India — Diwali, Wedding & Housewarming Gifting | Anant Arts',
  description: 'Discover premium gifts in India by Anant Arts. Thoughtfully handcrafted Diwali gifts, wedding gifts, housewarming presents, and personalized festive keepsakes.',
  canonical: '/occasions',
  keywords: [
    'premium gifts India',
    'Diwali gifts',
    'wedding gifts India',
    'anniversary gifts',
    'housewarming gifts',
    'festive gifts India',
    'personalized gifts'
  ]
});

export default function OccasionsPage() {
  const OCCASIONS_LIST = [
    { name: 'Housewarming', icon: '🏡', badge: 'Griha Pravesh', desc: 'Auspicious electroplated Lord Ganesha and Goddess Lakshmi idols, brass bells, and Vastu decor for new beginnings.' },
    { name: 'Wedding', icon: '💍', badge: 'Heirloom Keepsakes', desc: 'Luxury dual-tone Radha Krishna statues, gold-plated puja thalis, and bespoke wedding keepsake hampers.' },
    { name: 'Anniversary', icon: '❤️', badge: 'Timeless Grace', desc: 'Elegant tabletop couple sculptures, divine paired figurines, and custom personalized wooden plaques.' },
    { name: 'Birthday', icon: '🎂', badge: 'Thoughtful Art', desc: 'Handcrafted desk idols, carved wooden jewelry organizers, and spiritual blessing tokens.' },
    { name: 'Corporate Events', icon: '💼', badge: 'Executive Awards', desc: 'Custom logo engraved trophies, premium brass desk plaques, and volume tier corporate gift hampers.' },
    { name: 'Diwali', icon: '🪔', badge: 'Festive Lights', desc: 'Radiant 24K gold Laxmi Ganesh idols, decorative brass diyas, and authentic festive celebration boxes.' },
    { name: 'Ganesh Chaturthi', icon: '🐘', badge: 'Divine Blessings', desc: 'Intricately chiselled Lord Ganesha idols in gold, silver, and antique copper finishes for home mandirs.' },
    { name: 'Christmas', icon: '🎄', badge: 'Holiday Season', desc: 'Artisanal tabletop decor, wooden handicraft showpieces, and luxury gift presentation boxes.' },
    { name: 'New Year', icon: '🎆', badge: 'Prosperity Symbols', desc: 'Auspicious desktop symbols, prosperity idols, and milestone commemorative art pieces.' },
    { name: 'Employee Appreciation', icon: '🌟', badge: 'Recognition Tokens', desc: 'Bespoke recognition awards, custom metal tokens, and executive appreciation hampers.' }
  ];

  return (
    <div style={{ background: 'var(--bg-cream)', minHeight: '80vh', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Page Header */}
        <div className="section-heading" style={{ marginBottom: '3.5rem' }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
            Celebrations &amp; Milestones
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 2.6rem)', color: 'var(--text-dark)', marginTop: '8px', marginBottom: '12px' }}>
            Premium Gifts India for Auspicious Occasions
          </h1>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto', fontSize: '0.95rem' }}>
            Handcrafted gifting collections thoughtfully curated for auspicious life transitions, sacred celebrations, and corporate recognition.
          </p>
        </div>

        {/* Occasions Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.75rem'
        }}>
          {OCCASIONS_LIST.map((occ, idx) => (
            <Link
              key={idx}
              href={`/shop?occasion=${encodeURIComponent(occ.name)}`}
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '28px 24px',
                border: '1px solid var(--primary-gold-border)',
                boxShadow: 'var(--shadow-sm)',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              className="featured-collection-card"
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '2.5rem' }}>{occ.icon}</span>
                  <span style={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: 'var(--primary-gold)',
                    background: 'var(--primary-gold-light)',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontWeight: '600'
                  }}>
                    {occ.badge}
                  </span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--text-dark)', margin: '0 0 8px 0', fontWeight: '600' }}>
                  {occ.name} Gifts
                </h2>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: '1.6' }}>
                  {occ.desc}
                </p>
              </div>

              <span className="btn-secondary btn-sm" style={{ textAlign: 'center', width: '100%' }}>
                Browse {occ.name} Gifts &rarr;
              </span>
            </Link>
          ))}
        </div>

        {/* Gifting Etiquette & Vastu Guidance */}
        <div style={{ marginTop: '4.5rem', background: 'white', padding: '40px', borderRadius: '12px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', marginBottom: '12px', color: 'var(--text-dark)' }}>
            The Spiritual Significance of Sacred Gifting
          </h2>
          <p style={{ fontSize: '0.92rem', lineHeight: '1.8', color: 'var(--text-dark)', marginBottom: '20px' }}>
            In Indian tradition, gifting a deity sculpture or sacred handicraft represents imparting divine energy, prosperity, and peace to the recipient. A 24K gold electroplated Lord Ganesha idol gifted during a Griha Pravesh clears energetic obstacles, while a Radha Krishna sculpture presented at a wedding blesses the union with eternal affection and harmony.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '24px' }}>
            <div style={{ padding: '20px', background: 'var(--bg-cream)', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: 'var(--primary-gold-hover)' }}>🎁 Heirloom Velvet Boxes</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>Every gifting piece arrives enclosed in a handcrafted royal red/saffron velvet presentation box with authenticity certificate.</p>
            </div>
            <div style={{ padding: '20px', background: 'var(--bg-cream)', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: 'var(--primary-gold-hover)' }}>💼 Custom Corporate Branding</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>Optionally customize base pedestals with company logos, recipient names, or congratulatory Sanskrit shlokas.</p>
            </div>
            <div style={{ padding: '20px', background: 'var(--bg-cream)', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: 'var(--primary-gold-hover)' }}>📦 Zero-Risk Transit</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>All gift parcels are insured and delivered directly to the recipient's doorstep with optional personalized greeting cards.</p>
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/shop" className="btn-primary btn-md">Explore All Gifting Items</Link>
            <Link href="/corporate-gifts" className="btn-secondary btn-md">Corporate &amp; Bulk Orders</Link>
            <Link href="/materials" className="btn-secondary btn-md">Materials Guide</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
