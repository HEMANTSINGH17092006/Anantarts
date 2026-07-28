'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MenuDrawer({ isOpen, onClose }) {
  const [openGroup, setOpenGroup] = useState('spiritual');

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

  const toggleGroup = (group) => {
    setOpenGroup(prev => prev === group ? null : group);
  };

  return (
    <div className="cart-drawer-overlay open" onClick={onClose} style={{ zIndex: 10000 }}>
      <div 
        className="menu-drawer open" 
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          height: '100dvh',
          background: '#14110F',
          color: '#FFFFFF',
          zIndex: 10001,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '10px 0 40px rgba(0,0,0,0.6)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          fontFamily: "'Poppins', sans-serif"
        }}
      >
        {/* Drawer Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(212, 175, 55, 0.12) 0%, rgba(0,0,0,0) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/uploads/logo.png" alt="Anant Arts" style={{ height: '38px', width: 'auto' }} onError={(e) => { e.target.style.display = 'none'; }} />
            <div>
              <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#D4AF37', fontWeight: '700' }}>Anant Arts</h3>
              <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.8)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Full Marketplace Directory</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close menu"
            style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '1.4rem', cursor: 'pointer', padding: '8px' }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Full-Screen Category Accordion Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Quick Direct Links */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '8px' }}>
            <Link href="/" onClick={onClose} className="btn-outline-gold" style={{ textAlign: 'center', padding: '10px', fontSize: '0.82rem', color: '#FFF' }}>
              🏠 Home
            </Link>
            <Link href="/shop" onClick={onClose} className="btn-gold" style={{ textAlign: 'center', padding: '10px', fontSize: '0.82rem', justifyContent: 'center' }}>
              🛍 All Products
            </Link>
          </div>

          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#D4AF37', letterSpacing: '1.5px', fontWeight: '700' }}>
            Browse Categories
          </span>

          {/* 1. Spiritual Collection */}
          <CategoryGroup
            title="✨ Spiritual Collection"
            isOpen={openGroup === 'spiritual'}
            onToggle={() => toggleGroup('spiritual')}
            items={[
              { label: 'Ganesh', link: '/shop?category=spiritual-collection&search=ganesha' },
              { label: 'Krishna', link: '/shop?category=spiritual-collection&search=krishna' },
              { label: 'Shiva', link: '/shop?category=spiritual-collection&search=shiva' },
              { label: 'Lakshmi', link: '/shop?category=spiritual-collection&search=lakshmi' },
              { label: 'Sai Baba', link: '/shop?category=spiritual-collection&search=sai' },
              { label: 'Hanuman', link: '/shop?category=spiritual-collection&search=hanuman' }
            ]}
            onClose={onClose}
          />

          {/* 2. Wooden Handicrafts */}
          <CategoryGroup
            title="🪵 Wooden Handicrafts"
            isOpen={openGroup === 'wooden'}
            onToggle={() => toggleGroup('wooden')}
            items={[
              { label: 'Wall Decor', link: '/shop?category=wooden-handicrafts&search=wall+decor' },
              { label: 'Wooden Temples', link: '/shop?category=wooden-handicrafts&search=temple' },
              { label: 'Sculptures', link: '/shop?category=wooden-handicrafts&search=sculpture' },
              { label: 'Carvings', link: '/shop?category=wooden-handicrafts&search=carved' },
              { label: 'Storage', link: '/shop?category=wooden-handicrafts&search=box' },
              { label: 'Furniture Accessories', link: '/shop?category=wooden-handicrafts&search=furniture' }
            ]}
            onClose={onClose}
          />

          {/* 3. Home Decor */}
          <CategoryGroup
            title="🏡 Home Decor"
            isOpen={openGroup === 'home'}
            onToggle={() => toggleGroup('home')}
            items={[
              { label: 'Showpieces', link: '/shop?category=home-decor&search=showpiece' },
              { label: 'Wall Art', link: '/shop?category=home-decor&search=wall+art' },
              { label: 'Decorative Items', link: '/shop?category=home-decor&search=decorative' },
              { label: 'Vases', link: '/shop?category=home-decor&search=vase' },
              { label: 'Lighting', link: '/shop?category=home-decor&search=lighting' }
            ]}
            onClose={onClose}
          />

          {/* 4. Corporate Gifts */}
          <CategoryGroup
            title="🎁 Corporate Gifts"
            isOpen={openGroup === 'corporate'}
            onToggle={() => toggleGroup('corporate')}
            items={[
              { label: 'Desk Organizers', link: '/corporate-gifts' },
              { label: 'Awards', link: '/corporate-gifts' },
              { label: 'Mementos', link: '/corporate-gifts' },
              { label: 'Executive Gifts', link: '/corporate-gifts' },
              { label: 'Bulk Orders', link: '/corporate-gifts#bulk-enquiry-section' }
            ]}
            onClose={onClose}
          />

          {/* 5. Customized Gifts */}
          <CategoryGroup
            title="🎨 Customized Gifts"
            isOpen={openGroup === 'custom'}
            onToggle={() => toggleGroup('custom')}
            items={[
              { label: 'Personalized Gifts', link: '/shop?category=customized-gifts' },
              { label: 'Name Plates', link: '/shop?category=customized-gifts&search=nameplate' },
              { label: 'Engraved Products', link: '/shop?category=customized-gifts&search=engraved' }
            ]}
            onClose={onClose}
          />

          {/* 6. Festival Collection */}
          <CategoryGroup
            title="🎉 Festival Collection"
            isOpen={openGroup === 'festival'}
            onToggle={() => toggleGroup('festival')}
            items={[
              { label: 'Diwali', link: '/shop?category=festival-collection&search=diwali' },
              { label: 'Christmas', link: '/shop?category=festival-collection&search=christmas' },
              { label: 'Raksha Bandhan', link: '/shop?category=festival-collection&search=rakhi' },
              { label: 'New Year', link: '/shop?category=festival-collection&search=new+year' },
              { label: 'Housewarming', link: '/shop?occasion=Housewarming' }
            ]}
            onClose={onClose}
          />

        </div>

        {/* Footer Contact */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.4)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
          <p style={{ margin: 0 }}>📞 +91 72758 19354 &nbsp;|&nbsp; ✉️ anantarts39@gmail.com</p>
        </div>
      </div>
    </div>
  );
}

function CategoryGroup({ title, isOpen, onToggle, items, onClose }) {
  return (
    <div style={{ border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '8px', overflow: 'hidden' }}>
      <button 
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '14px 16px',
          background: isOpen ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.04)',
          border: 'none',
          color: isOpen ? '#D4AF37' : '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: '600',
          fontSize: '0.92rem',
          cursor: 'pointer'
        }}
      >
        <span>{title}</span>
        <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} style={{ fontSize: '0.75rem' }}></i>
      </button>

      {isOpen && (
        <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(0,0,0,0.3)' }}>
          {items.map((it, idx) => (
            <Link
              key={idx}
              href={it.link}
              onClick={onClose}
              style={{
                padding: '9px 10px',
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.85)',
                textDecoration: 'none',
                borderRadius: '4px'
              }}
            >
              • {it.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
