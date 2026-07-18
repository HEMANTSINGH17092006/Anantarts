'use client';
import { useState, useEffect } from 'react';

export default function NewsletterExitModals() {
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    // 1. Trigger newsletter pop-up after 8 seconds
    const newsletterTimer = setTimeout(() => {
      const shown = localStorage.getItem('anant_newsletter_shown');
      if (!shown) {
        setShowNewsletter(true);
        localStorage.setItem('anant_newsletter_shown', 'true');
      }
    }, 8000);

    // 2. Trigger exit intent popup when cursor leaves window top
    const handleMouseLeave = (e) => {
      if (e.clientY < 0) {
        const shown = localStorage.getItem('anant_exit_intent_shown');
        if (!shown) {
          setShowExitIntent(true);
          localStorage.setItem('anant_exit_intent_shown', 'true');
        }
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(newsletterTimer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubscribed(true);
        setEmail('');
        setTimeout(() => setShowNewsletter(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Newsletter Modal */}
      {showNewsletter && (
        <div className="admin-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
          <div className="admin-modal-content" style={{ maxWidth: '450px', width: '90%', padding: '32px', textAlign: 'center' }}>
            <span className="modal-close-btn" onClick={() => setShowNewsletter(false)}>&times;</span>
            <span className="exit-intent-logo" style={{ fontSize: '3rem', color: 'var(--primary-gold)' }}>🪷</span>
            
            {subscribed ? (
              <div style={{ marginTop: '16px' }}>
                <h2 className="newsletter-title" style={{ fontSize: '1.6rem', color: 'var(--success)', marginBottom: '8px' }}>Thank You!</h2>
                <p className="newsletter-desc" style={{ fontSize: '0.85rem' }}>Your 10% discount coupon code has been emailed to you.</p>
              </div>
            ) : (
              <>
                <h2 className="newsletter-title" style={{ fontSize: '1.6rem', margin: '1rem 0' }}>Claim Divine Blessings</h2>
                <p className="newsletter-desc" style={{ fontSize: '0.85rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                  Join the Anant Arts inner circle and get an instant <strong>10% off</strong> on your first order. Code emailed instantly.
                </p>
                <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    type="email"
                    placeholder="Your Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="newsletter-input"
                    required
                    style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid var(--primary-gold-border)' }}
                  />
                  <button type="submit" className="btn-gold" style={{ width: '100%', justifyContent: 'center' }}>
                    <i className="fas fa-gift" style={{ marginRight: '8px' }}></i> Claim My 10% Discount
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Exit Intent Modal */}
      {showExitIntent && (
        <div className="admin-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
          <div className="admin-modal-content" style={{ maxWidth: '450px', width: '90%', padding: '32px', textAlign: 'center' }}>
            <span className="modal-close-btn" onClick={() => setShowExitIntent(false)}>&times;</span>
            <span className="exit-intent-logo" style={{ fontSize: '3rem', color: 'var(--primary-gold)' }}>✨</span>
            <h2 className="newsletter-title" style={{ fontSize: '1.6rem', margin: '1rem 0' }}>Adorn Your Mandir</h2>
            <p className="newsletter-desc" style={{ fontSize: '0.85rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
              Don't miss out on placing these positive energies in your home. Use coupon code <strong style={{ color: 'var(--primary-gold-hover)' }}>DIVINE10</strong> for a flat 10% off today.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => setShowExitIntent(false)} className="btn-gold" style={{ width: '100%', justifyContent: 'center' }}>
                Continue Shopping
              </button>
              <button onClick={() => setShowExitIntent(false)} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--text-muted)', background: 'transparent', color: 'var(--text-dark)' }}>
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
