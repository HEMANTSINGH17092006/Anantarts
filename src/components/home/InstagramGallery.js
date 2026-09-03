'use client';

const INSTA_POSTS = [
  { title: 'Rajasthani Teak Carving', tag: '@anantarts', image: '/uploads/artisan-mold.png' },
  { title: '24K Gold Electroplating', tag: '@anantarts', image: '/uploads/artisan-cast.png' },
  { title: 'Fine Chiseling Detail', tag: '@anantarts', image: '/uploads/artisan-chisel.png' },
  { title: 'Luxury Packaging Crates', tag: '@anantarts', image: '/uploads/artisan-electroplate.png' },
  { title: 'Temple Altar Setup', tag: '@anantarts', image: '/uploads/mandir-hero-bg.jpg' },
  { title: 'Corporate Gift Hampers', tag: '@anantarts', image: '/uploads/category-corporate-gifts.png' }
];

export default function InstagramGallery() {
  return (
    <section style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--section-padding-y) 2rem 0 2rem' }}>
      <div className="section-heading" style={{ marginTop: 0, marginBottom: '2.5rem' }}>
        <h2>Artisan Studio Gallery</h2>
        <div className="gold-line"></div>
        <p>Follow <strong>@anantarts</strong> on Instagram for behind-the-scenes wax molding, gold electroplating, and customer setups.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '1.25rem'
      }}>
        {INSTA_POSTS.map((post, idx) => (
          <a
            key={idx}
            href="https://www.instagram.com/anantarts.in?igsh=MXB0d215YzVtZ3Q0aw=="
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: 'relative',
              borderRadius: '8px',
              overflow: 'hidden',
              height: '200px',
              border: '1px solid var(--primary-gold-border)',
              display: 'block',
              textDecoration: 'none'
            }}
            className="featured-collection-card"
          >
            <div 
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${post.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transition: 'transform 0.4s ease'
              }}
              className="collection-bg-zoom"
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(20,17,15,0.75) 100%)',
              zIndex: 2
            }} />
            <div style={{ position: 'absolute', top: '10px', right: '10px', color: '#FFF', fontSize: '1.1rem', zIndex: 3 }}>
              <i className="fab fa-instagram"></i>
            </div>
            <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', color: '#FFF', zIndex: 3 }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: '600', margin: '0 0 2px 0' }}>{post.title}</h3>
              <span style={{ fontSize: '0.7rem', color: '#D4AF37' }}>{post.tag}</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
