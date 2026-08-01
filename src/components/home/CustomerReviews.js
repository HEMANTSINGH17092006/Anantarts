'use client';

export default function CustomerReviews({ testimonials = [] }) {
  const DEFAULT_TESTIMONIALS = [
    {
      id: 1,
      name: 'Vikramaditya Singhania',
      role: 'Interior Architect, Mumbai',
      rating: 5,
      comment: 'The 24K Gold Ganesha idol from Anant Arts is the centerpiece of our villa foyer. The electroplating lustre is unmatched and the wooden crate packaging ensured absolute safety!',
      photo: '/uploads/mandir-hero-bg.jpg'
    },
    {
      id: 2,
      name: 'Dr. Meenakshi Sundaram',
      role: 'Art Collector, Chennai',
      rating: 5,
      comment: 'Extremely impressed with the hand-carved wooden Krishna statue. You can feel the Rajasthan artisan craftsmanship in every detail. Highly recommended for luxury home decor.',
      photo: '/uploads/artisan-cast.png'
    },
    {
      id: 3,
      name: 'Rajesh & Pooja Aggarwal',
      role: 'Corporate Director, Delhi',
      rating: 5,
      comment: 'We ordered 150 customized desk organizers for our corporate anniversary event. Anant Arts handled the logo engraving and velvet box packaging flawlessly.',
      photo: '/uploads/artisan-chisel.png'
    }
  ];

  const items = testimonials && testimonials.length > 0 ? testimonials : DEFAULT_TESTIMONIALS;

  return (
    <section style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--section-padding-y) 2rem 0 2rem' }}>
      <div className="section-heading" style={{ marginTop: 0, marginBottom: '2.5rem' }}>
        <h2>Customer Reviews &amp; Experiences</h2>
        <div className="gold-line"></div>
        <p>Read genuine patron experiences from homeowners, interior designers, and corporate partners.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
        gap: '2rem'
      }}>
        {items.map((test) => (
          <div
            key={test.id}
            style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '28px',
              border: '1px solid var(--primary-gold-border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              {/* Rating */}
              <div style={{ display: 'flex', gap: '4px', color: '#D4AF37', marginBottom: '14px', fontSize: '0.95rem' }}>
                {Array.from({ length: test.rating || 5 }).map((_, i) => (
                  <i key={i} className="fas fa-star"></i>
                ))}
              </div>

              <p style={{ fontStyle: 'italic', fontSize: '0.88rem', color: 'var(--text-dark)', lineHeight: '1.6', marginBottom: '20px' }}>
                &ldquo;{test.comment}&rdquo;
              </p>

            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderTop: '1px solid var(--bg-cream-dark)', paddingTop: '16px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-gold-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                border: '1px solid var(--primary-gold)'
              }}>
                💎
              </div>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: '600', color: 'var(--text-dark)', margin: 0 }}>{test.name}</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{test.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
