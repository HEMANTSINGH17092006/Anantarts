'use client';
import { useState } from 'react';
import { submitCorporateInquiry } from '@/app/actions';

export default function CorporateGiftsPage() {
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
      email,
      phone,
      company,
      quantity,
      requirements: message,
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
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 2rem' }}>
        
        <div className="section-heading" style={{ marginBottom: '3.5rem' }}>
          <h2>Bespoke Corporate Gifting</h2>
          <div className="gold-line"></div>
          <p>Premium 24K gold electroplated idols customized for corporate milestones, Diwali celebrations, and VIP patrons.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'flex-start' }}>
          
          {/* Left Column: Info list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', marginBottom: '10px' }}>Customizations We Offer</h3>
            
            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <h4 style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '6px' }}>Custom Insignia & Logo Plaquing</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>Engrave your brand name or personalized message on metallic plate highlights affixed to the premium base mount.</p>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <h4 style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '6px' }}>Bespoke Velvet Craft Packing</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>Shipped in handmade premium red/saffron velvet boxes with custom silk linings, carrying individual authenticity certificates.</p>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
              <h4 style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '6px' }}>Tiered Bulk Discounts</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>Access special direct factory quotes for orders exceeding 20 pieces. GST invoices provided for company tax deductions.</p>
            </div>
          </div>

          {/* Right Column: Contact Inquiry Form */}
          <div style={{ background: 'white', padding: '32px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '20px' }}>Gifting Inquiry Portal</h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} noValidate>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Your Name *</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  placeholder="e.g. Anoop Deshmukh"
                  className={errors.name ? 'form-input-error' : ''}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: errors.name ? '1.5px solid var(--danger)' : '1px solid var(--primary-gold-border)', fontSize: '0.85rem' }}
                />
                {errors.name && <span className="error-msg-inline">{errors.name}</span>}
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Company Name *</label>
                <input
                  type="text"
                  id="company"
                  value={company}
                  onChange={(e) => {
                    setCompany(e.target.value);
                    if (errors.company) setErrors({ ...errors, company: '' });
                  }}
                  placeholder="e.g. Anant Corporate Ltd"
                  className={errors.company ? 'form-input-error' : ''}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: errors.company ? '1.5px solid var(--danger)' : '1px solid var(--primary-gold-border)', fontSize: '0.85rem' }}
                />
                {errors.company && <span className="error-msg-inline">{errors.company}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Business Email *</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    placeholder="e.g. corporate@company.com"
                    className={errors.email ? 'form-input-error' : ''}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: errors.email ? '1.5px solid var(--danger)' : '1px solid var(--primary-gold-border)', fontSize: '0.85rem' }}
                  />
                  {errors.email && <span className="error-msg-inline">{errors.email}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    placeholder="e.g. +91 98200 12345"
                    className={errors.phone ? 'form-input-error' : ''}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: errors.phone ? '1.5px solid var(--danger)' : '1px solid var(--primary-gold-border)', fontSize: '0.85rem' }}
                  />
                  {errors.phone && <span className="error-msg-inline">{errors.phone}</span>}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Expected Quantity *</label>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: '1px solid var(--primary-gold-border)', fontSize: '0.85rem', background: 'white' }}
                >
                  <option value="10-25">10 - 25 units</option>
                  <option value="25-50">25 - 50 units</option>
                  <option value="50-100">50 - 100 units</option>
                  <option value="100+">More than 100 units</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Inquiry Details *</label>
                <textarea
                  rows="4"
                  id="message"
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (errors.message) setErrors({ ...errors, message: '' });
                  }}
                  placeholder="Specify deity collection, delivery dates, GST invoice requirements, logo customization needs..."
                  className={errors.message ? 'form-input-error' : ''}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '4px', border: errors.message ? '1.5px solid var(--danger)' : '1px solid var(--primary-gold-border)', fontSize: '0.85rem', fontFamily: 'var(--font-body)' }}
                ></textarea>
                {errors.message && <span className="error-msg-inline">{errors.message}</span>}
              </div>

              {error && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', margin: 0 }}>{error}</p>}
              {success && <p style={{ color: 'var(--success)', fontSize: '0.82rem', margin: 0 }}>{success}</p>}

              <button type="submit" className="btn-gold" style={{ justifyContent: 'center', padding: '12px' }} disabled={loading}>
                {loading ? 'Submitting portal inquiry...' : 'Submit Corporate Gifting Inquiry'}
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
