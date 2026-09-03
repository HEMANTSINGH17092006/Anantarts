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
      <div className={`product-card luxury-shimmer ${isListView ? 'list-view-card' : ''}`}>
        
        {/* Wishlist Icon Top Right Inside Image */}
        <button 
          className={`wishlist-badge-btn ${inWish ? 'active' : ''}`}
          onClick={handleWishlist}
          aria-label="Add to wishlist"
        >
          <i className={inWish ? "fas fa-heart" : "far fa-heart"}></i>
        </button>

        {/* Badges Top Left Inside Image */}
        <div className="product-badge-group" style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
            <span className="product-badge badge-limited">Limited</span>
          )}
        </div>

        {/* Product Image Frame */}
        <Link href={`/product/${product.slug}`} className="product-card-link">
          <div className="product-card-image">
            <Image 
              src={product.image_path || '/images/placeholder.jpg'} 
              alt={product.name} 
              fill 
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              style={{ objectFit: 'cover' }}
              priority={isBestSeller || isNewArrival}
            />

            {/* Quick Actions Hover Overlay (Issue #10: 44px touch targets) */}
            <div className="product-card-overlay-actions">
              <button onClick={handleQuickView} className="btn-quickview" title="Quick View" aria-label={`Quick view ${product.name}`}>
                <i className="fas fa-eye"></i> View
              </button>
              <button onClick={handleCompare} className="btn-quickview btn-compare-overlay" title="Compare" aria-label={`Compare ${product.name}`}>
                <i className="fas fa-columns"></i> Compare
              </button>
            </div>
          </div>
        </Link>

        {/* Product Information Body (Issue #7: Clear focal point on product title) */}
        <div className="product-card-info" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, padding: '16px' }}>
          <div>
            {/* Category & Rating (Issue #5, #7: Neutral, secondary metadata) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span className="category-label" style={{ color: 'var(--color-text-muted, #6B655B)', fontSize: '0.8rem', fontWeight: '500', textTransform: 'capitalize', letterSpacing: '0.2px' }}>
                {product.category_name || 'Handcrafted'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.8rem', color: '#D4AF37', fontWeight: '700' }}>
                <i className="fas fa-star" style={{ fontSize: '0.75rem' }}></i>
                <span>4.9</span>
              </div>
            </div>

            {/* Product Title (Clear Primary Textual Focal Point) */}
            <Link href={`/product/${product.slug}`} style={{ textDecoration: 'none' }}>
              <h3 className="product-card-title" style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--color-text-primary, #1A1918)', margin: '4px 0 8px 0', lineHeight: 1.35 }}>
                {product.name}
              </h3>
            </Link>

            {/* Price Row */}
            <div className="product-price" style={{ marginBottom: '14px', marginTop: '6px' }}>
              <span className="current" style={{ fontWeight: '700', fontSize: '1.15rem' }}>{formatPrice(activePrice)}</span>
              {product.discount_price > 0 && (
                <>
                  <span className="original">{formatPrice(product.price)}</span>
                  <span className="discount" style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '600', marginLeft: '6px' }}>
                    ({discountPercent}% OFF)
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Button: Dominant Primary CTA with Shopping Bag Icon (Issue #21) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button 
              onClick={handleAddToCart}
              className="btn-gold" 
              style={{ width: '100%', padding: '12px', fontSize: '0.85rem', justifyContent: 'center', borderRadius: 'var(--radius-sm, 6px)', fontWeight: '600' }}
              disabled={product.stock_quantity <= 0}
              aria-label={`Add ${product.name} to Cart`}
            >
              <i className="fas fa-shopping-bag" style={{ marginRight: '8px' }}></i>
              {product.stock_quantity <= 0 ? 'Out of Stock' : adding ? 'Added to Cart!' : 'Add to Cart'}
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
