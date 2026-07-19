'use client';
import { useCart } from '../context/AppContext';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function CartDrawer({ isOpen, onClose }) {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    subtotal,
    originalSubtotal,
    discount,
    shipping,
    total,
    coupon,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [applying, setApplying] = useState(false);

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

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setApplying(true);
    setCouponError('');
    setCouponSuccess('');
    
    const res = await applyCoupon(couponCode.trim().toUpperCase());
    setApplying(false);
    
    if (res.success) {
      setCouponSuccess(res.message);
      setCouponCode('');
    } else {
      setCouponError(res.message);
    }
  };

  return (
    <div className={`cart-drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="cart-drawer-header">
          <h3>Shopping Bag ({cart.reduce((acc, item) => acc + item.quantity, 0)})</h3>
          <button className="close-drawer-btn" onClick={onClose} aria-label="Close cart">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-drawer-empty" style={{ padding: '60px 32px', textAlign: 'center' }}>
            <div className="empty-icon" style={{ fontSize: '3.5rem', marginBottom: '16px' }}>👜</div>
            <p style={{ fontSize: '0.95rem', color: '#6B6B6B', marginBottom: '24px' }}>Your shopping bag is empty.</p>
            <Link href="/shop" className="btn-gold" onClick={onClose} style={{ display: 'inline-block', padding: '12px 32px', borderRadius: '4px', textDecoration: 'none', fontWeight: '600' }}>
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-drawer-items">
              {cart.map((item) => {
                const activePrice = item.discount_price && item.discount_price > 0 ? item.discount_price : item.price;
                return (
                  <div className="cart-item" key={item.id}>
                    <div className="cart-item-img">
                      <img src={item.image_path} alt={item.name} />
                    </div>
                    <div className="cart-item-details">
                      <h4>{item.name}</h4>
                      <p className="cart-item-sku">SKU: {item.sku || 'N/A'}</p>
                      <div className="cart-item-price">
                        <span className="price-active">{formatPrice(activePrice)}</span>
                        {item.discount_price > 0 && (
                          <span className="price-original">{formatPrice(item.price)}</span>
                        )}
                      </div>
                      <div className="cart-item-quantity">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <i className="fas fa-minus"></i>
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= (item.stock_quantity ?? 99)}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                    </div>
                    <button
                      className="cart-item-remove"
                      onClick={() => removeFromCart(item.id)}
                      aria-label="Remove item"
                    >
                      <i className="far fa-trash-alt"></i>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="cart-drawer-summary">
              {/* Coupon form */}
              <div className="cart-coupon-section">
                {coupon ? (
                  <div className="coupon-active-badge">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fas fa-check-circle" style={{ fontSize: '0.95rem' }}></i>
                      <span>
                        Coupon <strong>{coupon.code}</strong> applied ({coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${formatPrice(coupon.discount_value)}`} Off)
                      </span>
                    </span>
                    <button onClick={removeCoupon} className="remove-coupon-btn">
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="coupon-form-drawer">
                    <input
                      type="text"
                      placeholder="ENTER PROMO CODE"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="coupon-input-drawer"
                    />
                    <button type="submit" className="coupon-btn-drawer" disabled={applying}>
                      {applying ? '...' : 'Apply'}
                    </button>
                  </form>
                )}
                {couponError && <p className="coupon-error-msg" style={{ color: 'var(--danger)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>{couponError}</p>}
                {couponSuccess && <p className="coupon-success-msg" style={{ color: 'var(--success)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>{couponSuccess}</p>}
              </div>

              {/* Price Details */}
              <div className="price-breakdown">
                <div className="price-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="price-row discount-row">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="price-row">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                <hr className="summary-divider" />
                <div className="price-row total-row">
                  <span>Total Amount</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Premium Trust Badges */}
              <div className="cart-trust-badges">
                <div className="trust-badge-item">
                  <i className="fas fa-shield-alt"></i>
                  <span>Secure Checkout</span>
                </div>
                <div className="trust-badge-item">
                  <i className="fas fa-gift"></i>
                  <span>Premium Packaging</span>
                </div>
                <div className="trust-badge-item">
                  <i className="fas fa-credit-card"></i>
                  <span>Safe Payments</span>
                </div>
                <div className="trust-badge-item">
                  <i className="fas fa-undo"></i>
                  <span>Easy Returns</span>
                </div>
              </div>

              <div className="cart-drawer-checkout-btn">
                {shipping > 0 ? (
                  <div className="shipping-progress-container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-dark)' }}>
                      <span>Free Shipping Unlocks at {formatPrice(10000)}</span>
                      <span>Add {formatPrice(10000 - subtotal)}</span>
                    </div>
                    <div className="shipping-progress-bar-bg">
                      <div className="shipping-progress-bar-fill" style={{ width: `${Math.min(100, (subtotal / 10000) * 100)}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="shipping-progress-container" style={{ background: 'rgba(46, 125, 50, 0.05)', borderColor: 'rgba(46, 125, 50, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: '700', color: 'var(--success)' }}>
                      <i className="fas fa-truck-fast"></i> You have unlocked FREE Shipping!
                    </div>
                  </div>
                )}
                
                <Link href="/checkout" className="btn-gold" onClick={onClose} style={{ width: '100%', textDecoration: 'none' }}>
                  Secure Checkout <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
