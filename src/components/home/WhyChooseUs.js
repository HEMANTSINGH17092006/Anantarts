export default function WhyChooseUs() {
  const TRUST_ITEMS = [
    { title: 'Handmade Artistry', icon: '🔨', desc: 'Crafted by master traditional artisans preserving ancient heritage structures.' },
    { title: 'Premium Quality', icon: '✨', desc: '24K gold & sterling silver electroplated under precise electrical bonding.' },
    { title: 'Pan India Delivery', icon: '🚚', desc: 'Insured express logistics covering 25,000+ pin codes across India.' },
    { title: 'Secure Payments', icon: '🔒', desc: '100% encrypted Razorpay gateway supporting UPI, Cards, NetBanking & COD.' },
    { title: 'Luxury Packaging', icon: '📦', desc: 'Multi-layer wooden crate & velvet presentation boxes for damage-free transit.' },
    { title: 'Custom Orders', icon: '🛠️', desc: 'Bespoke dimensions, personalized text engravings & logo integrations.' },
    { title: 'Bulk Orders', icon: '📈', desc: 'Tiered wholesale volume pricing for corporate events & large functions.' },
    { title: 'Trusted Brand', icon: '⭐', desc: 'Adored by over 50,000+ patrons, homes, temples, and corporate houses.' }
  ];

  return (
    <section style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--section-padding-y) 2rem 0 2rem' }}>
      <div className="section-heading" style={{ marginTop: 0, marginBottom: '2.5rem' }}>
        <h2>Why Choose Anant Arts</h2>
        <div className="gold-line"></div>
        <p>Uncompromising craftsmanship, insured delivery, and bespoke luxury tailored to your space.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '1.5rem'
      }}>
        {TRUST_ITEMS.map((item, idx) => (
          <div
            key={idx}
            style={{
              background: '#FFFFFF',
              borderRadius: '10px',
              padding: '24px 20px',
              border: '1px solid var(--primary-gold-border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px'
            }}
          >
            <span style={{ fontSize: '2.2rem', lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: 'var(--text-dark)', margin: '0 0 4px 0', fontWeight: '600' }}>
                ✓ {item.title}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.45' }}>
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
