'use client';
import { useState, useEffect } from 'react';
import { submitContactInquiry } from '@/app/actions';

export default function ContactClient({ defaultPhone, defaultEmail, defaultAddress, defaultWhatsapp }) {
  const [phone, setPhone] = useState(defaultPhone || '+91 72758 19354');
  const [email, setEmail] = useState(defaultEmail || 'anantarts39@gmail.com');
  const [address, setAddress] = useState(defaultAddress || 'Bhoirwadi, Dombivli East, Maharashtra, India');
  const [whatsapp, setWhatsapp] = useState(defaultWhatsapp || '917275819354');

  // Form states
  const [name, setName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const s = await res.json();
          if (s.contact_phone) setPhone(s.contact_phone);
          if (s.contact_email) setEmail(s.contact_email);
          if (s.contact_address) setAddress(s.contact_address);
          if (s.whatsapp_number) setWhatsapp(s.whatsapp_number);
        }
      } catch (err) {
        console.error('Settings fetch failed, using defaults.', err);
      }
    }
    loadSettings();
  }, []);

  const validate = () => {
    let tempErrors = {};
    if (!name.trim()) tempErrors.name = 'Please enter your name.';
    
    if (!formEmail.trim()) {
      tempErrors.formEmail = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail.trim())) {
      tempErrors.formEmail = 'Please enter a valid email.';
    }

    if (!subject.trim()) tempErrors.subject = 'Please enter a subject.';
    if (!message.trim()) tempErrors.message = 'Inquiry Message cannot be empty.';

    setErrors(tempErrors);

    const firstErrKey = Object.keys(tempErrors)[0];
    if (firstErrKey) {
      setTimeout(() => {
        const el = document.getElementById(firstErrKey);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
      }, 100);

      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(100);
      }
    }

    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setError('Please fill in all required fields accurately.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    const result = await submitContactInquiry({
      name,
      email: formEmail,
      phone: '',
      subject,
      message,
    });

    if (result.success) {
      setSuccess(result.message);
      setName('');
      setFormEmail('');
      setSubject('');
      setMessage('');
      setErrors({});
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '3rem', alignItems: 'flex-start' }}>
      
      {/* Left Column: Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', marginBottom: '10px' }}>Contact Channels</h2>
        
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '2rem' }}>📞</span>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem' }}>Call Support</strong>
              <a href={`tel:${phone.replace(/\s+/g, '')}`} style={{ fontSize: '0.85rem', color: 'var(--primary-gold-hover)' }}>{phone}</a>
            </div>
          </div>
        </div>

        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '2rem' }}>💬</span>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem' }}>WhatsApp Direct</strong>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: '#25D366', fontWeight: '600' }}>Chat Online</a>
            </div>
          </div>
        </div>

        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '2rem' }}>✉️</span>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem' }}>Email Queries</strong>
              <a href={`mailto:${email}`} style={{ fontSize: '0.85rem', color: 'var(--text-dark)' }}>{email}</a>
            </div>
          </div>
        </div>

        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span style={{ fontSize: '2rem' }}>📍</span>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem' }}>Studio &amp; Workshop</strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Inquiry Form */}
      <div style={{ background: 'white', padding: '32px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '20px' }}>Send An Inquiry</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} noValidate>
          <div>
            <label htmlFor="name" style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Your Name *</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="e.g. Ramesh Chandra"
              className={errors.name ? 'form-input-error' : ''}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: errors.name ? '1.5px solid var(--danger)' : '1px solid var(--primary-gold-border)', fontSize: '0.85rem', outline: 'none' }}
            />
            {errors.name && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
          </div>

          <div>
            <label htmlFor="formEmail" style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Email Address *</label>
            <input
              type="email"
              id="formEmail"
              value={formEmail}
              onChange={(e) => {
                setFormEmail(e.target.value);
                if (errors.formEmail) setErrors({ ...errors, formEmail: '' });
              }}
              placeholder="e.g. ramesh@example.com"
              className={errors.formEmail ? 'form-input-error' : ''}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: errors.formEmail ? '1.5px solid var(--danger)' : '1px solid var(--primary-gold-border)', fontSize: '0.85rem', outline: 'none' }}
            />
            {errors.formEmail && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{errors.formEmail}</span>}
          </div>

          <div>
            <label htmlFor="subject" style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Subject / Department *</label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (errors.subject) setErrors({ ...errors, subject: '' });
              }}
              placeholder="e.g. Custom Size Idol / Order Inquiry"
              className={errors.subject ? 'form-input-error' : ''}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: errors.subject ? '1.5px solid var(--danger)' : '1px solid var(--primary-gold-border)', fontSize: '0.85rem', outline: 'none' }}
            />
            {errors.subject && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{errors.subject}</span>}
          </div>

          <div>
            <label htmlFor="message" style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Message Details *</label>
            <textarea
              id="message"
              rows="4"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message) setErrors({ ...errors, message: '' });
              }}
              placeholder="Describe your custom requirement or order question..."
              className={errors.message ? 'form-input-error' : ''}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: errors.message ? '1.5px solid var(--danger)' : '1px solid var(--primary-gold-border)', fontSize: '0.85rem', resize: 'vertical', outline: 'none' }}
            ></textarea>
            {errors.message && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{errors.message}</span>}
          </div>

          {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', background: '#FFEBEE', padding: '10px', borderRadius: '4px' }}>{error}</div>}
          {success && <div style={{ color: 'var(--success)', fontSize: '0.85rem', background: '#E8F5E9', padding: '10px', borderRadius: '4px' }}>{success}</div>}

          <button
            type="submit"
            className="btn-primary btn-md"
            disabled={loading}
            style={{ width: '100%', padding: '12px' }}
          >
            {loading ? 'Sending Inquiry...' : 'Submit Inquiry'}
          </button>
        </form>
      </div>

    </div>
  );
}
