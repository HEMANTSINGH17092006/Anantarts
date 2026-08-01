'use client';
import { formatPrice } from '@/lib/utils';
import { useState } from 'react';

export default function StickyPurchaseBar({ product, visible, onAddToCart, onBuyNow }) {
  const [adding, setAdding] = useState(false);

  if (!product) return null;

  const activePrice = product.discount_price && product.discount_price > 0 ? product.discount_price : product.price;

  const handleCart = (e) => {
    setAdding(true);
    onAddToCart(e);
    setTimeout(() => setAdding(false), 800);
  };

  return (
    <div className={`sticky-purchase-bar ${visible ? 'visible' : ''}`}>
      <div className="sticky-purchase-container">
        <div className="sticky-purchase-info">
          <img 
            src={product.images?.[0]?.image_path || product.image_path || '/images/placeholder.jpg'} 
            alt={product.name} 
            className="sticky-purchase-img"
          />
          <div className="sticky-purchase-details">
            <h4>{product.name}</h4>
            <div className="sticky-purchase-price">
              <span className="price-active">{formatPrice(activePrice)}</span>
              {product.discount_price > 0 && (
                <span className="price-original">{formatPrice(product.price)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="sticky-purchase-actions">
          <button 
            onClick={handleCart} 
            className="btn-outline-gold"
            disabled={product.stock_quantity <= 0}
            style={{ padding: '10px 20px', fontSize: '0.85rem' }}
          >
            <i className="fas fa-shopping-bag"></i> {adding ? 'Added!' : 'Add to Cart'}
          </button>
          
          <button 
            onClick={onBuyNow} 
            className="btn-saffron"
            disabled={product.stock_quantity <= 0}
            style={{ padding: '10px 24px', fontSize: '0.85rem' }}
          >
            <i className="fas fa-bolt"></i> Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
