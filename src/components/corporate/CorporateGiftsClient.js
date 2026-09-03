'use client';
import { useState } from 'react';
import { submitCorporateInquiry } from '@/app/actions';

export default function CorporateGiftsClient() {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState('50');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const validate = () => {
    let tempErrors = {};
    if (!name.trim()) tempErrors.name = 'Please enter your name.';
    if (!company.trim()) tempErrors.company = 'Company name is required.';
    
    if (!email.trim()) {
      tempErrors.email = 'Business email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      tempErrors.email = 'Please enter a valid email.';
    }

    if (!phone.trim()) {
      tempErrors.phone = 'Phone number is required.';
    } else if (!/^\+?[0-9\s\-]{8,15}$/.test(phone.trim())) {
      tempErrors.phone = 'Please enter a valid phone number.';
    }

    if (!message.trim()) tempErrors.message = 'Inquiry Details cannot be empty.';

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
      setError('Please fix the errors in the inquiry form.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    const result = await submitCorporateInquiry({
      name,
      company,
      email,
      phone,
      quantity,
      message,
    });

    if (result.success) {
      setSuccess(result.message);
      setName('');
      setCompany('');
      setEmail('');
      setPhone('');
      setQuantity('50');
      setMessage('');
      setErrors({});
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '3rem', alignItems: 'flex-start' }}>
      
      {/* Left Column: Customization Benefits */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', marginBottom: '10px' }}>Customizations We Offer</h2>
        
        <div style={{ background: 'white', padding: '24px', borderRadius: '10px', border: '1px solid var(--primary-gold-border)' }}>
          <h3 style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '6px', color: 'var(--color-text-primary)' }}>Custom Insignia &amp; Logo Plaquing</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>Engrave your company logo, corporate emblem, or personalized recognition message on metallic brass plate highlights affixed to the base mount.</p>
        </div>

        <div style={{ background: 'white', padding: '24px', borderRadius: '10px', border: '1px solid var(--primary-gold-border)' }}>
          <h3 style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '6px', color: 'var(--color-text-primary)' }}>Bespoke Velvet Craft Packing</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>Shipped in handmade premium red/saffron velvet presentation boxes with custom silk linings, carrying individual authenticity certificates for VIP clients.</p>
        </div>

        <div style={{ background: 'white', padding: '24px', borderRadius: '10px', border: '1px solid var(--primary-gold-border)' }}>
          <h3 style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '6px', color: 'var(--color-text-primary)' }}>Tiered Bulk Discounts &amp; GST Invoicing</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>Access direct factory wholesale quotes for orders from 10 to 500+ units. Formal GST tax invoices provided for corporate expense claims.</p>
        </div>
      </div>

      {/* Right Column: Contact Inquiry Form */}
      <div style={{ background: 'white', padding: '32px', borderRadius: '10px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '20px' }}>Gifting Inquiry Portal</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} noValidate>
          <div>
            <label htmlFor="corp-name" style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Your Name *</label>
            <input
              type="text"
              id="corp-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="e.g. Anoop Deshmukh"
              className={errors.name ? 'form-input-error' : ''}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: errors.name ? '1.5px solid var(--danger)' : '1px solid var(--primary-gold-border)', fontSize: '0.85rem', outline: 'none' }}
            />
            {errors.name && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
          </div>

          <div>
            <label htmlFor="corp-company" style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Company / Organization Name *</label>
            <input
              type="text"
              id="corp-company"
              value={company}
              onChange={(e) => {
                setCompany(e.target.value);
                if (errors.company) setErrors({ ...errors, company: '' });
              }}
              placeholder="e.g. Reliance / Tata / Infosys"
              className={errors.company ? 'form-input-error' : ''}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: errors.company ? '1.5px solid var(--danger)' : '1px solid var(--primary-gold-border)', fontSize: '0.85rem', outline: 'none' }}
            />
            {errors.company && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{errors.company}</span>}
          </div>

          <div>
            <label htmlFor="corp-email" style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Business Email *</label>
            <input
              type="email"
              id="corp-email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              placeholder="e.g. procurement@company.com"
              className={errors.email ? 'form-input-error' : ''}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: errors.email ? '1.5px solid var(--danger)' : '1px solid var(--primary-gold-border)', fontSize: '0.85rem', outline: 'none' }}
            />
            {errors.email && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{errors.email}</span>}
          </div>

          <div>
            <label htmlFor="corp-phone" style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Phone / WhatsApp Number *</label>
            <input
              type="tel"
              id="corp-phone"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors({ ...errors, phone: '' });
              }}
              placeholder="e.g. +91 98200 XXXXX"
              className={errors.phone ? 'form-input-error' : ''}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: errors.phone ? '1.5px solid var(--danger)' : '1px solid var(--primary-gold-border)', fontSize: '0.85rem', outline: 'none' }}
            />
            {errors.phone && <span style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{errors.phone}</span>}
          </div>

          <div>
            <label htmlFor="corp-quantity" style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Estimated Quantity Units</label>
            <select
              id="corp-quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--primary-gold-border)', fontSize: '0.85rem', outline: 'none', background: 'white' }}
            >
              <option value="10-25">10 – 25 pieces (Executive Gifts)</option>
              <option value="25-50">25 – 50 pieces (Corporate Event)</option>
              <option value="50-100">50 – 100 pieces (Annual General Meeting)</option>
              <option value="100-250">100 – 250 pieces (Diwali Client Gifting)</option>
              <option value="250+">250+ pieces (Custom Factory Bulk)</option>
            </select>
          </div>

          <div>
            <label htmlFor="corp-message" style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Inquiry Details &amp; Customization Notes *</label>
            <textarea
              id="corp-message"
              rows="3"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message) setErrors({ ...errors, message: '' });
              }}
              placeholder="Specify preferred idol type (Ganesha, Radha Krishna, Shiva), custom plaque text, or delivery deadline..."
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
            {loading ? 'Submitting Corporate Request...' : 'Request Custom Bulk Quote'}
          </button>
        </form>
      </div>

    </div>
  );
}
