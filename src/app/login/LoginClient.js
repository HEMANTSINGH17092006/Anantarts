'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginCustomer } from '../auth/actions';
import Link from 'next/link';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/account';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    setLoading(true);

    const res = await loginCustomer(identifier, password);
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

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Email or Phone */}
        <div>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px', color: '#333' }}>
            Email or Mobile Number
          </label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Enter your email or phone"
            style={{
              width: '100%',
              padding: '14px',
              border: '1px solid #DDD',
              borderRadius: '8px',
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
            required
          />
        </div>

        {/* Password */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#333' }}>
              Password
            </label>
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '14px',
                paddingRight: '44px',
                border: '1px solid #DDD',
                borderRadius: '8px',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
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

        {/* Submit */}
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

        {/* Terms */}
        <p style={{ fontSize: '0.73rem', color: '#666', textAlign: 'center', lineHeight: '1.5', margin: '0' }}>
          By logging in, you agree to Anant Arts&apos; <a href="/terms-and-conditions" style={{ color: 'var(--primary-gold, #D4AF37)' }}>Terms of Use</a> and <a href="/privacy-policy" style={{ color: 'var(--primary-gold, #D4AF37)' }}>Privacy Policy</a>.
        </p>

        {/* Register Link */}
        <div style={{ textAlign: 'center', paddingTop: '16px', borderTop: '1px solid #EEE' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
            New to Anant Arts?{' '}
            <Link href={`/register${nextUrl !== '/account' ? `?next=${encodeURIComponent(nextUrl)}` : ''}`} style={{ color: 'var(--primary-gold, #D4AF37)', fontWeight: '600', textDecoration: 'none' }}>
              Create Account
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
