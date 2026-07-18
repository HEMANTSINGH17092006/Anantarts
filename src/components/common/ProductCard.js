'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart, useWishlist } from '../context/AppContext';
import { formatPrice, calcDiscount } from '@/lib/utils';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const activePrice = product.discount_price && product.discount_price > 0 ? product.discount_price : product.price;
  const discountPercent = calcDiscount(product.price, product.discount_price);
  const inWish = isInWishlist(product.id);

  // Parse tags
  let tags = [];
  try {
    if (product.tags) {
      tags = typeof product.tags === 'string' ? JSON.parse(product.tags) : product.tags;
    }
  } catch (e) {
    // If it's a comma-separated string
    if (typeof product.tags === 'string') {
      tags = product.tags.split(',').map(t => t.trim());
    }
  }

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    addToCart(product, 1);
    setTimeout(() => setAdding(false), 800);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  return (
    <>
      <div className="product-card luxury-shimmer">
        {/* Wishlist Button (Desktop Only) */}
        <button 
          className={`wishlist-badge-btn desktop-wishlist-btn ${inWish ? 'active' : ''}`}
          onClick={handleWishlist}
          aria-label="Add to wishlist"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid var(--primary-gold-border)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: inWish ? '#E74C3C' : 'var(--text-dark)',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <i className={inWish ? "fas fa-heart" : "far fa-heart"}></i>
        </button>

        {/* Promo Badge */}
        {discountPercent > 0 && (
          <span className="product-badge badge-sale">-{discountPercent}% OFF</span>
        )}
        {!discountPercent && tags.includes('Best Seller') && (
          <span className="product-badge badge-bestseller">Best Seller</span>
        )}
        {!discountPercent && tags.includes('New Arrival') && (
          <span className="product-badge badge-new">New</span>
        )}

        <Link href={`/product/${product.slug}`} className="product-card-link">
          <div className="product-card-image" style={{ position: 'relative', overflow: 'hidden' }}>
            <Image 
              src={product.image_path} 
              alt={product.name} 
              fill 
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
              style={{ objectFit: 'cover' }}
              priority={tags.includes('Best Seller') || tags.includes('New Arrival')}
            />
            <div className="product-card-overlay-actions" style={{ zIndex: 2 }}>
              <button onClick={handleQuickView} className="btn-quickview" style={{
                padding: '8px 16px',
                backgroundColor: 'rgba(30, 26, 23, 0.9)',
                color: 'white',
                border: '1px solid var(--primary-gold)',
                borderRadius: '4px',
                fontSize: '0.78rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>
                <i className="fas fa-eye" style={{ marginRight: '6px' }}></i> Quick View
              </button>
            </div>
          </div>
        </Link>

        <div className="product-card-info">
          <span className="category-label">{product.category_name || 'Spiritual Sculpture'}</span>
          <Link href={`/product/${product.slug}`}>
            <h3 className="product-card-title" style={{
              fontSize: '0.95rem',
              fontWeight: '600',
              height: '42px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              marginBottom: '8px'
            }}>{product.name}</h3>
          </Link>

          {/* Rating (⭐ 4.9) - Mobile Only via display:none toggled to flex */}
          <div className="mobile-only-rating" style={{ display: 'none', margin: '4px 0 8px 0', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
            <span style={{ color: '#D4AF37' }}>★★★★★</span>
            <span style={{ fontWeight: '700', color: 'var(--text-dark)', marginLeft: '4px' }}>4.9</span>
          </div>

          {/* Short Description - Mobile Only */}
          <p className="mobile-only-desc" style={{ display: 'none', fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 12px 0', lineHeight: '1.4' }}>
            {product.description ? (product.description.slice(0, 120) + '...') : 'Premium electroplated spiritual sculpture, handcrafted with 24K gold highlights by master artisans.'}
          </p>
          
          <div className="product-price">
            <span className="current">{formatPrice(activePrice)}</span>
            {product.discount_price > 0 && (
              <>
                <span className="original">{formatPrice(product.price)}</span>
                <span className="discount" style={{ fontSize: '0.76rem', color: 'var(--success)', fontWeight: '600', marginLeft: '6px' }}>
                  ({discountPercent}% OFF)
                </span>
              </>
            )}
          </div>

          <div className="product-card-actions" style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            {/* Wishlist Button (Mobile Only) */}
            <button 
              onClick={handleWishlist}
              className={`btn-wishlist-mobile ${inWish ? 'active' : ''}`}
              style={{
                display: 'none',
                width: '46px',
                height: '42px',
                alignItems: 'center',
                justifyContent: 'center',
                background: inWish ? 'rgba(231, 76, 60, 0.1)' : 'white',
                border: inWish ? '1.5px solid #E74C3C' : '1.5px solid var(--primary-gold-border)',
                borderRadius: '8px',
                color: inWish ? '#E74C3C' : 'var(--text-muted)',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              aria-label="Add to wishlist"
            >
              <i className={inWish ? "fas fa-heart" : "far fa-heart"}></i>
            </button>

            <button 
              onClick={handleAddToCart}
              className="btn-gold" 
              style={{ flex: 1, padding: '10px', fontSize: '0.8rem', justifyContent: 'center', minHeight: '42px', borderRadius: '8px' }}
              disabled={product.stock_quantity <= 0}
            >
              <i className="fas fa-shopping-bag" style={{ marginRight: '6px' }}></i>
              {product.stock_quantity <= 0 ? 'Out of Stock' : adding ? 'Added!' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewOpen && (
        <div className="admin-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="admin-modal-content" style={{ maxWidth: '800px', width: '90%', padding: '24px', display: 'flex', flexDirection: 'row', gap: '24px', flexWrap: 'wrap' }}>
            <span className="modal-close-btn" onClick={() => setQuickViewOpen(false)} style={{ fontSize: '28px', top: '12px', right: '16px' }}>&times;</span>
            
            {/* Modal Left Image */}
            <div style={{ flex: '1 1 300px', maxWidth: '380px' }}>
              <img src={product.image_path} alt={product.name} style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }} />
            </div>

            {/* Modal Right Info */}
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <span className="category-label">{product.category_name}</span>
                <h2 style={{ fontSize: '1.4rem', margin: '8px 0 12px 0' }}>{product.name}</h2>
                <div className="product-price" style={{ marginBottom: '16px' }}>
                  <span className="current" style={{ fontSize: '1.5rem' }}>{formatPrice(activePrice)}</span>
                  {product.discount_price > 0 && (
                    <span className="original" style={{ fontSize: '1.1rem' }}>{formatPrice(product.price)}</span>
                  )}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '16px' }}>
                  {product.description ? (product.description.slice(0, 180) + '...') : ''}
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem', color: 'var(--text-dark)', marginBottom: '20px' }}>
                  <div><strong>Material:</strong> {product.material || 'Brass & Gold Electoplate'}</div>
                  <div><strong>Dimensions:</strong> {product.dimensions || 'N/A'}</div>
                  <div><strong>Weight:</strong> {product.weight ? `${product.weight} kg` : 'N/A'}</div>
                  <div><strong>SKU:</strong> {product.sku}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={handleAddToCart}
                  className="btn-gold" 
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={product.stock_quantity <= 0}
                >
                  <i className="fas fa-shopping-bag" style={{ marginRight: '8px' }}></i>
                  {product.stock_quantity <= 0 ? 'Out of Stock' : adding ? 'Added to Bag!' : 'Add to Bag'}
                </button>
                <Link href={`/product/${product.slug}`} onClick={() => setQuickViewOpen(false)} className="btn-outline-gold" style={{ justifyContent: 'center', padding: '0.85rem 1.5rem' }}>
                  Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
