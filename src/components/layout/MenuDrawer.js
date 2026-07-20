'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MenuDrawer({ isOpen, onClose }) {
  const pathname = usePathname();

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

  if (!isOpen) return null;

  return (
    <div className="cart-drawer-overlay open" onClick={onClose} style={{ zIndex: 10000 }}>
      <div 
        className="menu-drawer open" 
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '320px',
          maxWidth: '85vw',
          height: '100vh',
          height: '100dvh',
          background: '#111111',
          color: '#FFFFFF',
          zIndex: 10001,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '10px 0 40px rgba(0,0,0,0.5)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          fontFamily: "'Poppins', sans-serif"
        }}
      >
        {/* Header */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.08) 0%, rgba(0,0,0,0) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/uploads/logo.png" alt="Anant Arts" style={{ height: '40px', width: 'auto' }} onError={(e) => { e.target.style.display = 'none'; }} />
            <div>
              <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#D4AF37', fontWeight: '700' }}>Anant Arts</h3>
              <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '1px', textTransform: 'uppercase' }}>Divine Electroplated Idols</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close menu"
            style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer', padding: '8px' }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Navigation Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Links */}
          <div>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#D4AF37', fontWeight: '700', display: 'block', marginBottom: '12px', paddingLeft: '8px' }}>
              Collection &amp; Services
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link href="/" onClick={onClose} style={linkStyle(pathname === '/')}>
                <i className="fas fa-home" style={{ width: '24px', color: '#D4AF37' }}></i> Home
              </Link>
              <Link href="/shop" onClick={onClose} style={linkStyle(pathname === '/shop')}>
                <i className="fas fa-gem" style={{ width: '24px', color: '#D4AF37' }}></i> Shop All Idols
              </Link>
              <Link href="/consultation" onClick={onClose} style={linkStyle(pathname === '/consultation')}>
                <i className="fas fa-compass" style={{ width: '24px', color: '#D4AF37' }}></i> Vastu Consultation
              </Link>
              <Link href="/corporate-gifts" onClick={onClose} style={linkStyle(pathname === '/corporate-gifts')}>
                <i className="fas fa-gift" style={{ width: '24px', color: '#D4AF37' }}></i> Corporate Gifts
              </Link>
              <Link href="/blog" onClick={onClose} style={linkStyle(pathname === '/blog')}>
                <i className="fas fa-feather-alt" style={{ width: '24px', color: '#D4AF37' }}></i> Artisan Blogs
              </Link>
            </div>
          </div>

          {/* Customer Support */}
          <div>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#D4AF37', fontWeight: '700', display: 'block', marginBottom: '12px', paddingLeft: '8px' }}>
              Customer Support
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link href="/order-tracking" onClick={onClose} style={linkStyle(pathname === '/order-tracking')}>
                <i className="fas fa-truck-fast" style={{ width: '24px', color: '#D4AF37' }}></i> Track Shipment
              </Link>
              <Link href="/account" onClick={onClose} style={linkStyle(pathname.startsWith('/account'))}>
                <i className="fas fa-user-circle" style={{ width: '24px', color: '#D4AF37' }}></i> My Account
              </Link>
              <Link href="/contact" onClick={onClose} style={linkStyle(pathname === '/contact')}>
                <i className="fas fa-headset" style={{ width: '24px', color: '#D4AF37' }}></i> Contact Support
              </Link>
              <Link href="/faq" onClick={onClose} style={linkStyle(pathname === '/faq')}>
                <i className="fas fa-question-circle" style={{ width: '24px', color: '#D4AF37' }}></i> FAQ Helpdesk
              </Link>
            </div>
          </div>

          {/* About & Trust */}
          <div>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#D4AF37', fontWeight: '700', display: 'block', marginBottom: '12px', paddingLeft: '8px' }}>
              About Anant Arts
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <Link href="/about" onClick={onClose} style={linkStyle(pathname === '/about')}>
                <i className="fas fa-[#D4AF37] fa-om" style={{ width: '24px', color: '#D4AF37' }}></i> Our Divine Story
              </Link>
            </div>
          </div>

        </div>

        {/* Footer Contact */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.4)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
          <p style={{ margin: 0 }}>📞 +91 72758 19354</p>
          <p style={{ margin: '4px 0 0 0' }}>✉️ anantarts39@gmail.com</p>
        </div>
      </div>
    </div>
  );
}

function linkStyle(isActive) {
  return {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 14px',
    borderRadius: '8px',
    color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.85)',
    background: isActive ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
    fontWeight: isActive ? '600' : '400',
    fontSize: '0.9rem',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
  };
}
