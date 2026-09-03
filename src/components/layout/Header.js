'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart, useWishlist } from '../context/AppContext';
import MegaMenu from './MegaMenu';

const ANNOUNCEMENTS = [
  '✨ Luxury 24K Gold Electroplated Idols & Spiritual Masterpieces',
  '📦 Free Insured All-India Express Delivery & Secure Packaging',
  '🪵 Authentic Hand-Carved Teakwood & Brass Heritage Decor'
];

export default function Header({ settings = {}, onCartClick, onSearchClick, onWishlistClick, onMenuClick, activeDrawer }) {
  const pathname = usePathname();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [announcementIdx, setAnnouncementIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIdx((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const siteName = settings.site_name || 'Anant Arts';
  const tagline = settings.site_tagline || 'Spiritual Luxury & Divine Handicrafts';

  return (
    <>
      {/* Top Announcement Bar (Issue #9: Rotating low-noise message) */}
      <div className="announcement-bar">
        <div className="announcement-container">
          <div className="announcement-item" style={{ transition: 'opacity 0.4s ease' }}>
            {ANNOUNCEMENTS[announcementIdx]}
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-container">
          
          {/* Logo Group */}
          <Link href="/" className="logo-group">
            <img src="/uploads/logo.png" alt="Anant Arts Logo" className="header-logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="logo-text">
              <span className="header-site-title">{siteName}</span>
              <span className="header-site-tagline">{tagline}</span>
            </div>
          </Link>

          {/* CENTERED DESKTOP NAVIGATION */}
          <nav className="main-nav">
            <ul style={{ display: 'flex', gap: '32px', alignItems: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
              
              {/* 1. Home */}
              <li>
                <Link 
                  href="/" 
                  className={`nav-link-item ${pathname === '/' ? 'active' : ''}`}
                >
                  <span>Home</span>
                </Link>
              </li>

              {/* 2. All Products */}
              <li>
                <Link 
                  href="/shop" 
                  className={`nav-link-item ${pathname === '/shop' ? 'active' : ''}`}
                >
                  <span>Shop Catalog</span>
                </Link>
              </li>

              {/* 3. Categories (Mega Menu Trigger - Issue #23: Aligned baseline) */}
              <li 
                onMouseEnter={() => setMegaMenuOpen(true)}
                onMouseLeave={() => setMegaMenuOpen(false)}
                style={{ position: 'relative' }}
              >
                <button 
                  onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                  className={`nav-link-item ${megaMenuOpen || pathname.startsWith('/collections') ? 'active' : ''}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    lineHeight: 'inherit',
                    margin: 0,
                    verticalAlign: 'middle'
                  }}
                >
                  <span>Collections</span>
                  <i className={`fas fa-chevron-${megaMenuOpen ? 'up' : 'down'}`} style={{ fontSize: '0.7rem', color: '#D4AF37' }}></i>
                </button>

                {/* Categories Mega Menu Dropdown */}
                <MegaMenu isOpen={megaMenuOpen} onClose={() => setMegaMenuOpen(false)} />
              </li>

              {/* 4. Corporate Gifts */}
              <li>
                <Link 
                  href="/corporate-gifts" 
                  className={`nav-link-item ${pathname === '/corporate-gifts' ? 'active' : ''}`}
                >
                  <span>Corporate Gifts</span>
                </Link>
              </li>

              {/* 5. About */}
              <li>
                <Link 
                  href="/about" 
                  className={`nav-link-item ${pathname === '/about' ? 'active' : ''}`}
                >
                  <span>Our Heritage</span>
                </Link>
              </li>

            </ul>
          </nav>

          {/* RIGHT SIDE ACTION ICONS */}
          <div className="header-actions">
            {/* Search Icon (Always present) */}
            <button className="header-icon" onClick={onSearchClick} aria-label="Search" title="Search Idols & Decor">
              <i className="fas fa-search"></i>
            </button>

            {/* Desktop Only Icons (Unmounted on mobile <=768px) */}
            {!isMobile && (
              <>
                <button className="header-icon desktop-only-icon" onClick={onWishlistClick} aria-label="Wishlist" title="View Wishlist" style={{ position: 'relative' }}>
                  <i className="far fa-heart"></i>
                  {wishlistCount > 0 && <span className="cart-count">{wishlistCount}</span>}
                </button>

                <Link href="/account" className="header-icon desktop-only-icon" aria-label="My Account" title="My Account">
                  <i className="fas fa-user-circle"></i>
                </Link>

                <button className="header-icon desktop-only-icon" onClick={onCartClick} aria-label="Cart" title="View Shopping Bag" style={{ position: 'relative' }}>
                  <i className="fas fa-shopping-bag"></i>
                  {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
                </button>
              </>
            )}

            {/* Mobile Hamburger Menu Icon (Always present on mobile) */}
            <button
              className="mobile-menu-btn"
              onClick={onMenuClick}
              aria-label="Toggle menu"
            >
              <i className={`fas ${activeDrawer === 'menu' ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

