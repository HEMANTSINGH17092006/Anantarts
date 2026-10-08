'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function MegaMenu({ isOpen, onClose, onMouseEnter, onMouseLeave }) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="mega-menu-container"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave || onClose}
      role="region"
      aria-label="Collections Mega Menu"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        width: '100%',
        background: '#FFFFFF',
        color: '#1A1816',
        boxShadow: '0 20px 45px -8px rgba(30, 24, 20, 0.16), 0 6px 16px -2px rgba(30, 24, 20, 0.06)',
        borderTop: '2px solid #D4AF37',
        borderBottom: '1px solid #EAE3D9',
        zIndex: 9999,
        padding: '24px 32px 18px 32px',
        animation: 'fadeInMega 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        fontFamily: "'Poppins', sans-serif"
      }}
    >
      <div 
        className="mega-menu-grid"
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '20px',
          alignItems: 'start'
        }}
      >
        
        {/* Column 1: Spiritual Collection */}
        <div style={colWrapperStyle}>
          <div style={colHeaderStyle}>
            <span style={{ fontSize: '1rem' }}>🪷</span>
            <Link href="/category/spiritual-collection" onClick={onClose} style={colTitleLinkStyle}>
              <h4 style={colTitleStyle}>Spiritual Collection</h4>
            </Link>
          </div>
          <ul style={listStyle}>
            <li><Link href="/shop?category=spiritual-collection&search=ganesha" onClick={onClose} className="luxury-mega-link">Ganesha Idols</Link></li>
            <li><Link href="/shop?category=spiritual-collection&search=krishna" onClick={onClose} className="luxury-mega-link">Krishna Idols</Link></li>
            <li><Link href="/shop?category=spiritual-collection&search=shiva" onClick={onClose} className="luxury-mega-link">Shiva &amp; Adiyogi</Link></li>
            <li><Link href="/shop?category=spiritual-collection&search=lakshmi" onClick={onClose} className="luxury-mega-link">Lakshmi &amp; Saraswati</Link></li>
            <li><Link href="/shop?category=spiritual-collection&search=sai" onClick={onClose} className="luxury-mega-link">Sai Baba</Link></li>
            <li><Link href="/shop?category=spiritual-collection&search=hanuman" onClick={onClose} className="luxury-mega-link">Hanuman Idols</Link></li>
            <li style={{ marginTop: '4px', borderTop: '1px dashed #EAE3D9', paddingTop: '6px' }}>
              <Link href="/category/spiritual-collection" onClick={onClose} className="luxury-mega-link-all">
                View All Spiritual &rarr;
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 2: Wooden Handicrafts */}
        <div style={colWrapperStyle}>
          <div style={colHeaderStyle}>
            <span style={{ fontSize: '1rem' }}>🪵</span>
            <Link href="/category/wooden-handicrafts" onClick={onClose} style={colTitleLinkStyle}>
              <h4 style={colTitleStyle}>Wooden Handicrafts</h4>
            </Link>
          </div>
          <ul style={listStyle}>
            <li><Link href="/shop?category=wooden-handicrafts&search=decor" onClick={onClose} className="luxury-mega-link">Wooden Décor</Link></li>
            <li><Link href="/shop?category=wooden-handicrafts&search=organizer" onClick={onClose} className="luxury-mega-link">Wooden Organizers</Link></li>
            <li><Link href="/shop?category=wooden-handicrafts&search=kitchen" onClick={onClose} className="luxury-mega-link">Wooden Kitchen</Link></li>
            <li><Link href="/shop?category=wooden-handicrafts&search=traditional" onClick={onClose} className="luxury-mega-link">Traditional Woodcraft</Link></li>
            <li><Link href="/shop?category=wooden-handicrafts&search=temple" onClick={onClose} className="luxury-mega-link">Wooden Temples</Link></li>
            <li style={{ marginTop: '4px', borderTop: '1px dashed #EAE3D9', paddingTop: '6px' }}>
              <Link href="/category/wooden-handicrafts" onClick={onClose} className="luxury-mega-link-all">
                View All Wooden &rarr;
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Home Decor */}
        <div style={colWrapperStyle}>
          <div style={colHeaderStyle}>
            <span style={{ fontSize: '1rem' }}>🏡</span>
            <Link href="/category/home-decor" onClick={onClose} style={colTitleLinkStyle}>
              <h4 style={colTitleStyle}>Home Décor</h4>
            </Link>
          </div>
          <ul style={listStyle}>
            <li><Link href="/shop?category=home-decor&search=showpiece" onClick={onClose} className="luxury-mega-link">Showpieces</Link></li>
            <li><Link href="/shop?category=home-decor&search=table" onClick={onClose} className="luxury-mega-link">Table Décor</Link></li>
            <li><Link href="/shop?category=home-decor&search=furniture" onClick={onClose} className="luxury-mega-link">Furniture Accents</Link></li>
            <li><Link href="/shop?category=home-decor&search=lighting" onClick={onClose} className="luxury-mega-link">Lighting &amp; Lamps</Link></li>
            <li><Link href="/shop?category=home-decor&search=wall+art" onClick={onClose} className="luxury-mega-link">Wall Art Plaques</Link></li>
            <li style={{ marginTop: '4px', borderTop: '1px dashed #EAE3D9', paddingTop: '6px' }}>
              <Link href="/category/home-decor" onClick={onClose} className="luxury-mega-link-all">
                View All Home Décor &rarr;
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Corporate Gifts */}
        <div style={colWrapperStyle}>
          <div style={colHeaderStyle}>
            <span style={{ fontSize: '1rem' }}>🎁</span>
            <Link href="/category/corporate-gifts" onClick={onClose} style={colTitleLinkStyle}>
              <h4 style={colTitleStyle}>Corporate Gifts</h4>
            </Link>
          </div>
          <ul style={listStyle}>
            <li><Link href="/corporate-gifts" onClick={onClose} className="luxury-mega-link">Desk Organizers</Link></li>
            <li><Link href="/corporate-gifts" onClick={onClose} className="luxury-mega-link">Awards &amp; Trophies</Link></li>
            <li><Link href="/corporate-gifts" onClick={onClose} className="luxury-mega-link">Executive Gifts</Link></li>
            <li><Link href="/corporate-gifts#bulk-enquiry-section" onClick={onClose} className="luxury-mega-link">Bulk Orders</Link></li>
            <li><Link href="/corporate-gifts" onClick={onClose} className="luxury-mega-link">Corporate Gifting</Link></li>
            <li style={{ marginTop: '4px', borderTop: '1px dashed #EAE3D9', paddingTop: '6px' }}>
              <Link href="/category/corporate-gifts" onClick={onClose} className="luxury-mega-link-all">
                Corporate Catalogue &rarr;
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 5: Customized Gifts */}
        <div style={colWrapperStyle}>
          <div style={colHeaderStyle}>
            <span style={{ fontSize: '1rem' }}>🎨</span>
            <Link href="/category/customized-gifts" onClick={onClose} style={colTitleLinkStyle}>
              <h4 style={colTitleStyle}>Customized Gifts</h4>
            </Link>
          </div>
          <ul style={listStyle}>
            <li><Link href="/category/customized-gifts" onClick={onClose} className="luxury-mega-link">Personalized Gifts</Link></li>
            <li><Link href="/shop?category=customized-gifts&search=nameplate" onClick={onClose} className="luxury-mega-link">Name Plates</Link></li>
            <li><Link href="/shop?category=customized-gifts&search=engraved" onClick={onClose} className="luxury-mega-link">Engraved Products</Link></li>
            <li><Link href="/consultation" onClick={onClose} className="luxury-mega-link">Customized Idols</Link></li>
            <li><Link href="/consultation" onClick={onClose} className="luxury-mega-link">Request Customization</Link></li>
            <li style={{ marginTop: '4px', borderTop: '1px dashed #EAE3D9', paddingTop: '6px' }}>
              <Link href="/category/customized-gifts" onClick={onClose} className="luxury-mega-link-all">
                Explore Custom &rarr;
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 6: Festival Collection */}
        <div style={colWrapperStyle}>
          <div style={colHeaderStyle}>
            <span style={{ fontSize: '1rem' }}>🎉</span>
            <Link href="/category/festival-collection" onClick={onClose} style={colTitleLinkStyle}>
              <h4 style={colTitleStyle}>Festival Collection</h4>
            </Link>
          </div>
          <ul style={listStyle}>
            <li><Link href="/shop?category=festival-collection&search=diwali" onClick={onClose} className="luxury-mega-link">Diwali Collection</Link></li>
            <li><Link href="/shop?category=festival-collection&search=ganesh" onClick={onClose} className="luxury-mega-link">Ganesh Chaturthi</Link></li>
            <li><Link href="/shop?category=festival-collection&search=rakhi" onClick={onClose} className="luxury-mega-link">Raksha Bandhan</Link></li>
            <li><Link href="/shop?category=festival-collection&search=christmas" onClick={onClose} className="luxury-mega-link">Christmas Accents</Link></li>
            <li><Link href="/shop?category=festival-collection&search=new+year" onClick={onClose} className="luxury-mega-link">New Year Specials</Link></li>
            <li style={{ marginTop: '4px', borderTop: '1px dashed #EAE3D9', paddingTop: '6px' }}>
              <Link href="/category/festival-collection" onClick={onClose} className="luxury-mega-link-all">
                All Occasions &rarr;
              </Link>
            </li>
          </ul>
        </div>

      </div>

      {/* Elegant Bottom Action Bar */}
      <div style={{
        maxWidth: '1280px',
        margin: '18px auto 0 auto',
        paddingTop: '14px',
        borderTop: '1px solid #F0EAE1',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '0.78rem',
        color: '#6B655B'
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#D4AF37' }}>🛡️</span> Free Insured Transit Packaging
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#D4AF37' }}>⚜️</span> Certified 24K Gold Electroplating
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#D4AF37' }}>🛕</span> Shilpa Shastra Proportions
          </span>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="/collections" onClick={onClose} style={{ color: '#9C7A14', fontWeight: '600', textDecoration: 'none' }}>
            Browse All 12 Collections &rarr;
          </Link>
          <Link href="/consultation" onClick={onClose} style={{ color: '#1A1816', fontWeight: '500', textDecoration: 'none' }}>
            Custom Mandir Sizing
          </Link>
        </div>
      </div>
    </div>
  );
}

const colWrapperStyle = {
  display: 'flex',
  flexDirection: 'column'
};

const colHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '10px',
  paddingBottom: '6px',
  borderBottom: '1px solid #EAE3D9'
};

const colTitleLinkStyle = {
  textDecoration: 'none',
  flex: 1
};

const colTitleStyle = {
  margin: 0,
  fontFamily: "'Playfair Display', serif",
  color: '#1F1A17',
  fontSize: '0.92rem',
  fontWeight: '700',
  letterSpacing: '0.2px',
  lineHeight: '1.3'
};

const listStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontSize: '0.8rem'
};
