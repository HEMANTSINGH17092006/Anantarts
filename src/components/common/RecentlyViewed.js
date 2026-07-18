'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

// Helper to log a viewed product to LocalStorage
export function logRecentlyViewed(product) {
  if (typeof window === 'undefined' || !product) return;
  
  try {
    const raw = localStorage.getItem('anant_arts_recently_viewed');
    let list = raw ? JSON.parse(raw) : [];

    // Filter out duplicates
    list = list.filter(item => item.id !== product.id);

    // Prepends current product
    const summaryItem = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      discount_price: product.discount_price,
      image_path: product.image_path || (product.product_images?.[0]?.image_path) || '/images/placeholder.jpg'
    };

    list.unshift(summaryItem);

    // Keep only last 5 items
    if (list.length > 5) {
      list = list.slice(0, 5);
    }

    localStorage.setItem('anant_arts_recently_viewed', JSON.stringify(list));
  } catch (e) {
    console.error('Error logging recently viewed:', e);
  }
}

// Client Component Logger
export function RecentlyViewedLogger({ product }) {
  useEffect(() => {
    logRecentlyViewed(product);
  }, [product]);

  return null;
}

export default function RecentlyViewed({ currentProductId }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('anant_arts_recently_viewed');
      if (raw) {
        let list = JSON.parse(raw);
        // Exclude the current product being viewed
        if (currentProductId) {
          list = list.filter(item => item.id !== currentProductId);
        }
        setItems(list.slice(0, 4)); // Display top 4 items
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentProductId]);

  if (items.length === 0) return null;

  return (
    <div style={{ marginTop: '5rem', borderTop: '1px solid var(--primary-gold-border)', paddingTop: '4rem' }}>
      <div className="section-heading" style={{ marginBottom: '2.5rem' }}>
        <h2>Recently Viewed</h2>
        <div className="gold-line"></div>
        <p>Pick up where you left off from your search.</p>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        {items.map((item) => {
          const activePrice = item.discount_price > 0 ? item.discount_price : item.price;
          return (
            <div 
              key={item.id} 
              className="luxury-shimmer"
              style={{
                background: 'white',
                border: '1px solid var(--primary-gold-border)',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '310px'
              }}
            >
              <div>
                <div style={{ height: '140px', overflow: 'hidden', borderRadius: '4px', marginBottom: '12px' }}>
                  <img 
                    src={item.image_path} 
                    alt={item.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                </div>
                <h4 style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  height: '38px',
                  overflow: 'hidden',
                  lineHeight: '1.4',
                  margin: '0 0 8px 0',
                  color: 'var(--text-dark)'
                }}>
                  {item.name}
                </h4>
              </div>

              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '12px' }}>
                  {formatPrice(activePrice)}
                  {item.discount_price > 0 && (
                    <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--text-muted)', marginLeft: '6px' }}>
                      {formatPrice(item.price)}
                    </span>
                  )}
                </div>

                <Link 
                  href={`/product/${item.slug}`} 
                  className="btn-outline-gold" 
                  style={{ width: '100%', padding: '6px', fontSize: '0.75rem', justifyContent: 'center' }}
                >
                  View Details
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
