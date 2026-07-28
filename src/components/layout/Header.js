'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart, useWishlist } from '../context/AppContext';
import MegaMenu from './MegaMenu';

export default function Header({ settings = {}, onCartClick, onSearchClick, onWishlistClick, onMenuClick, activeDrawer }) {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);

  const siteName = settings.site_name || 'Anant Arts';
  const tagline = settings.site_tagline || 'Premium Handcrafted Lifestyle';

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="announcement-bar">
        <div className="announcement-container">
          <div className="announcement-item">✨ LUXURY HANDCRAFTED LIFESTYLE, HOME DÉCOR &amp; GIFTING DESTINATION</div>
          <div className="announcement-item">⚜️ 24K GOLD &amp; STERLING SILVER ELECTROPLATED MASTERPIECES</div>
          <div className="announcement-item">📦 FREE INSURED SHIPPING ON ORDERS ABOVE ₹10,000</div>
          <div className="announcement-item">🪵 HAND-CARVED WOODEN HANDICRAFTS &amp; CUSTOM GIFTS</div>
          {/* Repeat for seamless loop */}
          <div className="announcement-item">✨ LUXURY HANDCRAFTED LIFESTYLE, HOME DÉCOR &amp; GIFTING DESTINATION</div>
          <div className="announcement-item">⚜️ 24K GOLD &amp; STERLING SILVER ELECTROPLATED MASTERPIECES</div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="site-header">
        <div className="header-container">
          
          {/* Logo Group */}
          <Link href="/" className="logo-group">
            <img src="/uploads/logo.png" alt="Anant Arts Logo" className="header-logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="logo-text">
              <h1 className="header-site-title">{siteName}</h1>
              <span className="header-site-tagline">{tagline}</span>
            </div>
          </Link>

          {/* CENTERED DESKTOP NAVIGATION */}
          <nav className="main-nav">
            <ul style={{ display: 'flex', gap: '44px', alignItems: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
              
              {/* 1. Home */}
              <li>
                <Link 
                  href="/" 
                  className={`nav-link-item ${pathname === '/' ? 'active' : ''}`}
                >
                  <span>🏠 Home</span>
                </Link>
              </li>

              {/* 2. All Products */}
              <li>
                <Link 
                  href="/shop" 
                  className={`nav-link-item ${pathname === '/shop' ? 'active' : ''}`}
                >
                  <span>🛍 All Products</span>
                </Link>
              </li>

              {/* 3. Categories (Mega Menu Trigger) */}
              <li 
                onMouseEnter={() => setMegaMenuOpen(true)}
                style={{ position: 'relative' }}
              >
                <button 
                  onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                  className={`nav-link-item ${megaMenuOpen || pathname.startsWith('/collections') ? 'active' : ''}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: 0 }}
                >
                  <span>📂 Categories</span>
                  <i className={`fas fa-chevron-${megaMenuOpen ? 'up' : 'down'}`} style={{ fontSize: '0.7rem', color: '#D4AF37' }}></i>
                </button>
              </li>

            </ul>
          </nav>

          {/* RIGHT SIDE ACTION ICONS */}
          <div className="header-actions">
            <button className="header-icon" onClick={onSearchClick} aria-label="Search">
              <i className="fas fa-search"></i>
            </button>

            <button className="header-icon" onClick={onWishlistClick} aria-label="Wishlist" style={{ position: 'relative' }}>
              <i className="far fa-heart"></i>
              {wishlistCount > 0 && <span className="cart-count">{wishlistCount}</span>}
            </button>

            <Link href="/account" className="header-icon" aria-label="My Account">
              <i className="fas fa-user-circle"></i>
            </Link>

            <button className="header-icon" onClick={onCartClick} aria-label="Cart" style={{ position: 'relative' }}>
              <i className="fas fa-shopping-bag"></i>
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </button>

            <button
              className="mobile-menu-btn"
              onClick={onMenuClick}
              aria-label="Toggle menu"
            >
              <i className={`fas ${activeDrawer === 'menu' ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
          </div>
        </div>

        {/* Categories Mega Menu Dropdown */}
        <MegaMenu isOpen={megaMenuOpen} onClose={() => setMegaMenuOpen(false)} />
      </header>
    </>
  );
}
