'use client';
import { useState } from 'react';
import { useCart } from '../context/AppContext';
import { useRouter } from 'next/navigation';

export default function AddToCartButton({ product }) {
  const { addToCart } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const handleQtyChange = (val) => {
    const stock = product.stock_quantity ?? 99;
    setQuantity(Math.max(1, Math.min(val, stock)));
  };

  const handleAdd = () => {
    if (product.stock_quantity <= 0) return;
    setAdding(true);
    addToCart(product, quantity);
    setTimeout(() => setAdding(false), 1000);
  };

  const handleBuyNow = () => {
    if (product.stock_quantity <= 0) return;
    addToCart(product, quantity);
    router.push('/checkout');
  };

  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
      
      {/* Quantity Picker */}
      {!isOutOfStock && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>Quantity:</span>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid var(--primary-gold-border)',
            borderRadius: '4px',
            background: 'white',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => handleQtyChange(quantity - 1)}
              style={{ padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <i className="fas fa-minus" style={{ fontSize: '0.75rem' }}></i>
            </button>
            <span style={{ padding: '0 12px', fontSize: '0.9rem', fontWeight: '600' }}>{quantity}</span>
            <button
              onClick={() => handleQtyChange(quantity + 1)}
              style={{ padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer' }}
            >
              <i className="fas fa-plus" style={{ fontSize: '0.75rem' }}></i>
            </button>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={handleAdd}
          disabled={isOutOfStock}
          className="btn-outline-gold"
          style={{
            flex: '1 1 180px',
            justifyContent: 'center',
            padding: '12px 24px',
            fontSize: '0.85rem',
            opacity: isOutOfStock ? 0.6 : 1,
            cursor: isOutOfStock ? 'not-allowed' : 'pointer'
          }}
        >
          <i className="fas fa-shopping-bag" style={{ marginRight: '8px' }}></i>
          {isOutOfStock ? 'Out of Stock' : adding ? 'Added to Bag!' : 'Add to Bag'}
        </button>

        <button
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          className="btn-gold"
          style={{
            flex: '1 1 180px',
            justifyContent: 'center',
            padding: '12px 24px',
            fontSize: '0.85rem',
            opacity: isOutOfStock ? 0.6 : 1,
            cursor: isOutOfStock ? 'not-allowed' : 'pointer'
          }}
        >
          <i className="fas fa-bolt" style={{ marginRight: '8px' }}></i>
          {isOutOfStock ? 'Out of Stock' : 'Buy It Now'}
        </button>
      </div>

      {/* Sticky Bottom Bar for Mobile View */}
      {!isOutOfStock && (
        <div className="mobile-sticky-buy-bar" style={{
          position: 'fixed',
          bottom: '60px',
          left: 0,
          width: '100%',
          backgroundColor: 'white',
          borderTop: '1.5px solid var(--primary-gold-border)',
          padding: '10px 16px',
          boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
          zIndex: 999,
          display: 'none',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dark)', fontWeight: '600', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</p>
              <p style={{ fontSize: '0.88rem', fontWeight: '700', margin: '2px 0 0 0', color: 'var(--primary-gold-hover)' }}>
                {product.discount_price > 0 ? formatPrice(product.discount_price) : formatPrice(product.price)}
              </p>
            </div>
            <button
              onClick={handleAdd}
              className="btn-gold"
              style={{ flex: '0 0 140px', padding: '10px', fontSize: '0.8rem', borderRadius: '6px', justifyContent: 'center', minHeight: '38px' }}
            >
              {adding ? 'Added!' : 'Add to Cart'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { formatPrice } from '@/lib/utils';

