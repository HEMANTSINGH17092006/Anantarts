'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const HERO_SLIDES = [
  {
    title: 'Exquisite Hand-Carved Wooden Handicrafts',
    subtitle: 'Preserving ancient Rajasthani woodworking heritage with hand-chiselled rosewood wall panels, wooden temples, and serving trays.',
    image: '/uploads/artisan-cast.png',
    shopLink: '/shop?category=wooden-handicrafts',
    exploreLink: '/collections'
  },
  {
    title: 'Luxury Handcrafted Lifestyle & Décor Marketplace',
    subtitle: 'Discover master artisanal creations across wooden handicrafts, 24K gold electroplated art, home accents, and bespoke corporate gifting.',
    image: '/uploads/mandir-hero-bg.jpg',
    shopLink: '/shop',
    exploreLink: '/collections'
  },
  {
    title: 'Timeless Electroplated Home Décor',
    subtitle: 'High-lustre 24K gold and sterling silver electroplated showpieces, table accents, and statement centerpieces.',
    image: '/uploads/artisan-chisel.png',
    shopLink: '/shop?category=home-decor',
    exploreLink: '/collections'
  },
  {
    title: 'Distinguished Corporate & Customized Gifting',
    subtitle: 'Executive desk organizers, logo embossed identity plaques, and bespoke presentation packaging engineered for bulk orders.',
    image: '/uploads/artisan-electroplate.png',
    shopLink: '/corporate-gifts',
    exploreLink: '/occasions'
  }
];

export default function HeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentIndex];

  return (
    <section style={{
      position: 'relative',
      width: '100%',
      height: '84vh',
      minHeight: '540px',
      overflow: 'hidden',
      backgroundColor: '#14110F'
    }}>
      {/* Slide Backgrounds with Ken Burns Slow Zoom */}
      {HERO_SLIDES.map((s, idx) => (
        <div
          key={idx}
          className="hero-kenburns-bg"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${s.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
            opacity: idx === currentIndex ? 0.88 : 0,
            filter: 'brightness(1.18) contrast(1.08) saturate(1.1)',
            transition: 'opacity 1.2s ease-in-out',
            zIndex: 1
          }}
        />
      ))}

      {/* Deepened Left-Side Scrim Gradient Overlay (Issue #19: Text pop over busy background) */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(90deg, rgba(14,11,9,0.94) 0%, rgba(14,11,9,0.76) 45%, rgba(14,11,9,0.18) 100%)',
        zIndex: 2
      }} />

      {/* Left-Aligned Product-Focused Content (Issue #24: Aligned with header container) */}
      <div style={{
        position: 'relative',
        zIndex: 3,
        maxWidth: '1280px',
        margin: '0 auto',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '0 2rem'
      }}>
        <div style={{
          maxWidth: '640px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          textAlign: 'left'
        }}>
          <span style={{
            color: '#D4AF37',
            letterSpacing: '0.5px',
            textTransform: 'none',
            fontSize: 'var(--text-sm, 0.875rem)',
            fontWeight: '600',
            marginBottom: '1.2rem',
            background: 'rgba(212,175,55,0.18)',
            padding: '6px 18px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(212,175,55,0.4)',
            boxShadow: '0 0 12px rgba(212,175,55,0.2)'
          }}>
            ✨ Master Artisanal Craftsmanship
          </span>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2.2rem, 5vw, 3rem)',
            color: '#FFFFFF',
            lineHeight: '1.18',
            marginBottom: '1.25rem',
            textShadow: '0 4px 20px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.8)',
            fontWeight: '700'
          }}>
            {slide.title}
          </h1>

          <p style={{
            fontSize: 'var(--text-md, 1.125rem)',
            color: 'rgba(255,255,255,0.95)',
            lineHeight: '1.65',
            marginBottom: '2.25rem',
            maxWidth: '600px',
            textShadow: '0 2px 12px rgba(0,0,0,0.8)'
          }}>
            {slide.subtitle}
          </p>

          {/* Prominent CTAs (Issues #16, #18: Clear primary vs secondary hierarchy) */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href={slide.shopLink} className="btn-primary btn-lg" style={{ boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4)' }}>
              <i className="fas fa-shopping-bag" style={{ marginRight: '8px' }}></i> Shop Collection
            </Link>
            <Link 
              href={slide.exploreLink} 
              className="btn-secondary btn-lg" 
              style={{ 
                color: '#FFFFFF', 
                borderColor: '#D4AF37', 
                borderWidth: '1.5px',
                background: 'rgba(18, 14, 12, 0.78)', 
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)'
              }}
            >
              <i className="fas fa-th-large" style={{ marginRight: '8px' }}></i> Explore All
            </Link>
          </div>
        </div>
      </div>

      {/* Slide Indicators: Centered with High-Contrast Touch Affordance (Issue #9) */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 4,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to Slide ${idx + 1}`}
            style={{
              width: idx === currentIndex ? '36px' : '12px',
              height: '12px',
              borderRadius: '6px',
              background: idx === currentIndex ? '#D4AF37' : 'rgba(255,255,255,0.65)',
              border: '1.5px solid rgba(0,0,0,0.3)',
              cursor: 'pointer',
              padding: 0,
              minWidth: '12px',
              transition: 'all 0.3s ease',
              boxShadow: idx === currentIndex ? '0 0 12px rgba(212,175,55,0.9)' : 'none'
            }}
          />
        ))}
      </div>
    </section>
  );
}
