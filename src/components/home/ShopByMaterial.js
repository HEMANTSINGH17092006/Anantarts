'use client';
import Link from 'next/link';

const MATERIALS = [
  { name: 'Wood', icon: '🪵', badge: 'Hand-Carved', desc: 'Premium teak, rosewood & seasonal woods' },
  { name: 'Resin', icon: '🧪', badge: 'Precision Molded', desc: 'High-density composite with metallic sheen' },
  { name: 'Metal', icon: '⚙️', badge: 'Industrial Grade', desc: 'Durable steel, iron & copper alloys' },
  { name: 'Marble', icon: '🏛️', badge: 'Pure White', desc: 'Rajasthan white marble chiseling' },
  { name: 'Brass', icon: '🔔', badge: 'Heavy Bell Metal', desc: 'Traditional wax-cast bell metal brass' },
  { name: 'Silver Plated', icon: '🥈', badge: 'Pure Sterling', desc: 'Multi-layer pure silver electroplating' },
  { name: 'Gold Plated', icon: '🥇', badge: '24K Fine Gold', desc: 'High-lustre 24K gold electrical bonding' },
  { name: 'MDF', icon: '📐', badge: 'Laser Cut', desc: 'Precision engineered wooden MDF layers' },
  { name: 'Glass', icon: '💎', badge: 'Crystal Clear', desc: 'Handcrafted glass & crystal displays' },
  { name: 'Mixed Materials', icon: '🎨', badge: 'Fusion Art', desc: 'Wood, brass & gold dual-tone fusion' },
];

export default function ShopByMaterial() {
  return (
    <section style={{ background: 'var(--bg-cream-dark)', padding: 'var(--section-padding-y) 0', borderTop: '1px solid var(--primary-gold-border)', borderBottom: '1px solid var(--primary-gold-border)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 2rem' }}>
        <div className="section-heading" style={{ marginTop: 0, marginBottom: '2.5rem' }}>
          <h2>Shop by Material</h2>
          <div className="gold-line"></div>
          <p>Explore raw materials fused with electroplating excellence and artisanal handwork.</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1.25rem'
        }}>
          {MATERIALS.map((mat, idx) => (
            <Link
              key={idx}
              href={`/shop?material=${encodeURIComponent(mat.name)}`}
              style={{
                background: '#FFFFFF',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid var(--primary-gold-border)',
                boxShadow: 'var(--shadow-sm)',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}
              className="material-card-hover"
            >
              <span style={{ fontSize: '2rem', flexShrink: 0 }}>{mat.icon}</span>
              <div>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--primary-gold)', fontWeight: '700', letterSpacing: '0.5px', display: 'block' }}>
                  {mat.badge}
                </span>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--text-dark)', margin: '2px 0', fontWeight: '600' }}>
                  {mat.name}
                </h3>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.3' }}>
                  {mat.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
