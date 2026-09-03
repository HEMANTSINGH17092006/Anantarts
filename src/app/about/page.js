import { getSettings } from '@/lib/db-helpers';
import Link from 'next/link';
import { constructMetadata } from '@/lib/seo';

export const revalidate = 3600; // Cache about page for up to 1 hour

export const metadata = constructMetadata({
  title: 'About Anant Arts — Authentic Indian Handicraft Brand & Heritage',
  description: 'Discover Anant Arts, a premier Indian handicraft brand celebrating traditional Indian craftsmanship, heritage artisans, and 24K gold electroplated art.',
  canonical: '/about',
  keywords: [
    'Indian handicraft brand',
    'handcrafted products India',
    'traditional Indian craftsmanship',
    'Indian artisans',
    'handmade Indian decor'
  ]
});

export default async function AboutPage() {
  const settings = await getSettings();
  const rawAboutText = settings.about_us_text || 'Anant Arts blends traditional craftsmanship with modern electroplating techniques to create premium decorative and gifting products. Our mission is to bring elegance, positivity, and timeless artistry into homes, workplaces, and celebrations.';
  const aboutText = rawAboutText.replace(/New Delhi/g, 'Maharashtra');

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 2rem' }}>
        
        {/* Semantic H1 Section Heading */}
        <div className="section-heading" style={{ marginBottom: '3rem' }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700' }}>
            Sacred Lineage &amp; Innovation
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 2.6rem)', color: 'var(--text-dark)', marginTop: '8px', marginBottom: '12px' }}>
            About Anant Arts — Authentic Indian Handicraft Heritage
          </h1>
          <div className="gold-line" style={{ margin: '0 auto 16px auto' }}></div>
          <p style={{ color: 'var(--text-muted)', maxWidth: '650px', margin: '0 auto', fontSize: '0.95rem' }}>
            Preserving classical Indian sculpting lineages through precision 24K gold and pure silver electroplating excellence.
          </p>
        </div>

        <div style={{ background: 'white', padding: '40px', borderRadius: '12px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ float: 'left', width: '100%', marginBottom: '24px', borderRadius: '8px', overflow: 'hidden' }}>
            <img 
              src="/uploads/our-story-artisan.jpg" 
              alt="Anant Arts Jaipur Master Artisan Sculpting Deity Forms" 
              style={{ width: '100%', height: 'auto', maxHeight: '380px', objectFit: 'cover' }}
            />
          </div>
          
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', marginBottom: '16px', color: 'var(--primary-gold-hover)' }}>
            The Essence of Anant Arts
          </h2>
          
          <p style={{ fontSize: '1rem', lineHeight: '1.8', color: 'var(--text-dark)', whiteSpace: 'pre-line', marginBottom: '24px' }}>
            {aboutText}
          </p>

          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', marginTop: '28px', marginBottom: '12px', color: 'var(--text-dark)' }}>
            Our 6-Stage Electroplating Craftsmanship
          </h3>
          <p style={{ fontSize: '0.92rem', lineHeight: '1.7', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Every Anant Arts idol begins with hand-carved wax and clay prototypes crafted according to classical Shilpa Shastra proportions. Following lost-wax brass and bell metal casting, each piece undergoes an 8-stage mirror finish polish before entering our electrical plating chambers. Here, molecular layers of certified 24K pure gold and 999 sterling silver are bonded to the base metal, followed by a high-temperature lacquer bake guard that ensures everlasting shine without tarnishing.
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid var(--primary-gold-border)', margin: '28px 0' }} />
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', textAlign: 'center' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '2rem', color: 'var(--primary-gold)' }}>15+</strong>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Traditional Artisans Supported</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '2rem', color: 'var(--primary-gold)' }}>24-Step</strong>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Quality Electroplating Check</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '2rem', color: 'var(--primary-gold)' }}>10,000+</strong>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Sacred Sanctuaries Enhanced</span>
            </div>
          </div>
        </div>

        {/* Internal Linking Row */}
        <div style={{ marginTop: '3.5rem', textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/shop" className="btn-primary btn-md">
            Explore Sacred Catalog
          </Link>
          <Link href="/materials" className="btn-secondary btn-md">
            Discover Materials &amp; Plating
          </Link>
          <Link href="/corporate-gifts" className="btn-secondary btn-md">
            Corporate Gifting Solutions
          </Link>
        </div>

      </div>
    </div>
  );
}
