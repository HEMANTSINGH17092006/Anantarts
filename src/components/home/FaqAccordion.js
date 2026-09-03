'use client';
import { useState } from 'react';
import Link from 'next/link';
import SectionHeader from '../common/SectionHeader';

const FAQS = [
  {
    q: 'How is 24K Gold Electroplating done on idols?',
    a: 'Our idols undergo a multi-layer precision electro-chemical bonding process. A foundational copper/nickel layer ensures micro-smoothness, followed by a thick 24K gold deposition layer that provides enduring luster without tarnishing or flaking under normal mandir conditions.'
  },
  {
    q: 'Are these idols suitable for everyday home pooja and abhishekam?',
    a: 'Yes! Our solid brass and electroplated murtis are designed for daily devotion. For cleaning, we recommend wiping gently with a soft micro-fiber cloth. Avoid harsh chemicals or abrasive metal polishes.'
  },
  {
    q: 'How is safe transit guaranteed across India?',
    a: 'Every shipment is covered under 100% Transit Insurance. We use multi-layer bubble cushioning, custom-molded foam inserts, and reinforced wooden shipping crates to prevent any damage during transit.'
  },
  {
    q: 'What is your Video Unboxing Guarantee policy?',
    a: 'If your idol or wooden handicraft arrives damaged, simply record a continuous video while opening the outer package and unboxing the product. Send it to our support team on WhatsApp within 48 hours for an instant, hassle-free free replacement.'
  },
  {
    q: 'Do you offer bulk corporate gifting or custom dimensions?',
    a: 'Absolutely! We specialize in customized corporate identity plaques, logo-embossed brass desk accents, and bespoke temple dimensions. Visit our Corporate Gifts page or contact our team directly.'
  }
];

export default function FaqAccordion() {
  const [openIdx, setOpenIdx] = useState(0);

  const toggle = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: 'var(--section-padding-y) 2rem'
    }}>
      {/* Reusable Section Header (Issue #2, #18) */}
      <SectionHeader
        eyebrow="Customer Assurance &amp; Queries"
        title="Frequently Asked Questions"
        subtitle="Common questions regarding our electroplating process, care, shipping safety, and authenticity."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              style={{
                background: '#FFFFFF',
                borderRadius: '10px',
                border: '1px solid var(--primary-gold-border)',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
                transition: 'all 0.25s ease'
              }}
            >
              <button
                onClick={() => toggle(idx)}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: isOpen ? 'var(--saffron-dark)' : 'var(--text-dark)'
                }}>
                  {faq.q}
                </span>
                <i
                  className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}
                  style={{
                    color: 'var(--primary-gold)',
                    fontSize: '0.9rem',
                    transition: 'transform 0.2s ease'
                  }}
                ></i>
              </button>

              {isOpen && (
                <div style={{
                  padding: '0 24px 20px 24px',
                  fontSize: '0.92rem',
                  color: 'var(--text-muted)',
                  lineHeight: '1.7',
                  borderTop: '1px solid rgba(212, 175, 55, 0.15)',
                  paddingTop: '16px'
                }}>
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
        <Link href="/faq" className="btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span>View Complete FAQ Helpdesk &amp; Care Guidelines</span>
          <span>&rarr;</span>
        </Link>
      </div>
    </section>
  );
}
