'use client';
import Link from 'next/link';

export default function SpiritualStorySection() {
  return (
    <section style={{
      background: 'linear-gradient(135deg, #FFFBF7 0%, #FAF6F0 100%)',
      borderTop: '1px solid rgba(212, 175, 55, 0.25)',
      borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
      padding: '5rem 2rem',
      margin: '4rem 0'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
        gap: '4rem',
        alignItems: 'center'
      }}>
        
        {/* Left Column: Visual Showcase Card */}
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 16px 40px rgba(59, 47, 47, 0.12)',
            border: '2px solid rgba(212, 175, 55, 0.3)'
          }}>
            <img 
              src="/uploads/artisan-chisel.png" 
              alt="Anant Arts Artisan Craftsmanship" 
              style={{
                width: '100%',
                height: '420px',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(28,25,23,0.1) 0%, rgba(28,25,23,0.7) 100%)',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '2rem'
            }}>
              <div style={{ color: '#FFFFFF' }}>
                <span style={{
                  color: '#D4AF37',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  fontSize: '0.75rem',
                  fontWeight: '700'
                }}>
                  Traditional Master Sculpting
                </span>
                <h3 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.4rem',
                  color: '#FFFFFF',
                  margin: '4px 0 0 0'
                }}>
                  Preserving Sacred Indian Artistry
                </h3>
              </div>
            </div>
          </div>

          {/* Floating Badge */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            background: '#FFFFFF',
            border: '1.5px solid #D4AF37',
            borderRadius: '12px',
            padding: '12px 20px',
            boxShadow: '0 8px 24px rgba(212, 175, 55, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '1.8rem' }}>⚜️</span>
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-dark)' }}>24K Gold Plated</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Precision Bonded</div>
            </div>
          </div>
        </div>

        {/* Right Column: Story Text & Values */}
        <div>
          <span style={{
            color: 'var(--saffron-dark)',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            fontSize: '0.8rem',
            display: 'inline-block',
            marginBottom: '8px'
          }}>
            Our Devotional Legacy
          </span>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '2.4rem',
            lineHeight: '1.25',
            color: 'var(--text-dark)',
            marginBottom: '1.25rem'
          }}>
            Bringing Sacred Energy &amp; Divine Grace into Everyday Life
          </h2>
          <p style={{
            fontSize: '0.98rem',
            color: 'var(--text-muted)',
            lineHeight: '1.8',
            marginBottom: '1.5rem'
          }}>
            At <strong>Anant Arts</strong>, we bridge centuries of traditional temple sculpting with modern electroplating technology. Each murti, idol, and wooden carving is crafted with deep reverence, devotion, and precise attention to iconographic detail.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.4rem' }}>🪷</span>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: '700', margin: '0 0 2px 0' }}>100% Authentic</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Genuine brass, teakwood &amp; gold plating.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '1.4rem' }}>🛡️</span>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: '700', margin: '0 0 2px 0' }}>Damage-Free Transit</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Multi-layer wooden crate packaging.</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/about" className="btn-saffron" style={{ padding: '12px 28px', fontSize: '0.88rem' }}>
              Read Our Story <i className="fas fa-arrow-right" style={{ marginLeft: '6px' }}></i>
            </Link>
            <Link href="/shop" className="btn-outline-gold" style={{ padding: '11px 24px', fontSize: '0.88rem' }}>
              Explore Collection
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
