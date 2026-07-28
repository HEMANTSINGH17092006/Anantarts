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
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <span style={{ color: 'var(--primary-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.78rem', fontWeight: '700' }}>Viral &amp; Adored</span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--text-dark)', margin: '4px 0 0 0' }}>Trending Now</h2>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleScroll('left')}
              aria-label="Previous"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#FFFFFF',
                border: '1px solid var(--primary-gold-border)',
                color: 'var(--text-dark)',
                cursor: 'pointer'
              }}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button
              onClick={() => handleScroll('right')}
              aria-label="Next"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#FFFFFF',
                border: '1px solid var(--primary-gold-border)',
                color: 'var(--text-dark)',
                cursor: 'pointer'
              }}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>

        <div
          ref={containerRef}
          style={{
            display: 'flex',
            gap: '1.5rem',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
            paddingBottom: '0.5rem'
          }}
        >
          {products.map((p) => (
            <div key={p.id} style={{ flex: '0 0 280px', scrollSnapAlign: 'start' }}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
