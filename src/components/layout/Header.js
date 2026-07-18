'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useCart, useWishlist } from '../context/AppContext';

export default function Header({ settings = {}, onCartClick }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  const siteName = settings.site_name || 'Anant Arts';
  const tagline = settings.site_tagline || 'Bringing Divine Art to Every Home';

  return (
    <>
      {/* Announcement Bar */}
      <div className="announcement-bar">
        <div className="announcement-container">
          <div className="announcement-item">🪷 FREE INSURED SHIPPING ON ORDERS ABOVE ₹10,000</div>
          <div className="announcement-item">✨ 100% SECURE MULTI-LAYER WOODEN CRATE PACKAGING</div>
          <div className="announcement-item">⚜️ 24K GOLD & STERLING SILVER ELECTROPLATED MASTERPIECES</div>
          {/* Repeat for seamless loop */}
          <div className="announcement-item">🪷 FREE INSURED SHIPPING ON ORDERS ABOVE ₹10,000</div>
          <div className="announcement-item">✨ 100% SECURE MULTI-LAYER WOODEN CRATE PACKAGING</div>
        </div>
      </div>

      <header className="site-header">
        <div className="header-container">
          <Link href="/" className="logo-group" onClick={() => setMobileOpen(false)}>
            <img src="/uploads/logo.png" alt="Anant Arts Logo" style={{ height: '48px', width: 'auto' }} onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="logo-text">
              <h1>{siteName}</h1>
              <span>{tagline}</span>
            </div>
          </Link>

          <nav className={`main-nav ${mobileOpen ? 'open' : ''}`}>
            <ul>
              <li><Link href="/" onClick={() => setMobileOpen(false)}>Home</Link></li>
              <li><Link href="/shop" onClick={() => setMobileOpen(false)}>Shop All Idols</Link></li>
              <li><Link href="/corporate-gifts" onClick={() => setMobileOpen(false)}>Corporate Gifts</Link></li>
              <li><Link href="/blog" onClick={() => setMobileOpen(false)}>Artisan Blogs</Link></li>
              <li><Link href="/about" onClick={() => setMobileOpen(false)}>Our Story</Link></li>
              <li><Link href="/contact" onClick={() => setMobileOpen(false)}>Contact</Link></li>
            </ul>
          </nav>

          <div className="header-actions">
            <Link href="/shop" className="header-icon" aria-label="Search">
              <i className="fas fa-search"></i>
            </Link>
            <Link href="/shop?wishlist=true" className="header-icon" aria-label="Wishlist">
              <i className="far fa-heart"></i>
              {wishlistCount > 0 && <span className="cart-count" style={{ backgroundColor: 'var(--primary-gold)' }}>{wishlistCount}</span>}
            </Link>
            <button className="header-icon" onClick={onCartClick} aria-label="Cart">
              <i className="fas fa-shopping-bag"></i>
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </button>
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              style={{ display: 'block' }}
            >
              <i className={`fas ${mobileOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
