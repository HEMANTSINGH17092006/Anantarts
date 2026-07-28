import Link from 'next/link';

export const metadata = {
  title: 'Shop by Occasion | Anant Arts Luxury Gifting',
  description: 'Find handcrafted luxury gifts curated specifically for housewarming, weddings, anniversaries, corporate events, Diwali, and special milestones.',
};

export default function OccasionsPage() {
  const OCCASIONS_LIST = [
    { name: 'Housewarming', icon: '🏡', badge: 'New Home Blessing', desc: 'Auspicious electroplated Ganesha, Lakshmi idols, brass bells, and Vastu sacred decor.' },
    { name: 'Wedding', icon: '💍', badge: 'Heirloom Keepsakes', desc: 'Luxury dual-tone Radha Krishna statues, gold-plated silver thalis, and custom wedding hampers.' },
    { name: 'Anniversary', icon: '❤️', badge: 'Timeless Celebrations', desc: 'Elegant tabletop art, romantic couple figurines, and personalized brass plaques.' },
    { name: 'Birthday', icon: '🎂', badge: 'Personalized Art', desc: 'Thoughtful custom desk accessories, hand-carved wooden boxes, and luxury artifacts.' },
    { name: 'Corporate Events', icon: '💼', badge: 'Business Excellence', desc: 'Custom logo engraved trophies, executive desk plaques, and volume tier corporate boxes.' },
    { name: 'Diwali', icon: '🪔', badge: 'Festive Lights', desc: 'High-lustre 24K gold Laxmi Ganesh idols, decorative brass diyas, and festive hampers.' },
    { name: 'Ganesh Chaturthi', icon: '🐘', badge: 'Divine Grace', desc: 'Intricately chiselled Lord Ganesha idols in gold, silver, and antique bronze finishes.' },
    { name: 'Christmas', icon: '🎄', badge: 'Holiday Season', desc: 'Luxury festive decor, artisanal wooden accents, and premium gift presentation boxes.' },
    { name: 'New Year', icon: '🎆', badge: 'Prosperity Symbols', desc: 'Inspirational desk organizers, prosperity symbols, and milestone commemorative pieces.' },
    { name: 'Employee Appreciation', icon: '🌟', badge: 'Corporate Rewards', desc: 'Recognition awards, custom logo tokens, and executive appreciation hampers.' }
  ];

  return (
    <div style={{ background: 'var(--bg-cream)', minHeight: '80vh', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
            Celebrations &amp; Milestones
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--text-dark)', marginTop: '6px', marginBottom: '12px' }}>
            Shop by Occasion
          </h1>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', fontSize: '0.95rem' }}>
            Handcrafted gifting collections thoughtfully curated for every cherished moment and corporate event.
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
                borderRadius: '10px',
                padding: '28px 24px',
                border: '1px solid var(--primary-gold-border)',
                boxShadow: 'var(--shadow-sm)',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              className="occasion-card-hover"
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '2.5rem' }}>{occ.icon}</span>
                  <span style={{
                    fontSize: '0.68rem',
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
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--text-dark)', margin: '0 0 8px 0', fontWeight: '600' }}>
                  {occ.name} Gifts
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: '1.5' }}>
                  {occ.desc}
                </p>
              </div>

              <span className="btn-outline-gold" style={{ fontSize: '0.78rem', padding: '8px 16px', textAlign: 'center' }}>
                Explore {occ.name} Gifts &rarr;
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
