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
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(20,17,15,0.45) 45%, rgba(20,17,15,0.94) 100%)',
                    zIndex: 2
                  }} />

                  {/* Card Content (Issue #11: Clean, unscannable repetition removed) */}
                  <div style={{ position: 'relative', zIndex: 3, color: '#FFFFFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: '#FFFFFF', margin: 0, fontWeight: '600' }}>
                        {catName}
                      </h3>
                      <span style={{ fontSize: '1.15rem', color: '#D4AF37', transition: 'transform 0.25s ease' }} className="cat-arrow">
                        &rarr;
                      </span>
                    </div>
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
