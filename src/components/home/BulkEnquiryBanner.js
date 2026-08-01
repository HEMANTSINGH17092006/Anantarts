'use client';
import Link from 'next/link';

export default function BulkEnquiryBanner() {
  return (
    <section style={{
      background: 'linear-gradient(135deg, #1C1917 0%, #292524 100%)',
      color: '#FFFFFF',
      padding: '3.5rem 2rem',
      borderRadius: '16px',
      margin: '4rem auto',
      maxWidth: '1280px',
      border: '1px solid var(--primary-gold-border)',
      boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '2rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1 1 300px', maxWidth: '640px' }}>
          <span style={{
            color: '#D4AF37',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            fontSize: '0.78rem',
            fontWeight: '700'
          }}>
            B2B &amp; Corporate Wholesale
          </span>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '1.9rem',
            color: '#FFFFFF',
            margin: '6px 0 10px 0',
            lineHeight: '1.3'
          }}>
            Planning Bulk Gifts, Weddings, or Corporate Events?
          </h2>
          <p style={{
            fontSize: '0.92rem',
            color: 'rgba(255,255,255,0.85)',
            margin: 0,
            lineHeight: '1.6'
          }}>
            Get custom logo engraving, luxury velvet presentation boxes, and tiered wholesale pricing with insured pan-India delivery.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link 
            href="/corporate-gifts" 
            className="btn-saffron" 
            style={{ padding: '12px 28px', fontSize: '0.88rem' }}
          >
            <i className="fas fa-briefcase" style={{ marginRight: '8px' }}></i> Request Bulk Quote
          </Link>

          <a 
            href="https://wa.me/917275819354?text=Hi%20Anant%20Arts%20team%2C%20I%20want%20to%20enquire%20about%20a%20bulk%20order."
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline-gold" 
            style={{ padding: '11px 24px', fontSize: '0.88rem', color: '#FFFFFF', borderColor: '#D4AF37' }}
          >
            <i className="fab fa-whatsapp" style={{ marginRight: '8px', color: '#25D366' }}></i> Instant WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
