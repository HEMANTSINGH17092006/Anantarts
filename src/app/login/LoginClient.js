'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sendOtp, verifyOtp } from '../auth/actions';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/account';

  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('identifier'); // 'identifier' or 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!identifier) {
      setError('Please enter your mobile number or email.');
      return;
    }
    setError('');
    setLoading(true);
    
    const res = await sendOtp(identifier);
    setLoading(false);
    
    if (res.success) {
      setStep('otp');
    } else {
      setError(res.message);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the OTP.');
      return;
    }
    setError('');
    setLoading(true);
    
    const res = await verifyOtp(identifier, otp);
    setLoading(false);
    
    if (res.success) {
      // Force hard navigation to clear caches and ensure middleware picks up the new cookie
      window.location.href = nextUrl;
    } else {
      setError(res.message);
    }
  };

  return (
    <div>
      {error && (
        <div style={{ background: '#FFF4F4', color: '#D32F2F', padding: '12px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '20px', border: '1px solid #FFCDD2' }}>
          {error}
        </div>
      )}

      {step === 'identifier' && (
        <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
              Mobile Number or Email
            </label>
            <input 
              type="text" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your phone or email"
              style={{
                width: '100%',
                padding: '14px',
                border: '1px solid #DDD',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: 'var(--primary-gold)',
              color: '#FFF',
              border: 'none',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'background 0.3s'
            }}
          >
            {loading ? 'Sending...' : 'Continue'}
          </button>
          <p style={{ fontSize: '0.75rem', color: '#666', textAlign: 'center', lineHeight: '1.4' }}>
            By continuing, you agree to Anant Arts' <a href="/terms-and-conditions" style={{ color: 'var(--primary-gold)' }}>Terms of Use</a> and <a href="/privacy-policy" style={{ color: 'var(--primary-gold)' }}>Privacy Policy</a>.
          </p>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <p style={{ fontSize: '0.85rem', color: '#666', margin: '0 0 8px 0' }}>
              OTP sent to <strong>{identifier}</strong>
            </p>
            <button 
              type="button" 
              onClick={() => { setStep('identifier'); setOtp(''); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary-gold)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', padding: 0 }}
            >
              Change
            </button>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
              Enter OTP
            </label>
            <input 
              type="text" 
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="6-digit code"
              maxLength={6}
              style={{
                width: '100%',
                padding: '14px',
                border: '1px solid #DDD',
                borderRadius: '8px',
                fontSize: '1.2rem',
                letterSpacing: '4px',
                textAlign: 'center',
                outline: 'none'
              }}
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading || otp.length !== 6}
            style={{
              background: 'var(--primary-gold)',
              color: '#FFF',
              border: 'none',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: (loading || otp.length !== 6) ? 'not-allowed' : 'pointer',
              opacity: (loading || otp.length !== 6) ? 0.7 : 1,
              transition: 'background 0.3s'
            }}
          >
            {loading ? 'Verifying...' : 'Verify & Login'}
          </button>
        </form>
      )}
    </div>
  );
}
