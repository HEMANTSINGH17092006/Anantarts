'use client';
import { useRef } from 'react';
import ProductCard from '../common/ProductCard';

export default function NewArrivalsCarousel({ products = [] }) {
  const scrollRef = useRef(null);

  const slide = (direction) => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollAmount = 320; // approximate card width + gap
    container.scrollBy({
      left: direction * scrollAmount,
      behavior: 'smooth',
    });
  };

  if (products.length === 0) return null;

  return (
    <section className="carousel-outer" style={{ position: 'relative', overflow: 'visible', maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
      <button 
        className="carousel-btn carousel-btn-prev" 
        onClick={() => slide(-1)}
        style={{
          position: 'absolute',
          left: '0px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          backgroundColor: 'white',
          border: '1px solid var(--primary-gold-border)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-md)',
          cursor: 'pointer'
        }}
        aria-label="Previous slide"
      >
        <i className="fas fa-chevron-left"></i>
      </button>

      <div 
        className="carousel-inner" 
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: '1.5rem',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE 10+
          padding: '10px 5px'
        }}
      >
        {products.map((product) => (
          <div key={product.id} style={{ flex: '0 0 280px', scrollSnapAlign: 'start' }}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <button 
        className="carousel-btn carousel-btn-next" 
        onClick={() => slide(1)}
        style={{
          position: 'absolute',
          right: '0px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10,
          backgroundColor: 'white',
          border: '1px solid var(--primary-gold-border)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-md)',
          cursor: 'pointer'
        }}
        aria-label="Next slide"
      >
        <i className="fas fa-chevron-right"></i>
      </button>
    </section>
  );
}
