import Link from 'next/link';

export const metadata = {
  title: 'Shop by Material | Anant Arts Handcrafted Masterpieces',
  description: 'Explore products crafted from raw teak wood, rosewood, bell metal brass, 24K gold plating, pure sterling silver, marble chiseling, and MDF.',
};

export default function MaterialsPage() {
  const MATERIALS_LIST = [
    { name: 'Wood', icon: '🪵', badge: 'Artisanal Carved', desc: 'Premium seasoned rosewood, teak wood & handcrafted wooden decor.' },
    { name: 'Resin', icon: '🧪', badge: 'Precision Composite', desc: 'High-density composite molding featuring metallic hand paints.' },
    { name: 'Metal', icon: '⚙️', badge: 'Industrial Alloy', desc: 'Durable steel, iron alloys & heavy metal castings.' },
    { name: 'Marble', icon: '🏛️', badge: 'Rajasthan Sculpted', desc: 'Pure white Rajasthan marble hand chiseling and inlay artwork.' },
    { name: 'Brass', icon: '🔔', badge: 'Heavy Bell Metal', desc: 'Authentic lost-wax cast bell metal brass with antique patinas.' },
    { name: 'Silver Plated', icon: '🥈', badge: 'Pure Sterling', desc: 'Layered with pure 999 sterling silver electroplating under electrical currents.' },
    { name: 'Gold Plated', icon: '🥇', badge: '24K Fine Gold', desc: 'Electroplated with 24K pure gold sheet bonding for permanent brilliance.' },
    { name: 'MDF', icon: '📐', badge: 'Laser Engineered', desc: 'Precision laser-cut wooden MDF layers with metallic foil accents.' },
    { name: 'Glass', icon: '💎', badge: 'Crystal Finish', desc: 'Hand-blown glass displays, crystal pedestals & mirrored accents.' },
    { name: 'Mixed Materials', icon: '🎨', badge: 'Fusion Masterpiece', desc: 'Dual-tone fusion combining carved teak wood, brass, and 24K gold plating.' }
  ];

  return (
    <div style={{ background: 'var(--bg-cream)', minHeight: '80vh', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
            Artisanal Mediums
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--text-dark)', marginTop: '6px', marginBottom: '12px' }}>
            Shop by Material
          </h1>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', fontSize: '0.95rem' }}>
            Explore raw materials fused with electroplating excellence and traditional hand chiseling.
          </p>
        </div>

        {/* Materials Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '1.75rem'
        }}>
          {MATERIALS_LIST.map((mat, idx) => (
            <Link
              key={idx}
              href={`/shop?material=${encodeURIComponent(mat.name)}`}
              style={{
                background: '#FFFFFF',
                borderRadius: '10px',
                padding: '28px 24px',
                border: '1px solid var(--primary-gold-border)',
                boxShadow: 'var(--shadow-sm)',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              className="material-card-hover"
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '2.5rem' }}>{mat.icon}</span>
                  <span style={{
                    fontSize: '0.68rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: 'var(--primary-gold)',
                    background: 'var(--primary-gold-light)',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontWeight: '600'
                  }}>
                    {mat.badge}
                  </span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--text-dark)', margin: '0 0 8px 0', fontWeight: '600' }}>
                  {mat.name} Products
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: '1.5' }}>
                  {mat.desc}
                </p>
              </div>

              <span className="btn-outline-gold" style={{ fontSize: '0.78rem', padding: '8px 16px', textAlign: 'center' }}>
                View {mat.name} Collection &rarr;
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
