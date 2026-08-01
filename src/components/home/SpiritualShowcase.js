'use client';
import Link from 'next/link';

const DEITIES = [
  { name: 'Lord Ganesha', query: 'ganesha', icon: '🐘', desc: 'Remover of obstacles & harbinger of prosperity.' },
  { name: 'Lord Krishna', query: 'krishna', icon: '🪈', desc: 'Divine embodiments of love, grace & wisdom.' },
  { name: 'Lord Shiva', query: 'shiva', icon: '🔱', desc: 'Adiyogi & auspicious cosmic energy statues.' },
  { name: 'Goddess Lakshmi', query: 'lakshmi', icon: '🪷', desc: 'Bestower of wealth, abundance & good fortune.' },
  { name: 'Sai Baba', query: 'sai', icon: '🙏', desc: 'Symbols of devotion, peace & universal love.' },
  { name: 'Lord Hanuman', query: 'hanuman', icon: '🚩', desc: 'Embodiments of courage, strength & protection.' }
];

export default function SpiritualShowcase() {
  return (
    <section style={{
      background: 'linear-gradient(135deg, #1E1A17 0%, #2B231F 100%)',
      padding: '5rem 2rem',
      borderTop: '2px solid #D4AF37',
      borderBottom: '2px solid #D4AF37',
      color: '#FFFFFF'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ color: '#D4AF37', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
            Sacred Artistry
          </span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: '#FFFFFF', marginTop: '6px', marginBottom: '12px' }}>
            Spiritual Collection
          </h2>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: '700px', margin: '0 auto', fontSize: '0.95rem' }}>
            24K gold and pure sterling silver electroplated sacred sculptures crafted to infuse divine grace into your home temple or office altar.
          </p>
        </div>

        {/* Deities Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
          gap: '1.75rem'
        }}>
          {DEITIES.map((deity, idx) => (
            <Link
              key={idx}
              href={`/shop?category=spiritual-collection&search=${encodeURIComponent(deity.query)}`}
              style={{
                background: 'rgba(212, 175, 55, 0.08)',
                borderRadius: '12px',
                padding: '28px 24px',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '18px'
              }}
              className="category-card-hover"
            >
              <span style={{
                fontSize: '2.6rem',
                background: 'rgba(212, 175, 55, 0.15)',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #D4AF37',
                flexShrink: 0
              }}>
                {deity.icon}
              </span>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#D4AF37', margin: '0 0 4px 0', fontWeight: '600' }}>
                  {deity.name}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                  {deity.desc}
                </p>
                <span style={{ fontSize: '0.75rem', color: '#FFFFFF', fontWeight: '500' }}>
                  Explore Idols &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link href="/shop?category=spiritual-collection" className="btn-gold" style={{ padding: '12px 28px', fontSize: '0.85rem' }}>
            View Full Spiritual Collection
          </Link>
        </div>
      </div>
    </section>
  );
}
