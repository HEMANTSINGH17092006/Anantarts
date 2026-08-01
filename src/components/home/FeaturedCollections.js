'use client';
import Link from 'next/link';

const FEATURED_COLLECTIONS = [
  {
    title: 'Luxury Wooden Collection',
    desc: 'Artisanal hand-carved rosewood, teak and MDF sculptures.',
    image: '/uploads/artisan-cast.png',
    link: '/shop?category=wooden-handicrafts',
    tag: 'Hand-Carved'
  },
  {
    title: 'Premium Spiritual Collection',
    desc: '24K gold and sterling silver electroplated divine idols.',
    image: '/uploads/mandir-hero-bg.jpg',
    link: '/shop?category=spiritual-collection',
    tag: 'Sacred Art'
  },
  {
    title: 'Home Styling Collection',
    desc: 'Curated wall panels, luxury vases & high-lustre table accents.',
    image: '/uploads/artisan-chisel.png',
    link: '/shop?category=home-decor',
    tag: 'Interiors'
  },
  {
    title: 'Office Collection',
    desc: 'Executive desk organizers, clock plaques & motivational art.',
    image: '/uploads/artisan-electroplate.png',
    link: '/shop?category=office-decor',
    tag: 'Workspace'
  },
  {
    title: 'Corporate Gifts',
    desc: 'Bespoke identity awards & volume tier presentation boxes.',
    image: '/uploads/artisan-mold.png',
    link: '/corporate-gifts',
    tag: 'B2B Gifting'
  },
  {
    title: 'Festival Specials',
    desc: 'Exclusive Diwali, Ganesh Chaturthi & seasonal celebration hampers.',
    image: '/uploads/category-festive-gifts.png',
    link: '/shop?category=festival-collection',
    tag: 'Seasonal'
  }
];

export default function FeaturedCollections() {
  return (
    <section style={{ maxWidth: '1280px', margin: '0 auto var(--section-margin-bottom) auto', padding: '0 2rem' }}>
      <div className="section-heading" style={{ marginTop: 'var(--section-margin-top)', marginBottom: '2.5rem' }}>
        <h2>Featured Collections</h2>
        <div className="gold-line"></div>
        <p>Explore curated design series crafted to transform your living spaces, workspaces, and gifting moments.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
        gap: '1.75rem'
      }}>
        {FEATURED_COLLECTIONS.map((col, idx) => (
          <Link
            key={idx}
            href={col.link}
            style={{
              position: 'relative',
              borderRadius: '10px',
              overflow: 'hidden',
              height: '240px',
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
            {/* Background Image */}
            <div 
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${col.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transition: 'transform 0.5s ease',
                zIndex: 1
              }}
              className="collection-bg-zoom"
            />
            {/* Gradient Overlay */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(20,17,15,0.85) 100%)',
              zIndex: 2
            }} />

            {/* Card Content */}
            <div style={{ position: 'relative', zIndex: 3, color: '#FFFFFF' }}>
              <span style={{
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                background: 'rgba(212, 175, 55, 0.25)',
                border: '1px solid #D4AF37',
                color: '#D4AF37',
                padding: '3px 10px',
                borderRadius: '12px',
                fontWeight: '600',
                display: 'inline-block',
                marginBottom: '8px'
              }}>
                {col.tag}
              </span>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: '#FFFFFF', margin: '0 0 6px 0', fontWeight: '600' }}>
                {col.title}
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)', margin: '0 0 12px 0', lineHeight: '1.4' }}>
                {col.desc}
              </p>
              <span style={{ fontSize: '0.78rem', color: '#D4AF37', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Explore Series <i className="fas fa-arrow-right" style={{ fontSize: '0.7rem' }}></i>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
