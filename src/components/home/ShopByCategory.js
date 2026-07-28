'use client';
import Link from 'next/link';

const CATEGORIES = [
  { 
    name: 'Spiritual Collection', 
    icon: '✨', 
    slug: 'spiritual-collection', 
    image: '/uploads/category-spiritual-collection.png', 
    tag: 'Divine Idols',
    desc: '24K gold & sterling silver electroplated sacred statues.'
  },
  { 
    name: 'Wooden Handicrafts', 
    icon: '🪵', 
    slug: 'wooden-handicrafts', 
    image: '/uploads/category-wooden-handicrafts.png', 
    tag: 'Hand-Carved',
    desc: 'Handcrafted wooden décor and timeless artisan creations for elegant homes.'
  },
  { 
    name: 'Home Decor', 
    icon: '🏡', 
    slug: 'home-decor', 
    image: '/uploads/category-home-decor.png', 
    tag: 'Luxury Living',
    desc: 'High-lustre tabletop art, showpieces & luxury statement vases.'
  },
  { 
    name: 'Corporate Gifts', 
    icon: '🎁', 
    slug: 'corporate-gifts', 
    image: '/uploads/category-corporate-gifts.png', 
    tag: 'Executive',
    desc: 'Executive desk organizers, awards & bespoke corporate hampers.'
  },
  { 
    name: 'Festival Collection', 
    icon: '🎉', 
    slug: 'festival-collection', 
    image: '/uploads/category-festive-gifts.png', 
    tag: 'Seasonal Specials',
    desc: 'Diwali, Ganesh Chaturthi & festive celebration specials.'
  },
  { 
    name: 'Office Collection', 
    icon: '🏢', 
    slug: 'office-decor', 
    image: '/uploads/category-office-decor.png', 
    tag: 'Workspace Art',
    desc: 'Workspace accessories, clock plaques & motivational desk art.'
  },
  { 
    name: 'Decorative Items', 
    icon: '🕯', 
    slug: 'decorative-items', 
    image: '/uploads/category-decorative-figurines.png', 
    tag: 'Showpieces',
    desc: 'Intricate brass candle holders, peacock statues & showpieces.'
  },
  { 
    name: 'Living Collection', 
    icon: '🛋', 
    slug: 'living-collection', 
    image: '/uploads/category-premium-collectibles.png', 
    tag: 'Centerpieces',
    desc: 'Collector-grade artifacts for luxury living rooms & grand foyers.'
  },
  { 
    name: 'Customized Gifts', 
    icon: '🎨', 
    slug: 'customized-gifts', 
    image: '/uploads/category-customized-products.png', 
    tag: 'Personalized',
    desc: 'Bespoke custom engraved gifts tailored to your specifications.'
  }
];

export default function ShopByCategory() {
  return (
    <section style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--section-padding-y) 2rem 0 2rem' }}>
      <div className="section-heading" style={{ marginTop: 0, marginBottom: '2.5rem' }}>
        <h2>Shop by Category</h2>
        <div className="gold-line"></div>
        <p>Explore handcrafted artisanal creations across core lifestyle, home décor, and gifting domains.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '1.75rem'
      }}>
        {CATEGORIES.map((cat, idx) => (
          <Link
            key={idx}
            href={`/shop?category=${cat.slug}`}
            style={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              height: '280px',
              border: '1px solid var(--primary-gold-border)',
              boxShadow: 'var(--shadow-md)',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '24px'
            }}
            className="featured-collection-card"
          >
            {/* Background Image with Zoom Effect */}
            <div 
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${cat.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transition: 'transform 0.5s ease',
                zIndex: 1
              }}
              className="collection-bg-zoom"
            />

            {/* Subtle Dark Gradient Overlay (Bottom 35-40% only) */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(20,17,15,0.88) 100%)',
              zIndex: 2
            }} />

            {/* Card Content */}
            <div style={{ position: 'relative', zIndex: 3, color: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>{cat.icon}</span>
                <span style={{
                  fontSize: '0.68rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  background: 'rgba(212, 175, 55, 0.25)',
                  border: '1px solid #D4AF37',
                  color: '#D4AF37',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontWeight: '600'
                }}>
                  {cat.tag}
                </span>
              </div>

              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: '#FFFFFF', margin: '0 0 4px 0', fontWeight: '600' }}>
                {cat.name}
              </h3>

              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', margin: '0 0 14px 0', lineHeight: '1.4' }}>
                {cat.desc}
              </p>

              <span 
                className="btn-outline-gold" 
                style={{ 
                  fontSize: '0.8rem', 
                  padding: '8px 18px', 
                  color: '#FFFFFF', 
                  borderColor: '#D4AF37',
                  background: 'rgba(20, 17, 15, 0.5)',
                  backdropFilter: 'blur(4px)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                Explore Collection &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
