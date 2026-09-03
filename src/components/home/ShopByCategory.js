'use client';
import { useState } from 'react';
import Link from 'next/link';
import SectionHeader from '../common/SectionHeader';

// Unique asset fallback mapping for distinct categories (Issues #14, #15)
const CATEGORY_IMAGE_MAP = {
  'spiritual-collection': '/uploads/category-spiritual-collection.png',
  'idols': '/uploads/category-idols.png',
  'decorative-figurines': '/uploads/category-decorative-figurines.png',
  'home-decor': '/uploads/category-home-decor.png',
  'wooden-handicrafts': '/uploads/category-wooden-handicrafts.png',
  'customized-gifts': '/uploads/category-customized-products.png',
  'customized-products': '/uploads/category-customized-products.png',
  'corporate-gifts': '/uploads/category-corporate-gifts.png',
  'festive-gifts': '/uploads/category-festive-gifts.png',
  'car-dashboard-accessories': '/uploads/ganesha-gold-1.jpg',
  'return-gifts': '/uploads/category-festive-gifts.png',
  'office-decor': '/uploads/category-premium-collectibles.png',
  'best-sellers': '/uploads/category-new-arrivals.png',
  'new-arrivals': '/uploads/category-new-arrivals.png',
  'ganesha': '/uploads/category-ganesha.jpg',
  'krishna': '/uploads/category-krishna.jpg',
  'shiva': '/uploads/category-shiva.jpg',
  'hanuman': '/uploads/category-hanuman.jpg',
  'lakshmi': '/uploads/category-lakshmi.jpg'
};

const CATEGORY_DESCRIPTIONS = {
  'spiritual-collection': 'Handcrafted idols and sacred décor for peaceful home temples.',
  'home-decor': 'Elegant handcrafted accents designed to bring warmth and character to modern interiors.',
  'decorative-figurines': 'Detailed artisan figurines created for distinctive shelves, consoles and living spaces.',
  'corporate-gifts': 'Premium handcrafted gifts designed for clients, teams and business milestones.',
  'customized-gifts': 'Personalized handcrafted pieces with bespoke engraving and branding options.',
  'customized-products': 'Personalized handcrafted pieces with bespoke engraving and branding options.',
  'festive-gifts': "Thoughtfully crafted décor and gifts for India's festive celebrations.",
  'festival-collection': "Thoughtfully crafted décor and gifts for India's festive celebrations.",
  'wooden-handicrafts': 'Hand-carved wooden pieces made with traditional artisan techniques.',
  'car-dashboard-accessories': 'Compact handcrafted accents designed to elevate your car interior.',
  'return-gifts': 'Elegant handcrafted gifting options for weddings, celebrations and special occasions.',
  'office-decor': 'Refined desk and workspace accents for inspiring professional environments.',
  'best-sellers': 'Our most-loved handcrafted pieces chosen by customers across India.',
  'new-arrivals': 'The latest pieces emerging from the Anant Arts artisan workshop.',
  'idols': 'Divine 24K gold and pure silver electroplated deities crafted with shastra precision.',
  'ganesha': 'Auspicious Lord Ganesha murtis for prosperity, new beginnings, and daily puja.',
  'krishna': 'Enchanting Radha Krishna and Bal Gopal idols for love, joy, and spiritual harmony.',
  'shiva': 'Meditative Lord Shiva and Nataraja sculptures for dhyana and divine stillness.',
  'hanuman': 'Sacred Panchmukhi and Veer Hanumanji statues symbolizing courage and devotion.',
  'lakshmi': 'Goddess Lakshmi idols attracting wealth, light, and auspicious fortune into homes.'
};

export default function ShopByCategory({ categories = [] }) {
  const [showAll, setShowAll] = useState(false);
  const categoryList = Array.isArray(categories) && categories.length > 0 ? categories : [];

  // Initial display limited to 6 categories for lower cognitive load (Issue #10)
  const displayedCategories = showAll ? categoryList : categoryList.slice(0, 6);

  return (
    <section style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--section-padding-y) 2rem 0 2rem' }}>
      {/* Reusable Section Header (Issue #2) */}
      <SectionHeader
        eyebrow="Curated Domains"
        title="Shop by Category"
        subtitle="Explore handcrafted artisanal creations across core lifestyle, home décor, and devotional gifting domains."
      />

      {categoryList.length > 0 ? (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '1.75rem'
          }}>
            {displayedCategories.map((cat, idx) => {
              const catSlug = cat.slug || (cat.name || '').toLowerCase().replace(/\s+/g, '-');
              const imageSrc = cat.image_path || cat.banner_path || CATEGORY_IMAGE_MAP[catSlug] || '/uploads/category-spiritual-collection.png';
              const catName = cat.name || 'Artisanal Collection';
              const catDesc = cat.description && cat.description !== 'Handcrafted wooden décor and timeless artisan creations for elegant homes.' 
                ? cat.description 
                : (CATEGORY_DESCRIPTIONS[catSlug] || 'Handcrafted artisanal décor and devotional creations for elegant spaces.');

              return (
                <Link
                  key={cat.id || idx}
                  href={`/shop?category=${catSlug}`}
                  style={{
                    position: 'relative',
                    borderRadius: 'var(--radius-md, 10px)',
                    overflow: 'hidden',
                    height: '280px',
                    border: '1px solid var(--primary-gold-border)',
                    boxShadow: 'var(--shadow-md)',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '24px'
                  }}
                  className="featured-collection-card"
                >
                  {/* Background Image with Zoom Effect */}
                  <div 
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundImage: `url(${imageSrc}), url('/uploads/category-spiritual-collection.png')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      transition: 'transform 0.5s ease',
                      zIndex: 1
                    }}
                    className="collection-bg-zoom"
                  />

                  {/* Deepened Contrast Gradient Overlay (Issue #20) */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(20,17,15,0.5) 45%, rgba(20,17,15,0.96) 100%)',
                    zIndex: 2
                  }} />

                  {/* Card Content (Issues #9, #10: Clear interactive affordance & consistent alignment) */}
                  <div style={{ position: 'relative', zIndex: 3, color: '#FFFFFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#FFFFFF', margin: 0, fontWeight: '600' }}>
                        {catName}
                      </h3>
                      <span style={{ fontSize: '1.15rem', color: '#D4AF37', transition: 'transform 0.25s ease' }} className="cat-arrow">
                        &rarr;
                      </span>
                    </div>

                    <p style={{
                      fontSize: '0.8rem',
                      color: 'rgba(255,255,255,0.88)',
                      lineHeight: '1.4',
                      margin: '0 0 10px 0',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {catDesc}
                    </p>

                    <span style={{ 
                      fontSize: 'var(--text-xs, 0.75rem)', 
                      color: '#D4AF37', 
                      letterSpacing: '0.4px', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '5px',
                      fontWeight: '600'
                    }}>
                      Explore Collection <i className="fas fa-chevron-right" style={{ fontSize: '0.65rem' }}></i>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* View All Categories Toggle (Issue #10) */}
          {categoryList.length > 6 && (
            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
              <button
                onClick={() => setShowAll(!showAll)}
                className="btn-secondary btn-md"
              >
                <span>{showAll ? 'Show Less' : `View All Categories (${categoryList.length})`}</span>
                <i className={`fas fa-chevron-${showAll ? 'up' : 'down'}`} style={{ fontSize: '0.75rem', marginLeft: '6px' }}></i>
              </button>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-cream-dark)', borderRadius: '12px', border: '1px solid var(--primary-gold-border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No active categories currently configured in Admin Panel.</p>
        </div>
      )}
    </section>
  );
}
