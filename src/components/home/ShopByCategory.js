'use client';
import Link from 'next/link';

export default function ShopByCategory({ categories = [] }) {
  // If categories are passed dynamically from DB, use them; otherwise fallback gracefully
  const categoryList = Array.isArray(categories) && categories.length > 0 ? categories : [];

  return (
    <section style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--section-padding-y) 2rem 0 2rem' }}>
      <div className="section-heading" style={{ marginTop: 0, marginBottom: '2.5rem' }}>
        <h2>Shop by Category</h2>
        <div className="gold-line"></div>
        <p>Explore handcrafted artisanal creations across core lifestyle, home décor, and gifting domains.</p>
      </div>

      {categoryList.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '1.75rem'
        }}>
          {categoryList.map((cat, idx) => {
            const imageSrc = cat.image_path || cat.banner_path || '/uploads/artisan-cast.png';
            const catName = cat.name || 'Artisanal Collection';
            const catDesc = cat.description || 'Handcrafted wooden décor and timeless artisan creations for elegant homes.';
            const catSlug = cat.slug || catName.toLowerCase().replace(/\s+/g, '-');
            const catTag = cat.is_featured === 1 ? 'Featured' : 'Handcrafted';

            return (
              <Link
                key={cat.id || idx}
                href={`/shop?category=${catSlug}`}
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
                    backgroundImage: `url(${imageSrc}), url('/uploads/artisan-cast.png')`,
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
                    <span style={{ fontSize: '1.4rem' }}>✨</span>
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
                      {catTag}
                    </span>
                  </div>

                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: '#FFFFFF', margin: '0 0 4px 0', fontWeight: '600' }}>
                    {catName}
                  </h3>

                  <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', margin: '0 0 14px 0', lineHeight: '1.4' }}>
                    {catDesc}
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
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-cream-dark)', borderRadius: '12px', border: '1px border var(--primary-gold-border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No active categories currently configured in Admin Panel.</p>
        </div>
      )}
    </section>
  );
}
