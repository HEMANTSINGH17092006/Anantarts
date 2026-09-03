'use client';
import SectionHeader from '../common/SectionHeader';

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
      {/* Reusable Section Header (Issue #2) */}
      <SectionHeader
        eyebrow="Patron Experiences"
        title="Customer Reviews &amp; Testimonials"
        subtitle="Read genuine patron experiences from devotional homeowners, interior designers, and corporate partners across India."
      />

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
              borderRadius: 'var(--radius-md, 10px)',
              padding: '36px 30px',
              border: '1px solid var(--primary-gold-border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              {/* Rating (Issue #21: Generous top room & balanced spacing) */}
              <div style={{ display: 'flex', gap: '4px', color: '#D4AF37', marginBottom: '18px', fontSize: '0.95rem' }}>
                {Array.from({ length: test.rating || 5 }).map((_, i) => (
                  <i key={i} className="fas fa-star"></i>
                ))}
              </div>

              <p style={{ fontStyle: 'italic', fontSize: 'var(--text-base, 0.95rem)', color: 'var(--color-text-primary, #1A1918)', lineHeight: '1.75', marginBottom: '24px' }}>
                &ldquo;{test.comment}&rdquo;
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderTop: '1px solid var(--bg-cream-dark)', paddingTop: '18px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-full)',
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
                <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text-primary, #1A1918)', margin: 0 }}>
                  <cite style={{ fontStyle: 'normal' }}>{test.name}</cite>
                </p>
                <span style={{ fontSize: 'var(--text-xs, 0.75rem)', color: 'var(--color-text-muted, #6B655B)' }}>{test.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
