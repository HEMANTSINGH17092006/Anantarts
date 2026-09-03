'use client';
import SectionHeader from '../common/SectionHeader';

export default function WhyChooseUs() {
  const TRUST_ITEMS = [
    { title: 'Handmade Artistry', iconClass: 'fas fa-hammer', desc: 'Crafted by master traditional artisans preserving ancient heritage structures.' },
    { title: 'Premium Quality', iconClass: 'fas fa-gem', desc: '24K gold & sterling silver electroplated under precise electrical bonding.' },
    { title: 'Pan India Delivery', iconClass: 'fas fa-truck', desc: 'Insured express logistics covering 25,000+ pin codes across India.' },
    { title: 'Secure Payments', iconClass: 'fas fa-shield-alt', desc: '100% encrypted Razorpay gateway supporting UPI, Cards, NetBanking & COD.' },
    { title: 'Luxury Packaging', iconClass: 'fas fa-box-open', desc: 'Multi-layer wooden crate & velvet presentation boxes for damage-free transit.' },
    { title: 'Custom Orders', iconClass: 'fas fa-tools', desc: 'Bespoke dimensions, personalized text engravings & logo integrations.' },
    { title: 'Bulk Orders', iconClass: 'fas fa-chart-line', desc: 'Tiered wholesale volume pricing for corporate events & large functions.' },
    { title: 'Trusted Brand', iconClass: 'fas fa-award', desc: 'Adored by over 50,000+ patrons, homes, temples, and corporate houses.' }
  ];

  return (
    <section style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--section-padding-y) 2rem 0 2rem' }}>
      {/* Reusable Section Header (Issue #2) */}
      <SectionHeader
        eyebrow="Pillars of Excellence"
        title="Why Choose Anant Arts"
        subtitle="Uncompromising craftsmanship, insured express delivery, and bespoke luxury tailored to your sacred space."
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))',
        gap: '1.5rem'
      }}>
        {TRUST_ITEMS.map((item, idx) => (
          <div
            key={idx}
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md, 10px)',
              padding: '26px 22px',
              border: '1px solid var(--primary-gold-border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)'
            }}
          >
            {/* Enhanced Luxury Icon Container (Issue #16) */}
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.18) 0%, rgba(212, 175, 55, 0.06) 100%)',
              border: '1.5px solid var(--primary-gold-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-accent, #8C6D1F)',
              fontSize: '1.35rem',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(197, 160, 89, 0.12)'
            }}>
              <i className={item.iconClass}></i>
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: 'var(--color-text-primary, #1A1918)', margin: '0 0 4px 0', fontWeight: '600' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 'var(--text-sm, 0.875rem)', color: 'var(--color-text-muted, #6B655B)', margin: 0, lineHeight: '1.5' }}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
