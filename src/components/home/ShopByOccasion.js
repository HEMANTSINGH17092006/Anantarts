'use client';
import Link from 'next/link';

const OCCASIONS = [
  { name: 'Housewarming', icon: '🏡', desc: 'Auspicious decor & blessing idols for new homes' },
  { name: 'Wedding', icon: '💍', desc: 'Luxury divine sculptures & heirloom return gifts' },
  { name: 'Anniversary', icon: '❤️', desc: 'Golden keepsakes & timeless artisan masterpieces' },
  { name: 'Birthday', icon: '🎂', desc: 'Thoughtful customized art & personal desk accessories' },
  { name: 'Corporate Events', icon: '💼', desc: 'Executive awards, logo plaques & business tokens' },
  { name: 'Diwali', icon: '🪔', desc: 'Festive gold-plated Ganesha Lakshmi & puja thali' },
  { name: 'Ganesh Chaturthi', icon: '🐘', desc: 'Magnificent 24K gold & silver electroplated idols' },
  { name: 'Christmas', icon: '🎄', desc: 'Festive collectibles & luxury holiday hampers' },
  { name: 'New Year', icon: '🎆', desc: 'Prosperity symbols & inspirational desk decor' },
  { name: 'Employee Appreciation', icon: '🌟', desc: 'Milestone trophies, custom boxes & volume gifts' },
];

export default function ShopByOccasion() {
  return (
    <section style={{ maxWidth: '1280px', margin: '0 auto var(--section-margin-bottom) auto', padding: '0 2rem' }}>
      <div className="section-heading" style={{ marginTop: 'var(--section-margin-top)', marginBottom: '2.5rem' }}>
        <h2>Shop by Occasion</h2>
        <div className="gold-line"></div>
        <p>Curated handcrafted collections tailored for life’s special celebrations and corporate milestones.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '1.25rem'
      }}>
        {OCCASIONS.map((occ, idx) => (
          <Link
            key={idx}
            href={`/shop?occasion=${encodeURIComponent(occ.name)}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '22px 18px',
              borderRadius: '8px',
              background: '#FFFFFF',
              border: '1px solid var(--primary-gold-border)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              textDecoration: 'none',
              position: 'relative',
              overflow: 'hidden'
            }}
            className="occasion-card-hover"
          >
            <span style={{ fontSize: '2.2rem', marginBottom: '10px' }}>{occ.icon}</span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: 'var(--text-dark)', margin: '0 0 6px 0', fontWeight: '600' }}>
              {occ.name}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
              {occ.desc}
            </p>
            <span style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--primary-gold)', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Explore Collection &rarr;
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
