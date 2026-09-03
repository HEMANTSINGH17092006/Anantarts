'use client';
import { useState } from 'react';

export default function LuxuryNewsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ loading: false, success: false, message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus({ loading: true, success: false, message: '' });

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus({ loading: false, success: true, message: 'Thank you for subscribing to Anant Arts Circle.' });
        setEmail('');
      } else {
        setStatus({ loading: false, success: false, message: data.error || 'Subscription failed.' });
      }
    } catch (err) {
      setStatus({ loading: false, success: false, message: 'Something went wrong.' });
    }
  };

  return (
    <section style={{
      background: 'linear-gradient(135deg, #1E1A17 0%, #14110F 100%)',
      color: '#FFFFFF',
      padding: '4.5rem 2rem',
      borderTop: '1px solid rgba(212, 175, 55, 0.25)',
      marginTop: 'var(--section-margin-top)'
    }}>
      <div style={{ maxWidth: '750px', margin: '0 auto', textAlign: 'center' }}>
        <span style={{ color: '#D4AF37', letterSpacing: '0.5px', textTransform: 'none', fontSize: 'var(--text-sm, 0.875rem)', fontWeight: '600' }}>
          Privé Art Circle
        </span>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', color: '#FFFFFF', margin: '10px 0' }}>
          Join The Anant Arts Privilege Circle
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 'var(--text-base, 0.95rem)', lineHeight: '1.6', marginBottom: '2rem' }}>
          Subscribe to receive private invitations to new artisan launches, seasonal festival catalogs, and bespoke customization previews.
        </p>

        {status.message && (
          <div style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-sm, 6px)',
            marginBottom: '1.5rem',
            fontSize: '0.84rem',
            background: status.success ? 'rgba(46, 125, 50, 0.2)' : 'rgba(198, 40, 40, 0.2)',
            border: `1px solid ${status.success ? '#2E7D32' : '#C62828'}`,
            color: '#FFFFFF'
          }}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your VIP email address..."
            style={{
              padding: '12px 20px',
              borderRadius: 'var(--radius-sm, 6px)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#FFFFFF',
              fontSize: '0.9rem',
              minWidth: '280px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            className="btn-primary btn-md"
            style={{ padding: '12px 28px', fontSize: '0.9rem' }}
            disabled={status.loading}
          >
            {status.loading ? 'Subscribing...' : 'Request Invitation'}
          </button>
        </form>
      </div>
    </section>
  );
}
