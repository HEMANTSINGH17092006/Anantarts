'use client';
import { useWishlist, useCart } from '../context/AppContext';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { useEffect } from 'react';

export default function WishlistDrawer({ isOpen, onClose }) {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleAddToCart = (product) => {
    addToCart(product);
    // Keep it in wishlist or remove? Let's keep it but show feedback
    alert(`${product.name} added to your shopping bag!`);
  };

  return (
    <div className={`cart-drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="cart-drawer-header">
          <h3>My Wishlist ({wishlist.length})</h3>
          <button className="close-drawer-btn" onClick={onClose} aria-label="Close wishlist">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {wishlist.length === 0 ? (
          <div className="cart-drawer-empty" style={{ padding: '60px 32px', textAlign: 'center' }}>
            <div className="empty-icon" style={{ fontSize: '3.5rem', marginBottom: '16px', color: 'var(--primary-gold)' }}>♡</div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '8px' }}>Your Wishlist is Empty</h3>
            <p style={{ fontSize: '0.88rem', color: '#6B6B6B', marginBottom: '24px', lineHeight: '1.5' }}>
              Browse products and save your favorite idols to view them later.
            </p>
            <Link href="/shop" className="btn-gold" onClick={onClose} style={{ display: 'inline-block', padding: '12px 32px', borderRadius: '4px', textDecoration: 'none', fontWeight: '600' }}>
              Browse Collection
            </Link>
          </div>
        ) : (
          <div className="cart-drawer-items" style={{ flex: 1, overflowY: 'auto' }}>
            {wishlist.map((item) => {
              const activePrice = item.discount_price && item.discount_price > 0 ? item.discount_price : item.price;
              return (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item-img">
                    <img src={item.image_path} alt={item.name} />
                  </div>
                  <div className="cart-item-details" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: '600' }}>{item.name}</h4>
                    <div className="cart-item-price" style={{ margin: 0 }}>
                      <span className="price-active">{formatPrice(activePrice)}</span>
                      {item.discount_price > 0 && (
                        <span className="price-original" style={{ fontSize: '0.75rem' }}>{formatPrice(item.price)}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="btn-gold"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.72rem',
                        marginTop: '6px',
                        width: 'fit-content',
                        borderRadius: '4px'
                      }}
                    >
                      Add To Cart
                    </button>
                  </div>
                  <button
                    className="cart-item-remove"
                    onClick={() => removeFromWishlist(item.id)}
                    aria-label="Remove item"
                  >
                    <i className="far fa-trash-alt"></i>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
