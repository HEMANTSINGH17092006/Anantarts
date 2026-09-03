'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart, useWishlist } from '../context/AppContext';

export default function Footer({ 
  settings = {}, 
  onCartClick, 
  onSearchClick, 
  onWishlistClick,
  onMenuClick,
  activeTab = null
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

  const rawInst = socialLinks.instagram || 'https://www.instagram.com/anantarts.in/';
  const instUrl = rawInst.includes('?') ? rawInst.split('?')[0].replace(/\/$/, '') + '/' : rawInst;
  const fbUrl = socialLinks.facebook || '';
  const ytUrl = socialLinks.youtube || '';

  const isDrawerOpen = Boolean(activeTab);

  return (
    <footer id="main-footer" style={{ borderTop: '1px solid var(--primary-gold-border)' }}>
      {/* Integrated Newsletter Form (Issue #14) */}
      <div style={{
        background: 'rgba(212, 175, 55, 0.05)',
        borderBottom: '1px solid var(--primary-gold-border)',
        padding: '2.5rem 2rem'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--text-dark)', margin: '0 0 4px 0' }}>
              Join The Anant Arts Privilege Circle
            </h3>
            <p style={{ fontSize: 'var(--text-sm, 0.875rem)', color: 'var(--color-text-muted, #6B655B)', margin: 0 }}>
              Receive private invitations to new artisan launches, festive catalogs, and bespoke previews.
            </p>
          </div>

          <form 
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target;
              const emailInput = form.elements['footer_email'];
              const email = emailInput?.value;
              if (!email) return;
              try {
                const res = await fetch('/api/newsletter/subscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email })
                });
                if (res.ok) {
                  alert('Thank you for subscribing to Anant Arts!');
                  form.reset();
                } else {
                  alert('Subscription updated.');
                }
              } catch (err) {
                console.error(err);
              }
            }}
            style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxWidth: '420px', width: '100%' }}
          >
            <input 
              type="email"
              name="footer_email"
              placeholder="Enter your email address"
              required
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '10px 16px',
                borderRadius: 'var(--radius-sm, 6px)',
                border: '1.5px solid var(--primary-gold-border)',
                background: '#FFFFFF',
                color: 'var(--text-dark)',
                fontSize: 'var(--text-sm, 0.875rem)',
                outline: 'none'
              }}
            />
            <button type="submit" className="btn-primary btn-md" style={{ padding: '10px 20px', fontSize: 'var(--text-sm, 0.875rem)' }}>
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="footer-container">
        {/* Column 1: Brand & Social Presence (Issue #15) */}
        <div className="footer-column">
          <h3>Anant Arts</h3>
          <p>
            Premium Indian brand blending traditional temple sculpting with modern electroplating technology (24K Gold, Silver, Copper) to craft everlasting spiritual sculptures.
          </p>
          
          <div style={{ marginTop: '1.25rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--color-text-accent, #8C6D1F)', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
              Follow Us
            </span>
            <div className="social-icons" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <a 
                href={instUrl} 
                target="_blank" 
                rel="nofollow noopener noreferrer" 
                className="social-icon" 
                aria-label="Follow Anant Arts on Instagram"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-full)',
                  border: '1.5px solid var(--primary-gold-border)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-accent, #8C6D1F)',
                  background: 'var(--primary-gold-light)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <i className="fab fa-instagram" style={{ fontSize: '1.2rem' }}></i>
              </a>
              {fbUrl && (
                <a href={fbUrl} target="_blank" rel="nofollow noopener noreferrer" className="social-icon" aria-label="Follow Anant Arts on Facebook">
                  <i className="fab fa-facebook-f"></i>
                </a>
              )}
              {ytUrl && (
                <a href={ytUrl} target="_blank" rel="nofollow noopener noreferrer" className="social-icon" aria-label="Follow Anant Arts on YouTube">
                  <i className="fab fa-youtube"></i>
                </a>
              )}
            </div>
          </div>
        </div>
        
        {/* Column 2: Quick Links */}
        <div className="footer-column">
          <h3>Quick Links</h3>
          <ul className="footer-links">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/shop">Shop All Idols</Link></li>
            <li><Link href="/collections">All Collections</Link></li>
            <li><Link href="/materials">Shop by Material</Link></li>
            <li><Link href="/occasions">Shop by Occasion</Link></li>
            <li><Link href="/corporate-gifts">Corporate Gifting</Link></li>
            <li><Link href="/consultation">Mandir Vastu Consultation</Link></li>
            <li><Link href="/blog">Artisan Blogs</Link></li>
            <li><Link href="/about">Our Story</Link></li>
            <li><Link href="/contact">Contact Support</Link></li>
          </ul>
        </div>

        {/* Column 3: Policies */}
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

        {/* Column 4: Consolidated Support (Issues #12, #13) */}
        <div className="footer-column">
          <h3>Customer Support</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <i className="fas fa-phone-alt" style={{ color: 'var(--primary-gold)' }}></i>
            <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} style={{ color: 'inherit', fontWeight: 500 }}>
              {contactPhone}
            </a>
            <a 
              href={`https://wa.me/${whatsappNumber}`} 
              style={{ color: 'var(--primary-gold)', marginLeft: '4px', display: 'inline-flex', alignItems: 'center' }} 
              target="_blank" 
              rel="nofollow noopener noreferrer" 
              title="Chat on WhatsApp"
              aria-label="WhatsApp Support"
            >
              <i className="fab fa-whatsapp" style={{ fontSize: '1.1rem' }}></i>
            </a>
          </div>

          <p style={{ marginBottom: '12px' }}>
            <i className="fas fa-envelope" style={{ color: 'var(--primary-gold)', marginRight: '8px' }}></i>
            <a href={`mailto:${contactEmail}`} style={{ color: 'inherit' }}>{contactEmail}</a>
          </p>

          <p style={{ margin: 0 }}>
            <i className="fas fa-map-marker-alt" style={{ color: 'var(--primary-gold)', marginRight: '8px' }}></i>
            {contactAddress}
          </p>
        </div>
      </div>

      {/* Footer Bottom (Issue #11: Removed duplicate policy links) */}
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Anant Arts. All Rights Reserved. Crafted with Devotion in India.</p>
      </div>

      <div className="footer-credit">
        Developed &amp; Managed by Growthly Digital Solutions
      </div>

      {/* Floating WhatsApp button — positioned at bottom: 90px, automatically hidden when any drawer is active */}
      {!isDrawerOpen && (
        <a 
          href={`https://wa.me/${whatsappNumber}?text=Hi%20Anant%20Arts%20team%2C%20I%20want%20to%20know%20more%20about%20your%20idols.`}
          className="whatsapp-float"
          target="_blank"
          rel="nofollow noopener noreferrer"
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            backgroundColor: '#25D366',
            color: 'white',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)',
            zIndex: '9998',
            transition: 'transform 0.2s ease, opacity 0.2s ease'
          }}
          aria-label="Chat on WhatsApp"
        >
          <i className="fab fa-whatsapp"></i>
        </a>
      )}
    </footer>
  );
}
