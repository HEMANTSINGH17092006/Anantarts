'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginCustomer, sendOtp, setPasswordWithOtp } from '../auth/actions';
import Link from 'next/link';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/account';

  const [mode, setMode] = useState('login'); // 'login' | 'set_password_request' | 'set_password_verify'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Set Password via OTP states
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your email or mobile number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const res = await loginCustomer(identifier, password);
    setLoading(false);

    if (res.success) {
      window.location.href = nextUrl;
    } else {
      if (res.requiresPasswordSet) {
        setError(res.message);
      } else {
        setError(res.message);
      }
    }
  };

  const handleRequestOtpForSetPassword = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your email or mobile number.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const res = await sendOtp(identifier);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Verification code sent to ' + identifier);
      setMode('set_password_verify');
    } else {
      setError(res.message);
    }
  };

  const handleSetPasswordWithOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the OTP code.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setLoading(true);

    const res = await setPasswordWithOtp(identifier, otp, newPassword);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        window.location.href = nextUrl;
      }, 1000);
    } else {
      setError(res.message);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px',
    border: '1px solid #DDD',
    borderRadius: '8px',
    fontSize: '1rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  return (
    <div>
      {error && (
        <div style={{ background: '#FFF4F4', color: '#D32F2F', padding: '12px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '20px', border: '1px solid #FFCDD2' }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{ background: '#E8F5E9', color: '#2E7D32', padding: '12px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '20px', border: '1px solid #C8E6C9' }}>
          {successMsg}
        </div>
      )}

      {/* MODE 1: STANDARD PASSWORD LOGIN */}
      {mode === 'login' && (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px', color: '#333' }}>
              Email or Mobile Number
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your email or phone"
              style={inputStyle}
              required
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#333' }}>
                Password
              </label>
              <button
                type="button"
                onClick={() => { setError(''); setSuccessMsg(''); setMode('set_password_request'); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary-gold, #D4AF37)', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
              >
                Set/Forgot Password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ ...inputStyle, paddingRight: '44px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#999',
                  fontSize: '0.9rem',
                  padding: '4px',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--primary-gold, #D4AF37)',
              color: '#FFF',
              border: 'none',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.3s',
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p style={{ fontSize: '0.73rem', color: '#666', textAlign: 'center', lineHeight: '1.5', margin: '0' }}>
            By logging in, you agree to Anant Arts&apos; <a href="/terms-and-conditions" style={{ color: 'var(--primary-gold, #D4AF37)' }}>Terms of Use</a> and <a href="/privacy-policy" style={{ color: 'var(--primary-gold, #D4AF37)' }}>Privacy Policy</a>.
          </p>

          <div style={{ textAlign: 'center', paddingTop: '16px', borderTop: '1px solid #EEE' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
              New to Anant Arts?{' '}
              <Link href={`/register${nextUrl !== '/account' ? `?next=${encodeURIComponent(nextUrl)}` : ''}`} style={{ color: 'var(--primary-gold, #D4AF37)', fontWeight: '600', textDecoration: 'none' }}>
                Create Account
              </Link>
            </p>
          </div>
        </form>
      )}

      {/* MODE 2: REQUEST OTP FOR SET/RESET PASSWORD */}
      {mode === 'set_password_request' && (
        <form onSubmit={handleRequestOtpForSetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#333' }}>Set Account Password</h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#666' }}>
              Enter your registered email or phone number to receive a verification code.
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px', color: '#333' }}>
              Email or Mobile Number
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your email or phone"
              style={inputStyle}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--primary-gold, #D4AF37)',
              color: '#FFF',
              border: 'none',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Sending Code...' : 'Send Verification Code'}
          </button>

          <button
            type="button"
            onClick={() => { setError(''); setMode('login'); }}
            style={{ background: 'none', border: 'none', color: '#666', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            ← Back to Login
          </button>
        </form>
      )}

      {/* MODE 3: VERIFY OTP AND SET NEW PASSWORD */}
      {mode === 'set_password_verify' && (
        <form onSubmit={handleSetPasswordWithOtp} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#333' }}>Create New Password</h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#666' }}>
              Verification code sent to <strong>{identifier}</strong>
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px', color: '#333' }}>
              Enter OTP Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="6-digit code"
              maxLength={6}
              style={{ ...inputStyle, letterSpacing: '4px', textAlign: 'center', fontSize: '1.2rem' }}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px', color: '#333' }}>
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px', color: '#333' }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Re-enter new password"
              style={inputStyle}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'var(--primary-gold, #D4AF37)',
              color: '#FFF',
              border: 'none',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Setting Password...' : 'Save Password & Login'}
          </button>

          <button
            type="button"
            onClick={() => { setError(''); setMode('login'); }}
            style={{ background: 'none', border: 'none', color: '#666', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            ← Back to Login
          </button>
        </form>
      )}
    </div>
  );
}
