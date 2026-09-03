import { constructMetadata } from '@/lib/seo';
import ConsultationClient from '@/components/consultation/ConsultationClient';
import Link from 'next/link';

export const revalidate = 3600;

export const metadata = constructMetadata({
  title: 'Mandir Vastu & Pooja Room Design Consultation | Anant Arts',
  description: 'Book a bespoke pooja room design session with Jaipur temple sthapatis and Vastu experts. Custom dimensions, deity alignment, and 24K gold plating.',
  canonical: '/consultation',
});

export default function ConsultationPage() {
  return (
    <div style={{ background: 'var(--bg-cream)', padding: '5rem 0', minHeight: '80vh' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', padding: '0 2rem' }}>
        
        {/* Banner Card */}
        <div style={{
          background: 'var(--luxury-gradient)',
          color: 'white',
          borderRadius: '12px',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--primary-gold-border)',
          marginBottom: '3rem'
        }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '4px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '600' }}>
            Sacred Vastu Design
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 2.6rem)', color: 'white', marginTop: '10px', marginBottom: '15px' }}>
            Bespoke Pooja Room Consultation
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', lineHeight: '1.7', maxWidth: '600px', margin: '0 auto' }}>
            Consult with our traditional temple sthapatis and Jaipur lineage design experts to customize temple layouts, select proper deities, and align features with shastra guidelines.
          </p>
        </div>

        <ConsultationClient />

        <div style={{ marginTop: '3.5rem', textAlign: 'center', padding: '32px', background: 'white', borderRadius: '12px', border: '1px solid var(--primary-gold-border)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: '8px' }}>
            Explore Core Deity Collections
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '600px', margin: '0 auto 20px auto' }}>
            Discover our complete portfolio of handcrafted 24K gold and pure silver electroplated murtis before your consultation.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/shop" className="btn-primary btn-md">Explore All Idols</Link>
            <Link href="/materials" className="btn-secondary btn-md">Materials Guide</Link>
            <Link href="/faq" className="btn-secondary btn-md">Care &amp; Placement FAQ</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
