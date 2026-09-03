import Link from 'next/link';
import { constructMetadata } from '@/lib/seo';

export const revalidate = 3600;

export const metadata = constructMetadata({
  title: 'Shop by Material — Brass, 24K Gold & Teak Handicrafts | Anant Arts',
  description: 'Discover Indian handicraft materials: authentic brass idols, 24K gold plated god statues, seasoned teak wooden handicrafts, and silver electroplated art.',
  canonical: '/materials',
  keywords: [
    'brass idols',
    'brass handicrafts',
    'gold plated idols',
    'wooden handicrafts',
    'handcrafted materials',
    'Indian handicraft materials'
  ]
});

export default function MaterialsPage() {
  const MATERIALS_LIST = [
    { name: 'Wood', icon: '🪵', badge: 'Artisanal Carved', desc: 'Seasoned rosewood and teak wood hand-carved with traditional jali patterns for home mandirs and wall art.' },
    { name: 'Resin', icon: '🧪', badge: 'Precision Composite', desc: 'High-density marble composite molding finished with multi-layer metallic plating for flawless detailing.' },
    { name: 'Metal', icon: '⚙️', badge: 'Industrial Alloy', desc: 'Durable bronze, copper, and cast alloys with hand-burnished highlights and antique finishes.' },
    { name: 'Marble', icon: '🏛️', badge: 'Rajasthan Sculpted', desc: 'Pure white Makrana marble hand chiseling and delicate polychrome inlay by heritage artisans.' },
    { name: 'Brass', icon: '🔔', badge: 'Heavy Bell Metal', desc: 'Authentic lost-wax cast bell metal brass known for resonant purity and eternal temple longevity.' },
    { name: 'Silver Plated', icon: '🥈', badge: 'Pure Sterling', desc: 'Electrolytically bonded with 999 sterling silver micro-sheets and sealed with protective lacquer.' },
    { name: 'Gold Plated', icon: '🥇', badge: '24K Fine Gold', desc: 'Electroplated with 24K pure fine gold for permanent radiant shine that never tarnishes.' },
    { name: 'MDF', icon: '📐', badge: 'Laser Engineered', desc: 'Precision laser-cut wooden MDF layers with metallic foil accents and gold foil mandir borders.' },
    { name: 'Glass', icon: '💎', badge: 'Crystal Finish', desc: 'Hand-blown crystal pedestals and glass cloches protecting delicate deity artwork.' },
    { name: 'Mixed Materials', icon: '🎨', badge: 'Fusion Masterpiece', desc: 'Harmonious fusion combining seasoned teak wood, cast brass, and 24K gold electroplated highlights.' }
  ];

  return (
    <div style={{ background: 'var(--bg-cream)', minHeight: '80vh', padding: '4rem 2rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        
        {/* Page Header */}
        <div className="section-heading" style={{ marginBottom: '3.5rem' }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
            Artisanal Mediums &amp; Metallurgy
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 2.6rem)', color: 'var(--text-dark)', marginTop: '8px', marginBottom: '12px' }}>
            Shop by Material &amp; Craftsmanship
          </h1>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto', fontSize: '0.95rem' }}>
            Explore raw natural mediums elevated through centuries-old sculpting lineages and modern 24K gold electroplating excellence.
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
                borderRadius: '12px',
                padding: '28px 24px',
                border: '1px solid var(--primary-gold-border)',
                boxShadow: 'var(--shadow-sm)',
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              className="featured-collection-card"
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '2.5rem' }}>{mat.icon}</span>
                  <span style={{
                    fontSize: '0.7rem',
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
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--text-dark)', margin: '0 0 8px 0', fontWeight: '600' }}>
                  {mat.name} Art
                </h2>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '0 0 20px 0', lineHeight: '1.6' }}>
                  {mat.desc}
                </p>
              </div>

              <span className="btn-secondary btn-sm" style={{ textAlign: 'center', width: '100%' }}>
                View {mat.name} Products &rarr;
              </span>
            </Link>
          ))}
        </div>

        {/* Material Guide & Care Knowledge Section */}
        <div style={{ marginTop: '4.5rem', background: 'white', padding: '40px', borderRadius: '12px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', marginBottom: '12px', color: 'var(--text-dark)' }}>
            Understanding 24K Gold Electroplating vs Traditional Plating
          </h2>
          <p style={{ fontSize: '0.92rem', lineHeight: '1.8', color: 'var(--text-dark)', marginBottom: '20px' }}>
            Unlike flash dip plating or chemical gold foil transfers, Anant Arts uses state-of-the-art multi-stage electro-deposition. Pure 24-karat gold and 999 sterling silver are molecularly bonded to a cast brass or bronze foundation under controlled electrical current. This creates an impenetrable precious metal layer that maintains full luster, sharp facial contours, and sacred reverence for generations.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '24px' }}>
            <div style={{ padding: '20px', background: 'var(--bg-cream)', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: 'var(--primary-gold-hover)' }}>✨ Lacquer Bake Guard</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>Every sculpture is sealed with an optical-grade baked lacquer coat protecting against atmospheric oxidation and humidity.</p>
            </div>
            <div style={{ padding: '20px', background: 'var(--bg-cream)', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: 'var(--primary-gold-hover)' }}>🪵 Seasoned Woods</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>Wooden temple structures utilize kiln-dried teak and sheesham to prevent warping or cracking under climate changes.</p>
            </div>
            <div style={{ padding: '20px', background: 'var(--bg-cream)', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '8px', color: 'var(--primary-gold-hover)' }}>🪔 Ritual Puja Safety</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>Designed for daily dhyana and aarti. Simply wipe gently with a dry microfiber cloth to keep it eternally radiant.</p>
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/shop" className="btn-primary btn-md">Shop Complete Catalog</Link>
            <Link href="/collections" className="btn-secondary btn-md">Explore Collections</Link>
            <Link href="/occasions" className="btn-secondary btn-md">Shop by Occasion</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
