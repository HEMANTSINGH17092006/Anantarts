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
      <div className="section-heading" style={{ marginTop: 0, marginBottom: '2.5rem' }}>
        <h2>Why Choose Anant Arts</h2>
        <div className="gold-line"></div>
        <p>Uncompromising craftsmanship, insured delivery, and bespoke luxury tailored to your space.</p>
      </div>

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
              borderRadius: '10px',
              padding: '24px 20px',
              border: '1px solid var(--primary-gold-border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px'
            }}
          >
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              background: 'var(--primary-gold-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-gold-hover)',
              fontSize: '1.2rem',
              flexShrink: 0
            }}>
              <i className={item.iconClass}></i>
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: 'var(--text-dark)', margin: '0 0 4px 0', fontWeight: '600' }}>
                {item.title}
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
