'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart, useWishlist } from '../context/AppContext';
import { formatPrice, calcDiscount } from '@/lib/utils';

export default function ProductCard({ product, isListView = false, onCompareClick }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
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
    if (typeof product.tags === 'string') {
      tags = product.tags.split(',').map(t => t.trim());
    }
  }

  const isBestSeller = product.is_bestseller === 1 || tags.includes('Best Seller') || tags.includes('Featured');
  const isNewArrival = product.is_new_arrival === 1 || tags.includes('New Arrival') || tags.includes('New');
  const isLimited = tags.includes('Limited Edition') || tags.includes('Collector');

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    addToCart(product, 1);
    setTimeout(() => setAdding(false), 800);
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    router.push('/checkout');
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

  const handleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onCompareClick) {
      onCompareClick(product);
    } else {
      setCompareOpen(true);
    }
  };

  return (
    <>
      <div 
        className={`product-card luxury-shimmer ${isListView ? 'list-view-card' : ''}`}
        style={{
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#FFFFFF',
          border: '1px solid var(--primary-gold-border)',
          boxShadow: 'var(--shadow-md)',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          display: isListView ? 'flex' : 'flex',
          flexDirection: isListView ? 'row' : 'column',
          gap: isListView ? '20px' : '0'
        }}
      >
        {/* Wishlist Icon Top Right Inside Image */}
        <button 
          className={`wishlist-badge-btn ${inWish ? 'active' : ''}`}
          onClick={handleWishlist}
          aria-label="Add to wishlist"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.92)',
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

        {/* Badges Top Left Inside Image */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {discountPercent > 0 && (
            <span className="product-badge badge-sale">-{discountPercent}% OFF</span>
          )}
          {isBestSeller && !discountPercent && (
            <span className="product-badge badge-bestseller">Bestseller</span>
          )}
          {isNewArrival && !discountPercent && !isBestSeller && (
            <span className="product-badge badge-new">New</span>
          )}
          {isLimited && (
            <span className="product-badge" style={{ background: '#705814', color: '#FFE494' }}>
              Limited Edition
            </span>
          )}
        </div>

        {/* Product Image Frame (60% height in grid view) */}
        <Link href={`/product/${product.slug}`} className="product-card-link" style={{ flex: isListView ? '0 0 240px' : 'none' }}>
          <div className="product-card-image" style={{ position: 'relative', overflow: 'hidden', height: isListView ? '100%' : '260px', minHeight: '220px' }}>
            <Image 
              src={product.image_path || '/images/placeholder.jpg'} 
              alt={product.name} 
              fill 
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              style={{ objectFit: 'cover' }}
              priority={isBestSeller || isNewArrival}
            />

            {/* Quick Actions Hover Overlay */}
            <div className="product-card-overlay-actions" style={{ zIndex: 3, gap: '8px' }}>
              <button onClick={handleQuickView} className="btn-quickview" title="Quick View" style={{ padding: '8px 12px', fontSize: '0.78rem' }}>
                <i className="fas fa-eye" style={{ marginRight: '4px' }}></i> Quick View
              </button>
              <button onClick={handleCompare} className="btn-quickview" title="Compare" style={{ padding: '8px 12px', fontSize: '0.78rem', background: 'rgba(212,175,55,0.9)' }}>
                <i className="fas fa-columns" style={{ marginRight: '4px' }}></i> Compare
              </button>
            </div>
          </div>
        </Link>

        {/* Product Information Body */}
        <div className="product-card-info" style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Category & Rating */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span className="category-label" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>
                {product.category_name || 'Handcrafted Art'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: '#D4AF37' }}>
                <i className="fas fa-star"></i>
                <span style={{ fontWeight: '700', color: 'var(--text-dark)' }}>4.9</span>
              </div>
            </div>

            {/* Product Title (Max 2 lines) */}
            <Link href={`/product/${product.slug}`}>
              <h3 className="product-card-title" style={{
                fontSize: '0.96rem',
                fontWeight: '600',
                height: '42px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                marginBottom: '6px',
                color: 'var(--text-dark)',
                lineHeight: '1.38'
              }}>{product.name}</h3>
            </Link>

            {/* Material, Dimensions & Stock Status */}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {product.material && <span><i className="fas fa-cube" style={{ fontSize: '0.65rem', marginRight: '3px' }}></i>{product.material.split('&')[0].trim()}</span>}
              {product.dimensions && <span>• {product.dimensions}</span>}
              <span style={{ color: product.stock_quantity > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
                • {product.stock_quantity > 0 ? (product.stock_quantity <= 5 ? `Only ${product.stock_quantity} left` : 'In Stock') : 'Out of Stock'}
              </span>
            </div>

            {/* Price Row */}
            <div className="product-price" style={{ marginBottom: '14px' }}>
              <span className="current" style={{ fontWeight: '700', fontSize: '1.1rem' }}>{formatPrice(activePrice)}</span>
              {product.discount_price > 0 && (
                <>
                  <span className="original">{formatPrice(product.price)}</span>
                  <span className="discount" style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: '600', marginLeft: '6px' }}>
                    ({discountPercent}% OFF)
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={handleAddToCart}
              className="btn-gold" 
              style={{ width: '100%', padding: '10px', fontSize: '0.8rem', justifyContent: 'center', borderRadius: '6px' }}
              disabled={product.stock_quantity <= 0}
            >
              <i className="fas fa-shopping-bag" style={{ marginRight: '6px' }}></i>
              {product.stock_quantity <= 0 ? 'Out of Stock' : adding ? 'Added to Cart!' : 'Add to Cart'}
            </button>

            <button 
              onClick={handleBuyNow}
              className="btn-outline-gold" 
              style={{ width: '100%', padding: '9px', fontSize: '0.78rem', justifyContent: 'center', borderRadius: '6px', color: 'var(--text-dark)', borderColor: 'var(--primary-gold)' }}
              disabled={product.stock_quantity <= 0}
            >
              <i className="fas fa-bolt" style={{ marginRight: '6px', color: '#D4AF37' }}></i> Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewOpen && (
        <div className="admin-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="admin-modal-content" style={{ maxWidth: '800px', width: '90%', padding: '24px', display: 'flex', flexDirection: 'row', gap: '24px', flexWrap: 'wrap' }}>
            <span className="modal-close-btn" onClick={() => setQuickViewOpen(false)} style={{ fontSize: '28px', top: '12px', right: '16px' }}>&times;</span>
            
            <div style={{ flex: '1 1 300px', maxWidth: '380px' }}>
              <img src={product.image_path} alt={product.name} style={{ width: '100%', height: 'auto', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }} />
            </div>

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
                  <div><strong>Material:</strong> {product.material || 'Handcrafted Composite'}</div>
                  <div><strong>Dimensions:</strong> {product.dimensions || 'N/A'}</div>
                  <div><strong>Weight:</strong> {product.weight ? `${product.weight} kg` : 'N/A'}</div>
                  <div><strong>SKU:</strong> {product.sku}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={handleAddToCart}
                  className="btn-gold" 
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={product.stock_quantity <= 0}
                >
                  <i className="fas fa-shopping-bag" style={{ marginRight: '6px' }}></i> Add to Cart
                </button>
                <button 
                  onClick={handleBuyNow}
                  className="btn-outline-gold" 
                  style={{ flex: 1, justifyContent: 'center' }}
                  disabled={product.stock_quantity <= 0}
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {compareOpen && (
        <div className="admin-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="admin-modal-content" style={{ maxWidth: '600px', width: '90%', padding: '24px' }}>
            <span className="modal-close-btn" onClick={() => setCompareOpen(false)}>&times;</span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '16px' }}>
              Product Specifications Summary
            </h3>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
              <img src={product.image_path} alt={product.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
              <div>
                <h4 style={{ fontSize: '1rem', margin: '0 0 4px 0' }}>{product.name}</h4>
                <span style={{ fontSize: '0.85rem', color: 'var(--primary-gold)', fontWeight: '700' }}>{formatPrice(activePrice)}</span>
              </div>
            </div>

            <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--bg-cream-dark)' }}>
                  <td style={{ padding: '8px', fontWeight: '600' }}>Category</td>
                  <td style={{ padding: '8px' }}>{product.category_name || 'Handcrafted Art'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--bg-cream-dark)' }}>
                  <td style={{ padding: '8px', fontWeight: '600' }}>Material</td>
                  <td style={{ padding: '8px' }}>{product.material || 'N/A'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--bg-cream-dark)' }}>
                  <td style={{ padding: '8px', fontWeight: '600' }}>Dimensions</td>
                  <td style={{ padding: '8px' }}>{product.dimensions || 'N/A'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--bg-cream-dark)' }}>
                  <td style={{ padding: '8px', fontWeight: '600' }}>Weight</td>
                  <td style={{ padding: '8px' }}>{product.weight ? `${product.weight} kg` : 'N/A'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: '600' }}>SKU</td>
                  <td style={{ padding: '8px' }}>{product.sku}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button onClick={() => setCompareOpen(false)} className="btn-gold" style={{ padding: '8px 20px', fontSize: '0.8rem' }}>
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
