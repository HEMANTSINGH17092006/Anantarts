'use client';
import { useState } from 'react';
import { adminLogin } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');

    const res = await adminLogin(email, password);
    setLoading(false);

    if (res.success) {
      router.push('/admin');
    } else {
      setError(res.message);
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-cream)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        background: 'white',
        padding: '40px 32px',
        borderRadius: '8px',
        border: '1px solid var(--primary-gold-border)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <span style={{ fontSize: '3rem' }}>🪷</span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', marginTop: '10px', color: 'var(--text-dark)' }}>
            Admin Portal
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Anant Arts Management System</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '500', marginBottom: '6px' }}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@anantarts.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '4px',
                border: '1px solid var(--primary-gold-border)',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '500', marginBottom: '6px' }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '4px',
                border: '1px solid var(--primary-gold-border)',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
          </div>

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: 0 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn-gold"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '0.88rem',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
