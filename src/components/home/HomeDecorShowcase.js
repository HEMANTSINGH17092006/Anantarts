'use client';
import Link from 'next/link';

const HOME_DECOR_ITEMS = [
  { name: 'Table Decor', icon: '🛋️', query: 'table decor', desc: 'Centerpiece sculptures & high-lustre metallic tabletop accents.' },
  { name: 'Wall Art', icon: '🖼️', query: 'wall art', desc: 'Hand-carved wooden wall panels & 24K gold foil wall art plaques.' },
  { name: 'Showpieces', icon: '✨', query: 'showpiece', desc: 'Intricate decorative statues, peacock sculptures & abstract art.' },
  { name: 'Luxury Decor', icon: '👑', query: 'luxury', desc: 'Collector-grade electroplated artifacts designed for grand foyers.' },
  { name: 'Lighting Decor', icon: '🕯️', query: 'lighting', desc: 'Brass candle stands, traditional thali lamps & mood lanterns.' },
  { name: 'Vases', icon: '🏺', query: 'vase', desc: 'Electroplated brass & metallic ceramic display vases.' }
];

export default function HomeDecorShowcase() {
  return (
    <section style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--section-padding-y) 2rem 0 2rem' }}>
      <div className="section-heading" style={{ marginTop: 0, marginBottom: '2.5rem' }}>
        <h2>Home Décor Showcase</h2>
        <div className="gold-line"></div>
        <p>Elevate your living spaces with high-lustre 24K gold, silver, and wooden artisan centerpieces.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.75rem'
      }}>
        {HOME_DECOR_ITEMS.map((item, idx) => (
          <Link
            key={idx}
            href={`/shop?category=home-decor&search=${encodeURIComponent(item.query)}`}
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '28px 24px',
              border: '1px solid var(--primary-gold-border)',
              boxShadow: 'var(--shadow-sm)',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px'
            }}
            className="material-card-hover"
          >
            <span style={{ fontSize: '2.5rem', flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--text-dark)', margin: '0 0 6px 0', fontWeight: '600' }}>
                {item.name}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: '1.4' }}>
                {item.desc}
              </p>
              <span style={{ fontSize: '0.76rem', color: 'var(--primary-gold)', fontWeight: '600' }}>
                Browse {item.name} &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
