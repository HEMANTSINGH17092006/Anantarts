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
    <section className="hero-banner-container">
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

      {/* Subtle Left-Side Gradient Overlay */}
      <div className="hero-gradient-overlay" />

      {/* Product-Focused Content */}
      <div className="hero-banner-content">
        <div className="hero-text-wrapper">
          <span className="hero-badge">
            ✨ Master Artisanal Craftsmanship
          </span>

          <h1 className="hero-title-text">
            {slide.title}
          </h1>

          <p className="hero-subtitle-text">
            {slide.subtitle}
          </p>

          {/* Prominent CTAs */}
          <div className="hero-cta-group">
            <Link href={slide.shopLink} className="btn-gold hero-btn-primary">
              <i className="fas fa-shopping-bag" style={{ marginRight: '6px' }}></i> Shop Collection
            </Link>
            <Link href={slide.exploreLink} className="btn-outline-gold hero-btn-secondary">
              <i className="fas fa-th-large" style={{ marginRight: '6px' }}></i> Explore All
            </Link>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="hero-slide-indicators">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={`hero-indicator-dot ${idx === currentIndex ? 'active' : ''}`}
          />
        ))}
      </div>
    </section>
  );
}
