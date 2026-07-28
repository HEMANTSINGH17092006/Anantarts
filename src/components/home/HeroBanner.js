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
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const slide = HERO_SLIDES[currentIndex];

  return (
    <section className="grand-hero-slider">
      {/* Slide Background Images */}
      {HERO_SLIDES.map((s, idx) => (
        <div
          key={idx}
          className="hero-slide-bg hero-kenburns-bg"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${s.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center right',
            opacity: idx === currentIndex ? 0.90 : 0,
            filter: 'brightness(1.18) contrast(1.08) saturate(1.1)',
            transition: 'opacity 1.2s ease-in-out',
            zIndex: 1
          }}
        />
      ))}

      {/* Dark Luxury Gradient Overlay */}
      <div 
        className="hero-slide-overlay"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(14,11,9,0.88) 0%, rgba(14,11,9,0.58) 50%, rgba(14,11,9,0.15) 100%)',
          zIndex: 2
        }} 
      />

      {/* Hero Content Container */}
      <div className="hero-slide-container">
        <div className="hero-slide-text-box">
          <span className="hero-gold-badge">
            ✨ Luxury Handcrafted Artistry
          </span>

          <h1 className="hero-slide-heading">
            {slide.title}
          </h1>

          <p className="hero-slide-subheading">
            {slide.subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="hero-slide-actions">
            <Link href={slide.shopLink} className="btn-gold hero-btn-gold">
              <i className="fas fa-shopping-bag" style={{ marginRight: '8px' }}></i> Shop Now
            </Link>
            <Link href={slide.exploreLink} className="btn-outline-gold hero-btn-outline">
              <i className="fas fa-th-large" style={{ marginRight: '8px' }}></i> Explore Collection
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={handlePrev}
        className="hero-arrow-btn prev-arrow"
        aria-label="Previous slide"
      >
        <i className="fas fa-chevron-left"></i>
      </button>

      <button 
        onClick={handleNext}
        className="hero-arrow-btn next-arrow"
        aria-label="Next slide"
      >
        <i className="fas fa-chevron-right"></i>
      </button>

      {/* Pagination Dots */}
      <div className="hero-pagination-dots">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={`hero-dot-btn ${idx === currentIndex ? 'active' : ''}`}
          />
        ))}
      </div>
    </section>
  );
}
