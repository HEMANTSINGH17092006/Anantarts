'use client';
import Link from 'next/link';

const WOODEN_SUBCATEGORIES = [
  { name: 'Wall Decor', icon: '🖼️', query: 'wall decor' },
  { name: 'Wooden Temples', icon: '🛕', query: 'temple' },
  { name: 'Wooden Carvings', icon: '🪵', query: 'carved' },
  { name: 'Wooden Sculptures', icon: '🗿', query: 'sculpture' },
  { name: 'Wooden Gift Items', icon: '🎁', query: 'gift' },
  { name: 'Serving Trays', icon: '☕', query: 'tray' },
  { name: 'Storage Boxes', icon: '📦', query: 'box' },
  { name: 'Furniture Accessories', icon: '🪑', query: 'furniture' }
];

export default function WoodenShowcase() {
  return (
    <section style={{
      position: 'relative',
      width: '100%',
      padding: '5rem 2rem',
      backgroundColor: '#2A1F17',
      color: '#FFFFFF',
      overflow: 'hidden'
    }}>
      {/* Background Image: Warm Wooden Workshop (High Brightness & Craft Visibility) */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url(/uploads/artisan-cast.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.65,
        filter: 'brightness(1.15) contrast(1.1) saturate(1.15)',
        zIndex: 1
      }} />

      {/* Subtle Warm Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(42,31,23,0.55) 0%, rgba(20,15,10,0.85) 100%)',
        zIndex: 2
      }} />

      <div style={{ position: 'relative', zIndex: 3, maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ color: '#D4AF37', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
            Artisanal Heritage
          </span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: '#FFFFFF', marginTop: '6px', marginBottom: '12px' }}>
            Wooden Handicrafts Showcase
          </h2>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'rgba(255,255,255,0.9)', maxWidth: '720px', margin: '0 auto', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Immerse yourself in authentic Rajasthani woodworking. Hand-carved from seasoned rosewood, teak wood, and MDF with intricate chiseling.
          </p>
        </div>

        {/* Subcategories Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1.5rem'
        }}>
          {WOODEN_SUBCATEGORIES.map((sub, idx) => (
            <Link
              key={idx}
              href={`/shop?category=wooden-handicrafts&search=${encodeURIComponent(sub.query)}`}
              style={{
                background: 'rgba(20, 15, 10, 0.55)',
                backdropFilter: 'blur(8px)',
                borderRadius: '10px',
                padding: '24px 20px',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
              className="material-card-hover"
            >
              <span style={{ fontSize: '2.2rem', flexShrink: 0 }}>{sub.icon}</span>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: '#FFFFFF', margin: '0 0 4px 0', fontWeight: '600' }}>
                  {sub.name}
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#D4AF37', fontWeight: '500' }}>
                  Explore Collection &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link href="/shop?category=wooden-handicrafts" className="btn-gold" style={{ padding: '12px 28px', fontSize: '0.85rem' }}>
            View Full Wooden Collection
          </Link>
        </div>
      </div>
    </section>
  );
}
