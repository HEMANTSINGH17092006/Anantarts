'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '../context/AppContext';

export default function MobileBottomNav({ onCartClick, onMenuClick }) {
  const pathname = usePathname();
  const { cartCount } = useCart();

  return (
    <div 
      className="mobile-bottom-navbar"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '62px',
        backgroundColor: '#191512',
        borderTop: '1px solid rgba(212, 175, 55, 0.3)',
        zIndex: 9990,
        display: 'none', // Controlled via CSS media query @media (max-width: 768px) { display: flex; }
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '0 8px',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
        fontFamily: "'Poppins', sans-serif"
      }}
    >
      {/* 1. Home */}
      <Link 
        href="/" 
        style={navItemStyle(pathname === '/')}
      >
        <i className="fas fa-home" style={{ fontSize: '1.15rem' }}></i>
        <span>Home</span>
      </Link>

      {/* 2. Categories Drawer */}
      <button 
        onClick={onMenuClick}
        style={navButtonStyle(pathname.startsWith('/collections') || pathname === '/shop')}
      >
        <i className="fas fa-th-large" style={{ fontSize: '1.15rem' }}></i>
        <span>Categories</span>
      </button>

      {/* 3. Cart */}
      <button 
        onClick={onCartClick} 
        style={navButtonStyle(false)}
      >
        <i className="fas fa-shopping-bag" style={{ fontSize: '1.15rem' }}></i>
        <span>Cart</span>
        {cartCount > 0 && (
          <span style={badgeStyle}>{cartCount}</span>
        )}
      </button>

      {/* 4. Account */}
      <Link 
        href="/account" 
        style={navItemStyle(pathname.startsWith('/account'))}
      >
        <i className="fas fa-user-circle" style={{ fontSize: '1.15rem' }}></i>
        <span>Account</span>
      </Link>
    </div>
  );
}

function navItemStyle(isActive) {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.7)',
    fontSize: '0.72rem',
    textDecoration: 'none',
    fontWeight: isActive ? '600' : '400',
    flex: '1 1 0',
    minWidth: 0
  };
}

function navButtonStyle(isActive) {
  return {
    background: 'none',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.7)',
    fontSize: '0.72rem',
    cursor: 'pointer',
    position: 'relative',
    padding: 0,
    flex: '1 1 0',
    minWidth: 0
  };
}

const badgeStyle = {
  position: 'absolute',
  top: '-4px',
  right: '12px',
  background: '#D4AF37',
  color: '#14110F',
  fontSize: '0.6rem',
  fontWeight: '700',
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};
