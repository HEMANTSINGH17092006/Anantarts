'use client';
import Link from 'next/link';

export default function MegaMenu({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      className="mega-menu-wrapper"
      onMouseLeave={onClose}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        width: '100%',
        background: 'rgba(20, 17, 15, 0.96)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: '#FFFFFF',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        borderTop: '2px solid #D4AF37',
        borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
        zIndex: 9999,
        padding: '36px 40px',
        animation: 'fadeInMega 0.25s ease-out forwards',
      }}
    >
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '24px'
      }}>
        
        {/* Column 1: Spiritual Collection */}
        <div>
          <div style={colHeaderStyle}>
            <span style={{ fontSize: '1.1rem' }}>✨</span>
            <h4 style={colTitleStyle}>Spiritual Collection</h4>
          </div>
          <ul style={listStyle}>
            <li><Link href="/shop?category=spiritual-collection&search=ganesha" onClick={onClose} className="mega-link">• Ganesh</Link></li>
            <li><Link href="/shop?category=spiritual-collection&search=krishna" onClick={onClose} className="mega-link">• Krishna</Link></li>
            <li><Link href="/shop?category=spiritual-collection&search=shiva" onClick={onClose} className="mega-link">• Shiva</Link></li>
            <li><Link href="/shop?category=spiritual-collection&search=lakshmi" onClick={onClose} className="mega-link">• Lakshmi</Link></li>
            <li><Link href="/shop?category=spiritual-collection&search=sai" onClick={onClose} className="mega-link">• Sai Baba</Link></li>
            <li><Link href="/shop?category=spiritual-collection&search=hanuman" onClick={onClose} className="mega-link">• Hanuman</Link></li>
          </ul>
        </div>

        {/* Column 2: Wooden Handicrafts */}
        <div>
          <div style={colHeaderStyle}>
            <span style={{ fontSize: '1.1rem' }}>🪵</span>
            <h4 style={colTitleStyle}>Wooden Handicrafts</h4>
          </div>
          <ul style={listStyle}>
            <li><Link href="/shop?category=wooden-handicrafts&search=wall+decor" onClick={onClose} className="mega-link">• Wall Decor</Link></li>
            <li><Link href="/shop?category=wooden-handicrafts&search=temple" onClick={onClose} className="mega-link">• Wooden Temples</Link></li>
            <li><Link href="/shop?category=wooden-handicrafts&search=sculpture" onClick={onClose} className="mega-link">• Sculptures</Link></li>
            <li><Link href="/shop?category=wooden-handicrafts&search=carved" onClick={onClose} className="mega-link">• Carvings</Link></li>
            <li><Link href="/shop?category=wooden-handicrafts&search=box" onClick={onClose} className="mega-link">• Storage</Link></li>
            <li><Link href="/shop?category=wooden-handicrafts&search=furniture" onClick={onClose} className="mega-link">• Furniture Accents</Link></li>
          </ul>
        </div>

        {/* Column 3: Home Decor */}
        <div>
          <div style={colHeaderStyle}>
            <span style={{ fontSize: '1.1rem' }}>🏡</span>
            <h4 style={colTitleStyle}>Home Decor</h4>
          </div>
          <ul style={listStyle}>
            <li><Link href="/shop?category=home-decor&search=showpiece" onClick={onClose} className="mega-link">• Showpieces</Link></li>
            <li><Link href="/shop?category=home-decor&search=wall+art" onClick={onClose} className="mega-link">• Wall Art</Link></li>
            <li><Link href="/shop?category=home-decor&search=decorative" onClick={onClose} className="mega-link">• Decorative Items</Link></li>
            <li><Link href="/shop?category=home-decor&search=vase" onClick={onClose} className="mega-link">• Vases</Link></li>
            <li><Link href="/shop?category=home-decor&search=lighting" onClick={onClose} className="mega-link">• Lighting</Link></li>
          </ul>
        </div>

        {/* Column 4: Corporate Gifts */}
        <div>
          <div style={colHeaderStyle}>
            <span style={{ fontSize: '1.1rem' }}>🎁</span>
            <h4 style={colTitleStyle}>Corporate Gifts</h4>
          </div>
          <ul style={listStyle}>
            <li><Link href="/corporate-gifts" onClick={onClose} className="mega-link">• Desk Organizers</Link></li>
            <li><Link href="/corporate-gifts" onClick={onClose} className="mega-link">• Awards</Link></li>
            <li><Link href="/corporate-gifts" onClick={onClose} className="mega-link">• Mementos</Link></li>
            <li><Link href="/corporate-gifts" onClick={onClose} className="mega-link">• Executive Gifts</Link></li>
            <li><Link href="/corporate-gifts#bulk-enquiry-section" onClick={onClose} className="mega-link" style={{ color: '#D4AF37', fontWeight: '600' }}>• Bulk Orders</Link></li>
          </ul>
        </div>

        {/* Column 5: Customized Gifts */}
        <div>
          <div style={colHeaderStyle}>
            <span style={{ fontSize: '1.1rem' }}>🎨</span>
            <h4 style={colTitleStyle}>Customized Gifts</h4>
          </div>
          <ul style={listStyle}>
            <li><Link href="/shop?category=customized-gifts" onClick={onClose} className="mega-link">• Personalized Gifts</Link></li>
            <li><Link href="/shop?category=customized-gifts&search=nameplate" onClick={onClose} className="mega-link">• Name Plates</Link></li>
            <li><Link href="/shop?category=customized-gifts&search=engraved" onClick={onClose} className="mega-link">• Engraved Products</Link></li>
          </ul>
        </div>

        {/* Column 6: Festival Collection */}
        <div>
          <div style={colHeaderStyle}>
            <span style={{ fontSize: '1.1rem' }}>🎉</span>
            <h4 style={colTitleStyle}>Festival Collection</h4>
          </div>
          <ul style={listStyle}>
            <li><Link href="/shop?category=festival-collection&search=diwali" onClick={onClose} className="mega-link">• Diwali</Link></li>
            <li><Link href="/shop?category=festival-collection&search=christmas" onClick={onClose} className="mega-link">• Christmas</Link></li>
            <li><Link href="/shop?category=festival-collection&search=rakhi" onClick={onClose} className="mega-link">• Raksha Bandhan</Link></li>
            <li><Link href="/shop?category=festival-collection&search=new+year" onClick={onClose} className="mega-link">• New Year</Link></li>
            <li><Link href="/shop?occasion=Housewarming" onClick={onClose} className="mega-link">• Housewarming</Link></li>
          </ul>
        </div>

      </div>
    </div>
  );
}

const colHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '12px',
  borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
  paddingBottom: '8px'
};

const colTitleStyle = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  color: '#D4AF37',
  fontSize: '0.92rem',
  fontWeight: '600'
};

const listStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '7px',
  fontSize: '0.82rem'
};
