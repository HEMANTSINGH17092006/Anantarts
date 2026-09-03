'use client';
import Link from 'next/link';

export default function CollectionHero({ categoryName, categoryDescription, categoryBanner }) {
  const title = categoryName ? `${categoryName}` : 'Handicrafts Online India — Handcrafted Idols & Décor';
  const subtitle = categoryDescription || 'Shop authentic handicrafts online in India. Explore master-crafted 24K gold god idols, handmade wooden home décor, and traditional Indian handicrafts with insured shipping.';
  const bgImage = categoryBanner || '/uploads/mandir-hero-bg.jpg';

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      padding: '4.5rem 2rem 3.5rem 2rem',
      backgroundColor: '#1E1A17',
      color: '#FFFFFF',
      overflow: 'hidden',
      borderBottom: '2px solid #D4AF37'
    }}>
      {/* Background Image */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.35,
        zIndex: 1
      }} />

      {/* Dark Gradient Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(20,17,15,0.4) 0%, rgba(20,17,15,0.92) 100%)',
        zIndex: 2
      }} />

      <div style={{ position: 'relative', zIndex: 3, maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
        
        {/* Breadcrumb Trail */}
        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Home</Link>
          <span>&gt;</span>
          <Link href="/shop" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Shop</Link>
          {categoryName && (
            <>
              <span>&gt;</span>
              <span style={{ color: '#D4AF37', fontWeight: '600' }}>{categoryName}</span>
            </>
          )}
        </div>

        <span style={{
          color: '#D4AF37',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          fontSize: '0.78rem',
          fontWeight: '700',
          background: 'rgba(212,175,55,0.15)',
          padding: '4px 14px',
          borderRadius: '12px',
          border: '1px solid rgba(212,175,55,0.3)',
          display: 'inline-block',
          marginBottom: '10px'
        }}>
          Handcrafted Portfolio
        </span>

        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.4rem', color: '#FFFFFF', margin: '0 0 10px 0', lineHeight: '1.2' }}>
          {title}
        </h1>

        <p style={{ color: 'rgba(255,255,255,0.85)', maxWidth: '720px', margin: '0 auto', fontSize: '0.92rem', lineHeight: '1.6' }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}
