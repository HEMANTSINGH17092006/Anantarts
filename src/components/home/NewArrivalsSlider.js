'use client';
import { useRef } from 'react';
import ProductCard from '../common/ProductCard';

export default function NewArrivalsSlider({ products = [] }) {
  const sliderRef = useRef(null);

  const scroll = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--section-padding-y) 2rem 0 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ color: 'var(--primary-gold-hover)', letterSpacing: '0.5px', textTransform: 'none', fontSize: '0.85rem', fontWeight: '600' }}>Fresh Off The Workshop</span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--text-dark)', margin: '4px 0 0 0' }}>New Arrivals</h2>
        </div>

        {/* Scroll Controls */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => scroll('left')}
            aria-label="Previous Products"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: '1px solid var(--primary-gold-border)',
              color: 'var(--text-dark)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Next Products"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#FFFFFF',
              border: '1px solid var(--primary-gold-border)',
              color: 'var(--text-dark)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <i className="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>

      {/* Horizontal Slider */}
      <div
        ref={sliderRef}
        style={{
          display: 'flex',
          gap: '1.5rem',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          paddingBottom: '1rem'
        }}
      >
        {products.map((p) => (
          <div key={p.id} style={{ flex: '0 0 280px', scrollSnapAlign: 'start' }}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
