'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState(null);

  const faqs = [
    {
      q: 'What is electroplating and how is it different from normal plating?',
      a: 'Electroplating uses electric currents to fuse a micro-layered sheet of pure metallic gold (24K) or sterling silver onto brass/copper casts. This creates a highly durable, uniform coating that mimics pure solid gold, whereas normal plating uses paint or chemicals that flake off quickly.'
    },
    {
      q: 'Will the gold electroplating fade or turn black over time?',
      a: 'No. All Anant Arts sculptures undergo a specialized protective lacquer bake coating process. This shields the precious metals from humidity, moisture, and oxidation, ensuring it retains its high-gloss temple shine for decades without polishing.'
    },
    {
      q: 'What are the cleaning guidelines for these idols?',
      a: 'Simply wipe the idol gently with a dry, clean microfiber cloth. Never wash with water, soaps, or chemical cleaners, and do not use abrasive scrubbers. This will prevent scratches and preserve the lacquer guard.'
    },
    {
      q: 'How are the idols packaged to prevent damage during transit?',
      a: 'Each idol is wrapped in multiple layers of heavy bubble wrap, placed inside dense foam chambers, and reinforced with a heavy wooden crate for shipment. We carry full transit insurance, guaranteeing a free replacement in case of transit damages.'
    },
    {
      q: 'What is your return and refund policy?',
      a: 'Due to the custom craftsmanship and delicate nature of the electroplating process, we only accept returns in the case of transit damage. We ask all patrons to record a complete, unedited unboxing video upon receipt. In case of damages, send us the video within 24 hours to secure a free replacement.'
    },
    {
      q: 'Do you offer cash on delivery (COD)?',
      a: 'Yes, Cash on Delivery is available across major pincodes in India for orders below ₹50,000. For high-value custom temple sculptures, we require a partial advance deposit.'
    }
  ];

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
        
        <div className="section-heading" style={{ marginBottom: '3.5rem' }}>
          <h2>Patron FAQ Helpdesk</h2>
          <div className="gold-line"></div>
          <p>Find answers to common questions about our Jaipur craft, custom sizes, shipping guards, and ritual puja maintenance.</p>
        </div>

        {/* Accordion List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div 
                key={idx} 
                style={{ 
                  background: 'white', 
                  borderRadius: '6px', 
                  border: '1px solid var(--primary-gold-border)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Header */}
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '18px 24px',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.05rem',
                    color: 'var(--text-dark)'
                  }}
                >
                  <span>{faq.q}</span>
                  <span style={{ fontSize: '1.25rem', color: 'var(--primary-gold)' }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                {/* Body */}
                {isOpen && (
                  <div style={{ 
                    padding: '0 24px 20px 24px', 
                    fontSize: '0.88rem', 
                    lineHeight: '1.6', 
                    color: 'var(--text-muted)',
                    borderTop: '1px solid rgba(212,175,55,0.1)'
                  }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '4rem', textAlign: 'center', background: 'var(--bg-cream-dark)', padding: '24px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', marginBottom: '8px' }}>Have more specific questions?</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Our temple artisans and care team are online on WhatsApp.</p>
          <Link href="/contact" className="btn-gold" style={{ fontSize: '0.8rem', padding: '10px 20px' }}>Contact Support</Link>
        </div>

      </div>
    </div>
  );
}
