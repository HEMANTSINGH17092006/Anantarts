'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function UnsubscribeClient() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const sig = searchParams.get('sig') || '';

  const [email, setEmail] = useState('');
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [reason, setReason] = useState('Too frequent');
  const [customReason, setCustomReason] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please provide a valid email address.');
      return;
    }

    setStatus('submitting');
    try {
      const finalReason = reason === 'Other' ? (customReason || 'Other') : reason;
      const res = await fetch('/api/marketing/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token,
          sig,
          email_marketing_opt_in: emailOptIn ? 1 : 0,
          whatsapp_marketing_opt_in: whatsappOptIn ? 1 : 0,
          unsubscribe_reason: finalReason
        })
      });

      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage(
          !emailOptIn && !whatsappOptIn
            ? 'You have been successfully unsubscribed from marketing communications.'
            : 'Your communication preferences have been successfully updated.'
        );
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to update preferences.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  const handleUnsubscribeAll = () => {
    setEmailOptIn(false);
    setWhatsappOptIn(false);
    handleSubmit();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #FAF9F6 0%, #F5ECD7 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: "'Poppins', sans-serif"
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        boxShadow: '0 10px 40px rgba(59, 47, 47, 0.08)',
        overflow: 'hidden'
      }}>
        
        {/* Brand Banner */}
        <div style={{
          background: 'linear-gradient(180deg, #0A0A0A 0%, #171513 100%)',
          padding: '28px 24px',
          textAlign: 'center',
          borderBottom: '2px solid #D4AF37'
        }}>
          <span style={{ fontSize: '2rem', display: 'inline-block', filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.5))' }}>🪷</span>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            color: '#D4AF37',
            fontSize: '1.5rem',
            margin: '8px 0 2px 0',
            letterSpacing: '1px'
          }}>
            Anant Arts
          </h1>
          <p style={{
            margin: 0,
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.72rem',
            letterSpacing: '2px',
            textTransform: 'uppercase'
          }}>
            Communication Preferences
          </p>
        </div>

        {/* Content Area */}
        <div style={{ padding: '32px 28px' }}>
          {status === 'success' ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#E8F5E9',
                color: '#2E7D32',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                margin: '0 auto 16px auto'
              }}>
                ✓
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.4rem', color: '#1E1A17', margin: '0 0 8px 0' }}>
                Preferences Updated
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#6E5A5A', lineHeight: '1.6', marginBottom: '24px' }}>
                {message}
              </p>
              <p style={{ fontSize: '0.78rem', color: '#888', marginBottom: '24px', background: '#FAF9F6', padding: '12px', borderRadius: '8px', border: '1px solid #EEE' }}>
                Please note: You will still receive essential transactional emails regarding your orders, payments, and delivery tracking.
              </p>
              <Link href="/" style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)',
                color: '#111',
                fontWeight: '700',
                textDecoration: 'none',
                padding: '12px 28px',
                borderRadius: '6px',
                fontSize: '0.85rem'
              }}>
                Return to Storefront
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: '#1E1A17', margin: '0 0 8px 0' }}>
                Manage Your Subscriptions
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#6E5A5A', lineHeight: '1.6', marginBottom: '24px' }}>
                We respect your sacred time. Choose what communications you wish to receive from Anant Arts.
              </p>

              {status === 'error' && (
                <div style={{
                  background: '#FFEBEE',
                  border: '1px solid #FFCDD2',
                  color: '#C62828',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  marginBottom: '18px'
                }}>
                  {message}
                </div>
              )}

              {/* Email Input */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#3B2F2F', marginBottom: '6px' }}>
                  Your Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #D4AF37',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Checkbox Preferences */}
              <div style={{ background: '#FAF9F6', padding: '16px', borderRadius: '8px', border: '1px solid #EAE3D2', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginBottom: '12px' }}>
                  <input
                    type="checkbox"
                    checked={emailOptIn}
                    onChange={(e) => setEmailOptIn(e.target.checked)}
                    style={{ marginTop: '3px', accentColor: '#AA7C11' }}
                  />
                  <div>
                    <strong style={{ fontSize: '0.84rem', color: '#1E1A17', display: 'block' }}>Email Marketing & New Collections</strong>
                    <span style={{ fontSize: '0.74rem', color: '#6E5A5A' }}>Receive curated announcements of sacred 24K gold sculptures and festival collections.</span>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={whatsappOptIn}
                    onChange={(e) => setWhatsappOptIn(e.target.checked)}
                    style={{ marginTop: '3px', accentColor: '#AA7C11' }}
                  />
                  <div>
                    <strong style={{ fontSize: '0.84rem', color: '#1E1A17', display: 'block' }}>WhatsApp VIP Alerts & Auspicious Offers</strong>
                    <span style={{ fontSize: '0.74rem', color: '#6E5A5A' }}>Direct messages for festive blessings and exclusive order follow-ups.</span>
                  </div>
                </label>
              </div>

              {/* Feedback reason */}
              {(!emailOptIn && !whatsappOptIn) && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#3B2F2F', marginBottom: '6px' }}>
                    Reason for unsubscribing (Optional)
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #CCC',
                      fontSize: '0.82rem',
                      marginBottom: '8px',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Too frequent">Emails are too frequent</option>
                    <option value="Not relevant">Content is not relevant to me</option>
                    <option value="Never signed up">I did not subscribe</option>
                    <option value="No longer interested">No longer interested in spiritual sculptures</option>
                    <option value="Other">Other</option>
                  </select>

                  {reason === 'Other' && (
                    <input
                      type="text"
                      placeholder="Please let us know how we can improve..."
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #CCC',
                        fontSize: '0.82rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)',
                    color: '#111',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(212,175,55,0.25)'
                  }}
                >
                  {status === 'submitting' ? 'Updating...' : 'Save Communication Preferences'}
                </button>

                {(emailOptIn || whatsappOptIn) && (
                  <button
                    type="button"
                    onClick={handleUnsubscribeAll}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      background: 'none',
                      color: '#C62828',
                      border: '1px solid rgba(198,40,40,0.3)',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Unsubscribe from All Marketing Communications
                  </button>
                )}
              </div>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link href="/" style={{ fontSize: '0.78rem', color: '#AA7C11', textDecoration: 'underline' }}>
                  Return to Anant Arts Store
                </Link>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
