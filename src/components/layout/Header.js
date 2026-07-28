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
  const tagline = settings.site_tagline || 'Premium Handcrafted Lifestyle & Gifting';

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
      <header 
        className="site-header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          height: '82px',
          background: 'rgba(18, 14, 12, 0.94)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div className="header-container" style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Logo Group */}
          <Link href="/" className="logo-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, textDecoration: 'none' }}>
            <img src="/uploads/logo.png" alt="Anant Arts Logo" style={{ height: '48px', width: 'auto' }} onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="logo-text">
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', color: '#D4AF37', margin: 0, fontWeight: '700', letterSpacing: '0.5px' }}>{siteName}</h1>
              <span style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.78)', letterSpacing: '0.8px', textTransform: 'uppercase', display: 'block' }}>{tagline}</span>
            </div>
          </Link>

          {/* PERFECTLY CENTERED NAVIGATION (3 HIGH-LEGIBILITY ITEMS ONLY) */}
          <nav className="main-nav" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <ul style={{ display: 'flex', gap: '44px', alignItems: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
              
              {/* 1. Home */}
              <li>
                <Link 
                  href="/" 
                  className={`nav-link-item ${pathname === '/' ? 'active' : ''}`}
                  style={{
                    fontSize: '1.1rem', // 17.5px
                    fontWeight: '700',
                    letterSpacing: '0.8px',
                    color: pathname === '/' ? '#D4AF37' : '#FFFFFF',
                    textDecoration: 'none',
                    position: 'relative',
                    padding: '8px 0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🏠 Home</span>
                </Link>
              </li>

              {/* 2. All Products */}
              <li>
                <Link 
                  href="/shop" 
                  className={`nav-link-item ${pathname === '/shop' ? 'active' : ''}`}
                  style={{
                    fontSize: '1.1rem', // 17.5px
                    fontWeight: '700',
                    letterSpacing: '0.8px',
                    color: pathname === '/shop' ? '#D4AF37' : '#FFFFFF',
                    textDecoration: 'none',
                    position: 'relative',
                    padding: '8px 0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
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
                  style={{
                    background: 'none',
                    border: 'none',
                    fontFamily: 'inherit',
                    fontSize: '1.1rem', // 17.5px
                    fontWeight: '700',
                    letterSpacing: '0.8px',
                    color: megaMenuOpen || pathname.startsWith('/collections') ? '#D4AF37' : '#FFFFFF',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 0'
                  }}
                >
                  <span>📂 Categories</span>
                  <i className={`fas fa-chevron-${megaMenuOpen ? 'up' : 'down'}`} style={{ fontSize: '0.7rem', color: '#D4AF37' }}></i>
                </button>
              </li>

            </ul>
          </nav>

          {/* RIGHT SIDE ACTION ICONS */}
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
            <button className="header-icon" onClick={onSearchClick} aria-label="Search" style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: '1.25rem', cursor: 'pointer' }}>
              <i className="fas fa-search"></i>
            </button>

            <button className="header-icon" onClick={onWishlistClick} aria-label="Wishlist" style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: '1.25rem', cursor: 'pointer', position: 'relative' }}>
              <i className="far fa-heart"></i>
              {wishlistCount > 0 && <span className="cart-count" style={{ backgroundColor: '#D4AF37', color: '#14110F' }}>{wishlistCount}</span>}
            </button>

            <Link href="/account" className="header-icon" aria-label="My Account" style={{ color: '#FFFFFF', fontSize: '1.25rem' }}>
              <i className="fas fa-user-circle"></i>
            </Link>

            <button className="header-icon" onClick={onCartClick} aria-label="Cart" style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: '1.25rem', cursor: 'pointer', position: 'relative' }}>
              <i className="fas fa-shopping-bag"></i>
              {cartCount > 0 && <span className="cart-count" style={{ backgroundColor: '#D4AF37', color: '#14110F' }}>{cartCount}</span>}
            </button>

            <button
              className="mobile-menu-btn"
              onClick={onMenuClick}
              aria-label="Toggle menu"
              style={{ color: '#FFFFFF', fontSize: '1.3rem' }}
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
