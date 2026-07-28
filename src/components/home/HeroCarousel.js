'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const HERO_SLIDES = [
  {
    title: 'Spiritual Collection',
    subtitle: 'Sacred electroplated sculptures, divine idols & temple artifacts crafted to bring peace, prosperity and divine grace into your space.',
    badge: '⚜️ Heritage Craftsmanship',
    image: '/uploads/mandir-hero-bg.jpg',
    ctaText: 'Explore Spiritual Art',
    ctaLink: '/shop?category=spiritual-collection'
  },
  {
    title: 'Wooden Handicrafts',
    subtitle: 'Authentic hand-carved wooden sculptures, wall panels, and artisanal wooden decor showcasing traditional heritage chiseling.',
    badge: '🪵 Pure Hand-Carved Wood',
    image: '/uploads/artisan-cast.png',
    ctaText: 'Discover Wooden Art',
    ctaLink: '/shop?category=wooden-handicrafts'
  },
  {
    title: 'Premium Home Décor',
    subtitle: 'Elevate your interiors with high-lustre 24K gold, sterling silver electroplated table accents, luxury vases, and wall art masterpieces.',
    badge: '🏡 Minimal Luxury Living',
    image: '/uploads/artisan-chisel.png',
    ctaText: 'Shop Home Décor',
    ctaLink: '/shop?category=home-decor'
  },
  {
    title: 'Corporate Gifting',
    subtitle: 'Make an unforgettable statement with bespoke executive desk accents, logo embossed plaques, and volume tier packaging boxes.',
    badge: '💼 Custom Corporate Solutions',
    image: '/uploads/artisan-electroplate.png',
    ctaText: 'View Corporate Catalog',
    ctaLink: '/corporate-gifts'
  },
  {
    title: 'Customized Gifts',
    subtitle: 'Personalized 24K gold and pure silver creations tailored with your dimensions, custom text engravings, and unique finishings.',
    badge: '✨ Bespoke Custom Studio',
    image: '/uploads/artisan-mold.png',
    ctaText: 'Request Custom Quote',
    ctaLink: '/shop?category=customized-gifts'
  }
];

export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentIndex];

  return (
    <section className="hero-section" style={{ position: 'relative', height: 'var(--hero-height)', minHeight: '520px', overflow: 'hidden', backgroundColor: '#14110F' }}>
      {/* Background Image / Overlay Transition */}
      {HERO_SLIDES.map((s, idx) => (
        <div 
          key={idx}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: idx === currentIndex ? 0.45 : 0,
            transition: 'opacity 1s ease-in-out',
            zIndex: 1
          }}
        >
          <div 
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(${s.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(0.7) contrast(1.1)'
            }}
          />
        </div>
      ))}

      {/* Dark Luxury Gradient Overlay */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle, rgba(30,26,23,0.3) 0%, rgba(15,12,10,0.88) 100%)',
          zIndex: 2
        }} 
      />

      {/* Slide Content */}
      <div className="hero-content" style={{ position: 'relative', zIndex: 3, textAlign: 'center', maxWidth: '900px', margin: '0 auto', padding: '0 2rem' }}>
        <span style={{
          display: 'inline-block',
          padding: '6px 16px',
          borderRadius: '20px',
          background: 'rgba(212, 175, 55, 0.15)',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          color: '#D4AF37',
          fontSize: '0.82rem',
          fontWeight: '600',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginBottom: '1.25rem'
        }}>
          {slide.badge}
        </span>

        <h1 className="hero-title" style={{ fontSize: 'var(--hero-title-size)', color: '#FFFFFF', marginBottom: 'var(--hero-title-margin)', fontFamily: 'var(--font-heading)', lineHeight: '1.18' }}>
          {slide.title}
        </h1>

        <p className="hero-subtitle" style={{ fontSize: 'var(--hero-subtitle-size)', color: 'rgba(255,255,255,0.9)', marginBottom: 'var(--hero-subtitle-margin)', lineHeight: '1.6' }}>
          {slide.subtitle}
        </p>

        <div className="hero-buttons" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href={slide.ctaLink} className="btn-gold">
            <i className="fas fa-gem" style={{ marginRight: '8px' }}></i> {slide.ctaText}
          </Link>
          <a href="#category-grid-section" className="btn-outline-gold" style={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.8)' }}>
            <i className="fas fa-th-large" style={{ marginRight: '8px' }}></i> Browse All Categories
          </a>
        </div>
      </div>

      {/* Carousel Navigation Indicators */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: 0,
        right: 0,
        zIndex: 4,
        display: 'flex',
        justify: 'center',
        alignItems: 'center',
        gap: '10px'
      }}>
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            style={{
              width: idx === currentIndex ? '32px' : '10px',
              height: '10px',
              borderRadius: '5px',
              background: idx === currentIndex ? '#D4AF37' : 'rgba(255,255,255,0.4)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>
    </section>
  );
}
