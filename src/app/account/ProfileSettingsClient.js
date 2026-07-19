'use client';

import { useState } from 'react';
import { updateCustomerProfile } from '../auth/actions';
import { useRouter } from 'next/navigation';

export default function ProfileSettingsClient({ customer }) {
  const router = useRouter();
  const [name, setName] = useState(customer.name || '');
  const [phone, setPhone] = useState(customer.phone || '');
  const [email, setEmail] = useState(customer.email || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const hasChanges = 
    name.trim() !== (customer.name || '') ||
    phone.trim() !== (customer.phone || '') ||
    email.trim().toLowerCase() !== (customer.email || '').toLowerCase();

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (name.trim().length < 3 || name.trim().length > 50) {
      setMessage('Name must be between 3 and 50 characters.');
      setIsError(true);
      return;
    }

    if (phone.trim() && !/^[6-9][0-9]{9}$/.test(phone.trim())) {
      setMessage('Please enter a valid 10-digit mobile number.');
      setIsError(true);
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())) {
      setMessage('Please enter a valid email address.');
      setIsError(true);
      return;
    }

    setLoading(true);
    try {
      const res = await updateCustomerProfile(name, phone, email);
      if (res.success) {
        setMessage('Profile updated successfully!');
        setIsError(false);
        router.refresh();
      } else {
        setMessage(res.message || 'Failed to update profile.');
        setIsError(true);
      }
    } catch (err) {
      setMessage('Something went wrong. Please try again.');
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} style={{ display: 'grid', gap: '20px', maxWidth: '400px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
          Full Name
        </label>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
          required
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '12px', 
            border: '1px solid #EAEAEA', 
            borderRadius: '8px', 
            background: loading ? '#F9F9F9' : '#FFF', 
            color: '#333',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary-gold)'}
          onBlur={(e) => e.target.style.borderColor = '#EAEAEA'}
        />
      </div>
      
      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
          Phone Number
        </label>
        <input 
          type="text" 
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 9876543210"
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '12px', 
            border: '1px solid #EAEAEA', 
            borderRadius: '8px', 
            background: loading ? '#F9F9F9' : '#FFF', 
            color: '#333',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary-gold)'}
          onBlur={(e) => e.target.style.borderColor = '#EAEAEA'}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: '#555' }}>
          Email Address
        </label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. customer@example.com"
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '12px', 
            border: '1px solid #EAEAEA', 
            borderRadius: '8px', 
            background: loading ? '#F9F9F9' : '#FFF', 
            color: '#333',
            fontSize: '0.9rem',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--primary-gold)'}
          onBlur={(e) => e.target.style.borderColor = '#EAEAEA'}
        />
      </div>

      {message && (
        <div style={{ 
          padding: '12px', 
          borderRadius: '8px', 
          fontSize: '0.85rem', 
          backgroundColor: isError ? '#FFEBEE' : '#E8F5E9', 
          color: isError ? '#C62828' : '#2E7D32',
          border: `1px solid ${isError ? '#FFCDD2' : '#C8E6C9'}`
        }}>
          {message}
        </div>
      )}

      <button 
        type="submit" 
        disabled={loading || !hasChanges}
        style={{ 
          padding: '12px 24px', 
          borderRadius: '8px', 
          background: (loading || !hasChanges) ? '#CCCCCC' : 'var(--primary-gold, #D4AF37)', 
          color: '#FFF', 
          border: 'none', 
          cursor: (loading || !hasChanges) ? 'default' : 'pointer', 
          fontWeight: '600',
          fontSize: '0.9rem',
          transition: 'all 0.2s',
          marginTop: '10px'
        }}
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
