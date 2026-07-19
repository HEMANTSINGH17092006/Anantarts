'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart, useWishlist } from '../context/AppContext';

export default function Footer({ 
  settings = {}, 
  onCartClick, 
  onSearchClick, 
  onWishlistClick,
  cartOpen = false,
  searchOpen = false,
  wishlistOpen = false
}) {
  const pathname = usePathname();
  const contactAddress = settings.contact_address || 'Bhoirwadi, Dombivli East, Maharashtra, India';
  const contactPhone = settings.contact_phone || '+91 72758 19354';
  const contactEmail = settings.contact_email || 'anantarts39@gmail.com';
  const whatsappNumber = settings.whatsapp_number || '917275819354';

  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  
  let socialLinks = { instagram: '', facebook: '', youtube: '', pinterest: '' };
  try {
    if (settings.social_links) {
      socialLinks = typeof settings.social_links === 'string' 
        ? JSON.parse(settings.social_links) 
        : settings.social_links;
    }
  } catch (e) {
    console.error(e);
  }

  const instUrl = socialLinks.instagram || 'https://www.instagram.com/arts_by_anant';
  const fbUrl = socialLinks.facebook || '';
  const ytUrl = socialLinks.youtube || '';

  return (
    <footer id="main-footer" style={{ borderTop: '1px solid var(--primary-gold-border)' }}>
      <div className="footer-container">
        <div className="footer-column">
          <h3>Anant Arts</h3>
          <p>
            Premium Indian brand blending traditional temple sculpting with modern electroplating technology (24K Gold, Silver, Copper) to craft everlasting spiritual sculptures.
          </p>
          <div className="social-icons">
            <a href={instUrl} target="_blank" rel="noopener noreferrer" className="social-icon">
              <i className="fab fa-instagram"></i>
            </a>
            {fbUrl && (
              <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="social-icon">
                <i className="fab fa-facebook-f"></i>
              </a>
            )}
            {ytUrl && (
              <a href={ytUrl} target="_blank" rel="noopener noreferrer" className="social-icon">
                <i className="fab fa-youtube"></i>
              </a>
            )}
          </div>
        </div>
        
        <div className="footer-column">
          <h3>Quick Links</h3>
          <ul className="footer-links">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/shop">Shop All Idols</Link></li>
            <li><Link href="/corporate-gifts">Corporate Gifts</Link></li>
            <li><Link href="/blog">Artisan Blogs</Link></li>
            <li><Link href="/about">Our Story</Link></li>
            <li><Link href="/contact">Contact Support</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3>Policies</h3>
          <ul className="footer-links">
            <li><Link href="/shipping-policy">Shipping Policy</Link></li>
            <li><Link href="/return-policy">Return Policy</Link></li>
            <li><Link href="/refund-policy">Refund Policy</Link></li>
            <li><Link href="/privacy-policy">Privacy Policy</Link></li>
            <li><Link href="/terms-and-conditions">Terms &amp; Conditions</Link></li>
            <li><Link href="/faq">FAQ Helpdesk</Link></li>
            <li><Link href="/order-tracking">Track Shipment</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3>Customer Support</h3>
          <p>
            <i className="fas fa-phone-alt" style={{ color: 'var(--primary-gold)', marginRight: '8px' }}></i>
            <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} style={{ color: 'inherit' }}>{contactPhone}</a>
          </p>
          <p>
            <i className="fas fa-envelope" style={{ color: 'var(--primary-gold)', marginRight: '8px' }}></i>
            <a href={`mailto:${contactEmail}`} style={{ color: 'inherit' }}>{contactEmail}</a>
          </p>
          <p>
            <i className="fab fa-whatsapp" style={{ color: '#25D366', marginRight: '8px' }}></i>
            <a href={`https://wa.me/${whatsappNumber}`} style={{ color: 'inherit' }} target="_blank" rel="noopener noreferrer">+{whatsappNumber}</a>
          </p>
          <p>
            <i className="fas fa-map-marker-alt" style={{ color: 'var(--primary-gold)', marginRight: '8px' }}></i>
            {contactAddress}
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Anant Arts. All Rights Reserved. Crafted with Devotion in India.</p>
        <p style={{ fontSize: '0.78rem', opacity: '0.7' }}>
          <Link href="/privacy-policy" style={{ color: 'inherit' }}>Privacy Policy</Link> &nbsp;|&nbsp;
          <Link href="/terms-and-conditions" style={{ color: 'inherit' }}>Terms</Link> &nbsp;|&nbsp;
          <Link href="/refund-policy" style={{ color: 'inherit' }}>Refund Policy</Link>
        </p>
      </div>

      {/* Floating WhatsApp button */}
      <a 
        href={`https://wa.me/${whatsappNumber}?text=Hi%20Anant%20Arts%20team%2C%20I%20want%20to%20know%20more%20about%20your%20idols.`}
        className="whatsapp-float"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          backgroundColor: '#25D366',
          color: 'white',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '30px',
          boxShadow: '2px 2px 3px #999',
          zIndex: '999'
        }}
        aria-label="Chat on WhatsApp"
      >
        <i className="fab fa-whatsapp"></i>
      </a>

      {/* Mobile Sticky Floating Dock */}
      <div className="mobile-action-dock">
        <Link href="/" className={`mobile-action-dock-item ${pathname === '/' && !searchOpen && !wishlistOpen && !cartOpen ? 'active' : ''}`}>
          <i className="fas fa-home"></i>
          <span>Home</span>
        </Link>
        <button 
          onClick={onSearchClick} 
          className={`mobile-action-dock-item ${searchOpen ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', color: 'inherit', fontFamily: 'inherit', cursor: 'pointer', padding: 0 }}
        >
          <i className="fas fa-search"></i>
          <span>Search</span>
        </button>
        <button 
          onClick={onWishlistClick} 
          className={`mobile-action-dock-item ${wishlistOpen ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', color: 'inherit', fontFamily: 'inherit', cursor: 'pointer', position: 'relative', padding: 0 }}
        >
          <i className="fas fa-heart"></i>
          {wishlistCount > 0 && (
            <span style={{
              position: 'absolute', top: '4px', right: '18%',
              background: 'var(--primary-gold)', color: 'var(--bg-dark)',
              borderRadius: '50%', width: '16px', height: '16px',
              fontSize: '0.62rem', fontWeight: '700',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {wishlistCount}
            </span>
          )}
          <span>Wishlist</span>
        </button>
        <button 
          onClick={onCartClick} 
          className={`mobile-action-dock-item ${cartOpen ? 'active' : ''}`}
          style={{ position: 'relative', background: 'none', border: 'none', color: 'inherit', width: '100%', fontFamily: 'inherit', cursor: 'pointer', padding: 0 }}
        >
          <i className="fas fa-shopping-bag"></i>
          {cartCount > 0 && (
            <span style={{
              position: 'absolute', top: '4px', right: '22%',
              background: 'var(--primary-gold)', color: 'var(--bg-dark)',
              borderRadius: '50%', width: '16px', height: '16px',
              fontSize: '0.62rem', fontWeight: '700',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {cartCount}
            </span>
          )}
          <span>Cart</span>
        </button>
        <a href={`https://wa.me/${whatsappNumber}?text=Hi%20Anant%20Arts%20team%2C%20I%20want%20to%20know%20more%20about%20your%20idols.`} target="_blank" rel="noopener noreferrer" className="mobile-action-dock-item">
          <i className="fab fa-whatsapp" style={{ color: '#25D366' }}></i>
          <span>WhatsApp</span>
        </a>
      </div>
    </footer>
  );
}
