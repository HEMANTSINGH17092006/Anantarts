'use client';
import Link from 'next/link';

export default function Footer({ settings = {} }) {
  const contactAddress = settings.contact_address || 'Bhoirwadi, Dombivli East, Maharashtra, India';
  const contactPhone = settings.contact_phone || '+91 72758 19354';
  const contactEmail = settings.contact_email || 'care@anantarts.com';
  const whatsappNumber = settings.whatsapp_number || '917275819354';
  
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

  const instUrl = socialLinks.instagram || 'https://instagram.com/anantarts';
  const fbUrl = socialLinks.facebook || 'https://facebook.com/anantarts';
  const ytUrl = socialLinks.youtube || 'https://youtube.com/anantarts';

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
            <a href={fbUrl} target="_blank" rel="noopener noreferrer" className="social-icon">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href={ytUrl} target="_blank" rel="noopener noreferrer" className="social-icon">
              <i className="fab fa-youtube"></i>
            </a>
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
            <li><Link href="/return-policy">Return & Refund Policy</Link></li>
            <li><Link href="/privacy-policy">Privacy Policy</Link></li>
            <li><Link href="/faq">FAQ Helpdesk</Link></li>
            <li><Link href="/order-tracking">Track Shipment</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3>Customer Support</h3>
          <p>
            <i className="fas fa-phone-alt" style={{ color: 'var(--primary-gold)', marginRight: '8px' }}></i>
            Call Support: {contactPhone}
          </p>
          <p>
            <i className="fas fa-envelope" style={{ color: 'var(--primary-gold)', marginRight: '8px' }}></i>
            Email: {contactEmail}
          </p>
          <p>
            <i className="fab fa-whatsapp" style={{ color: '#25D366', marginRight: '8px' }}></i>
            WhatsApp: +{whatsappNumber}
          </p>
          <p>
            <i className="fas fa-map-marker-alt" style={{ color: 'var(--primary-gold)', marginRight: '8px' }}></i>
            {contactAddress}
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Anant Arts. All Rights Reserved. Crafted with Devotion.</p>
        <p>Luxury Electroplated Hindu Idols | Brand of Divine luxury</p>
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
        <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} className="mobile-action-dock-item">
          <i className="fas fa-phone-alt"></i>
          <span>Call Support</span>
        </a>
        <a href={`https://wa.me/${whatsappNumber}?text=Hi%20Anant%20Arts%20team%2C%20I%20want%20to%20know%20more%20about%20your%20idols.`} target="_blank" rel="noopener noreferrer" className="mobile-action-dock-item">
          <i className="fab fa-whatsapp"></i>
          <span>WhatsApp Chat</span>
        </a>
        <Link href="/order-tracking" className="mobile-action-dock-item">
          <i className="fas fa-shipping-fast"></i>
          <span>Track Order</span>
        </Link>
      </div>
    </footer>
  );
}
