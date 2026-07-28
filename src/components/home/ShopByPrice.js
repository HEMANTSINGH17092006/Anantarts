'use client';
import Link from 'next/link';

const PRICE_RANGES = [
  { label: 'Under ₹499', minPrice: 0, maxPrice: 499, tag: 'Budget Friendly', icon: '🏷️', desc: 'Pocket-friendly return gifts & small idols' },
  { label: '₹500 – ₹999', minPrice: 500, maxPrice: 999, tag: 'Popular Gifting', icon: '🎁', desc: 'Car dashboard decor & festive tokens' },
  { label: '₹1,000 – ₹1,999', minPrice: 1000, maxPrice: 1999, tag: 'Premium Accents', icon: '✨', desc: 'Tabletop idols, desk organizers & vases' },
  { label: '₹2,000+', minPrice: 2000, maxPrice: 50000, tag: 'Luxury Sculptures', icon: '👑', desc: 'Grand 24K gold electroplated masterpieces' }
];

export default function ShopByPrice() {
  return (
    <section style={{ maxWidth: '1280px', margin: '0 auto var(--section-margin-bottom) auto', padding: '0 2rem' }}>
      <div className="section-heading" style={{ marginTop: 'var(--section-margin-top)', marginBottom: '2.5rem' }}>
        <h2>Shop by Price</h2>
        <div className="gold-line"></div>
        <p>Discover handcrafted products tailored to your exact budget requirements.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem'
      }}>
        {PRICE_RANGES.map((pr, idx) => (
          <Link
            key={idx}
            href={`/shop?minPrice=${pr.minPrice}&maxPrice=${pr.maxPrice}`}
            style={{
              background: '#FFFFFF',
              borderRadius: '8px',
              padding: '24px 20px',
              border: '1px solid var(--primary-gold-border)',
              boxShadow: 'var(--shadow-sm)',
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              textAlign: 'center'
            }}
            className="price-card-hover"
          >
            <span style={{ fontSize: '2.2rem', marginBottom: '10px' }}>{pr.icon}</span>
            <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--primary-gold)', fontWeight: '700', letterSpacing: '1px', marginBottom: '4px' }}>
              {pr.tag}
            </span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--text-dark)', margin: '0 0 6px 0', fontWeight: '700' }}>
              {pr.label}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: '1.4' }}>
              {pr.desc}
            </p>
            <span className="btn-outline-gold" style={{ fontSize: '0.75rem', padding: '6px 14px' }}>
              View Products &rarr;
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
