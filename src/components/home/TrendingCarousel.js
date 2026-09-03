'use client';
import { useRef } from 'react';
import ProductCard from '../common/ProductCard';

export default function TrendingCarousel({ products = [] }) {
  const containerRef = useRef(null);

  const handleScroll = (dir) => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section style={{ background: 'var(--bg-cream-dark)', padding: 'var(--section-padding-y) 0', borderTop: '1px solid var(--primary-gold-border)', borderBottom: '1px solid var(--primary-gold-border)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>
        
        {/* Centered Section Heading (Issue #9) */}
        <div className="section-heading" style={{ marginTop: 0, marginBottom: '2.5rem', textAlign: 'center' }}>
          <span style={{ color: 'var(--saffron-dark)', letterSpacing: '0.5px', textTransform: 'none', fontSize: '0.85rem', fontWeight: 600, display: 'inline-block', marginBottom: '6px' }}>
            Viral &amp; Adored
          </span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', color: 'var(--text-dark)', margin: '0 0 10px 0' }}>
            Trending Now
          </h2>
          <div className="gold-line" style={{ margin: '0 auto 12px auto' }}></div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0 auto', maxWidth: '600px' }}>
            Our most coveted artisan idols and electroplated centerpieces adored across India.
          </p>
        </div>

        {/* Carousel Container with Floating Side Navigation (Issue #8) */}
        <div style={{ position: 'relative' }}>
          {/* Floating Left Arrow */}
          <button
            onClick={() => handleScroll('left')}
            aria-label="Previous Products"
            className="carousel-side-nav"
            style={{
              position: 'absolute',
              left: '-20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: '1.5px solid var(--primary-gold-border)',
              boxShadow: 'var(--shadow-md)',
              color: 'var(--text-dark)',
              zIndex: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fas fa-chevron-left" style={{ fontSize: '0.9rem' }}></i>
          </button>

          {/* Scrolling Product Track */}
          <div
            ref={containerRef}
            style={{
              display: 'flex',
              gap: '1.5rem',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              padding: '0.5rem 0'
            }}
          >
            {products.map((p) => (
              <div key={p.id} style={{ flex: '0 0 280px', scrollSnapAlign: 'start' }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>

          {/* Floating Right Arrow */}
          <button
            onClick={() => handleScroll('right')}
            aria-label="Next Products"
            className="carousel-side-nav"
            style={{
              position: 'absolute',
              right: '-20px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: '1.5px solid var(--primary-gold-border)',
              boxShadow: 'var(--shadow-md)',
              color: 'var(--text-dark)',
              zIndex: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fas fa-chevron-right" style={{ fontSize: '0.9rem' }}></i>
          </button>
        </div>
      </div>
    </section>
  );
}
