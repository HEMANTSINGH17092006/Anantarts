'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { registerCustomer } from '../auth/actions';
import Link from 'next/link';

export default function RegisterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/account';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const validateFields = () => {
    const errs = {};
    if (name.trim().length < 3) errs.name = 'Name must be at least 3 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Please enter a valid email.';
    if (phone.trim() && !/^[6-9][0-9]{9}$/.test(phone.trim())) errs.phone = 'Please enter a valid 10-digit mobile number.';
    if (password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateFields()) return;

    setError('');
    setLoading(true);

    const res = await registerCustomer(name, email, phone, password);
    setLoading(false);

    if (res.success) {
      window.location.href = nextUrl;
    } else {
      setError(res.message);
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '12px 14px',
    border: fieldErrors[field] ? '1.5px solid #D32F2F' : '1px solid #DDD',
    borderRadius: '8px',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    background: '#FFF',
  });

  const labelStyle = {
    display: 'block',
    fontSize: '0.82rem',
    fontWeight: '600',
    marginBottom: '6px',
    color: '#333',
  };

  return (
    <div>
      {error && (
        <div style={{ background: '#FFF4F4', color: '#D32F2F', padding: '12px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '20px', border: '1px solid #FFCDD2' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Full Name */}
        <div>
          <label style={labelStyle}>Full Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            style={inputStyle('name')}
            required
          />
          {fieldErrors.name && <span style={{ color: '#D32F2F', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{fieldErrors.name}</span>}
        </div>

        {/* Email */}
        <div>
          <label style={labelStyle}>Email Address *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. customer@example.com"
            style={inputStyle('email')}
            required
          />
          {fieldErrors.email && <span style={{ color: '#D32F2F', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{fieldErrors.email}</span>}
        </div>

        {/* Phone */}
        <div>
          <label style={labelStyle}>Mobile Number <span style={{ color: '#999', fontWeight: '400' }}>(Optional)</span></label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="e.g. 9876543210"
            style={inputStyle('phone')}
            maxLength={10}
          />
          {fieldErrors.phone && <span style={{ color: '#D32F2F', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{fieldErrors.phone}</span>}
        </div>

        {/* Password */}
        <div>
          <label style={labelStyle}>Password *</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              style={{ ...inputStyle('password'), paddingRight: '44px' }}
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
          {fieldErrors.password && <span style={{ color: '#D32F2F', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{fieldErrors.password}</span>}
        </div>

        {/* Confirm Password */}
        <div>
          <label style={labelStyle}>Confirm Password *</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            style={inputStyle('confirmPassword')}
            required
          />
          {fieldErrors.confirmPassword && <span style={{ color: '#D32F2F', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{fieldErrors.confirmPassword}</span>}
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
            marginTop: '4px',
          }}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        {/* Terms */}
        <p style={{ fontSize: '0.73rem', color: '#666', textAlign: 'center', lineHeight: '1.5', margin: '0' }}>
          By creating an account, you agree to Anant Arts&apos; <a href="/terms-and-conditions" style={{ color: 'var(--primary-gold, #D4AF37)' }}>Terms of Use</a> and <a href="/privacy-policy" style={{ color: 'var(--primary-gold, #D4AF37)' }}>Privacy Policy</a>.
        </p>

        {/* Login Link */}
        <div style={{ textAlign: 'center', paddingTop: '12px', borderTop: '1px solid #EEE' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
            Already have an account?{' '}
            <Link href={`/login${nextUrl !== '/account' ? `?next=${encodeURIComponent(nextUrl)}` : ''}`} style={{ color: 'var(--primary-gold, #D4AF37)', fontWeight: '600', textDecoration: 'none' }}>
              Login
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
