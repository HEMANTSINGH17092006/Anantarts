'use client';
import Link from 'next/link';

const CORPORATE_ITEMS = [
  { name: 'Desk Organizers', iconClass: 'fas fa-briefcase', desc: 'Silver & gold plated pen stands, clock plaques & desktop caddies.' },
  { name: 'Awards', iconClass: 'fas fa-trophy', desc: 'Precision electroplated recognition trophies & corporate identity plaques.' },
  { name: 'Mementos', iconClass: 'fas fa-medal', desc: 'Commemorative brass tokens & milestone celebration souvenirs.' },
  { name: 'Customized Gifts', iconClass: 'fas fa-certificate', desc: 'Bespoke corporate gifts customized with your company logo & branding.' },
  { name: 'Executive Gifts', iconClass: 'fas fa-pen-nib', desc: 'Luxury leatherette, velvet & wooden boxed premium gift sets.' },
  { name: 'Bulk Orders', iconClass: 'fas fa-boxes', desc: 'Tiered wholesale discounts for corporate orders from 10 to 500+ units.' }
];

export default function CorporateShowcase() {
  return (
    <section style={{
      background: '#14110F',
      color: '#FFFFFF',
      padding: '5rem 2rem',
      borderTop: '1px solid rgba(212, 175, 55, 0.2)',
      borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ color: '#D4AF37', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
            B2B &amp; Executive Solutions
          </span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: '#FFFFFF', marginTop: '6px', marginBottom: '12px' }}>
            Corporate Gifting &amp; Bulk Orders
          </h2>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: '720px', margin: '0 auto', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Leave an indelible mark on clients, partners, and employees with custom electroplated corporate gifts and executive presentation boxes.
          </p>
        </div>

        {/* Corporate Items Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
          gap: '1.75rem'
        }}>
          {CORPORATE_ITEMS.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '10px',
                padding: '28px 24px',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '18px'
              }}
            >
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '8px',
                background: 'rgba(212, 175, 55, 0.15)',
                color: '#D4AF37',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                flexShrink: 0
              }}>
                <i className={item.iconClass}></i>
              </div>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.18rem', color: '#FFFFFF', margin: '0 0 6px 0', fontWeight: '600' }}>
                  {item.name}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.72)', margin: 0, lineHeight: '1.5' }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '3.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/corporate-gifts" className="btn-gold" style={{ padding: '12px 28px', fontSize: '0.85rem' }}>
            Explore Corporate Catalog
          </Link>
          <a href="#bulk-enquiry-section" className="btn-outline-gold" style={{ color: '#FFFFFF', borderColor: '#D4AF37', padding: '12px 28px', fontSize: '0.85rem' }}>
            Request Bulk Quote
          </a>
        </div>
      </div>
    </section>
  );
}
