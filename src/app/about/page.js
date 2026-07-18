import { getSettings } from '@/lib/db-helpers';
import Link from 'next/link';

export const revalidate = 3600; // Cache about page for up to 1 hour

export default async function AboutPage() {
  const settings = await getSettings();
  const rawAboutText = settings.about_us_text || 'Anant Arts blends traditional craftsmanship with modern electroplating techniques to create premium decorative and gifting products. Our mission is to bring elegance, positivity, and timeless artistry into homes, workplaces, and celebrations.';
  const aboutText = rawAboutText.replace(/New Delhi/g, 'Maharashtra');

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
        
        <div className="section-heading" style={{ marginBottom: '3rem' }}>
          <h2>Our Story</h2>
          <div className="gold-line"></div>
          <p>Blending traditional artistry with modern electroplating excellence.</p>
        </div>

        <div style={{ background: 'white', padding: '40px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ float: 'left', width: '100%', marginBottom: '20px', borderRadius: '8px', overflow: 'hidden' }}>
            <img 
              src="/uploads/our-story-artisan.jpg" 
              alt="Craftsmanship" 
              style={{ width: '100%', height: 'auto', maxHeight: '350px', objectFit: 'cover' }}
            />
          </div>
          
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '16px', color: 'var(--primary-gold-hover)' }}>
            The Essence of Anant Arts
          </h3>
          
          <p style={{ fontSize: '0.95rem', lineHeight: '1.8', color: 'var(--text-dark)', whiteSpace: 'pre-line', marginBottom: '24px' }}>
            {aboutText}
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid var(--primary-gold-border)', margin: '24px 0' }} />
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', textAlign: 'center' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '1.8rem', color: 'var(--primary-gold)' }}>15+</strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Traditional Artisans Supported</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '1.8rem', color: 'var(--primary-gold)' }}>24-Step</strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Quality Electroplating Check</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '1.8rem', color: 'var(--primary-gold)' }}>10,000+</strong>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Spaces Enhanced Globally</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
          <Link href="/shop" className="btn-gold">Explore Collections</Link>
        </div>

      </div>
    </div>
  );
}
