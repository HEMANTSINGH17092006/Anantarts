'use client';
import { useState } from 'react';
import { submitConsultation } from '../actions';

export default function ConsultationPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    whatsapp: '',
    city: '',
    deity_interest: '',
    dimensions: '',
    preferred_date: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear field error when user types
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.name.trim()) {
      tempErrors.name = 'Full Name is required.';
    }
    if (!formData.phone.trim()) {
      tempErrors.phone = 'Phone number is required.';
    } else if (!/^\+?[0-9\s\-]{8,15}$/.test(formData.phone.trim())) {
      tempErrors.phone = 'Please enter a valid phone number.';
    }
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
      setError('Please fix the errors in the consultation form.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await submitConsultation(formData);
      if (res.success) {
        setSubmitted(true);
      } else {
        setError(res.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '5rem 0', minHeight: '80vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
        
        {/* Banner Card */}
        <div style={{
          background: 'var(--luxury-gradient)',
          color: 'white',
          borderRadius: '12px',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--primary-gold-border)',
          marginBottom: '3rem'
        }}>
          <span style={{ color: 'var(--primary-gold)', letterSpacing: '4px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '600' }}>
            Sacred Vastu Design
          </span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'white', marginTop: '10px', marginBottom: '15px' }}>
            Bespoke Pooja Room Consultation
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', lineHeight: '1.7', maxWidth: '600px', margin: '0 auto' }}>
            Consult with our traditional temple sthapatis and Jaipur lineage design experts to customize temple layouts, select proper deities, and align features with shastra guidelines.
          </p>
        </div>

        {submitted ? (
          <div style={{
            background: 'white',
            border: '2px solid var(--primary-gold)',
            borderRadius: '12px',
            padding: '3rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>🪷</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', color: 'var(--text-dark)', marginBottom: '12px' }}>
              Consultation Requested Successfully
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
              Om Namah Shivaya. Thank you for reaching out to Anant Arts. Our sacred design counselors will contact you via WhatsApp / phone within 24 hours to schedule your session.
            </p>
            <button 
              onClick={() => {
                setSubmitted(false);
                setFormData({ name: '', phone: '', whatsapp: '', city: '', deity_interest: '', dimensions: '', preferred_date: '', notes: '' });
              }}
              className="btn-gold"
            >
              Request Another Session
            </button>
          </div>
        ) : (
          <form 
            onSubmit={handleSubmit}
            style={{
              background: 'white',
              border: '1px solid var(--primary-gold-border)',
              borderRadius: '12px',
              padding: '2.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {error && (
              <div style={{
                background: 'rgba(198, 40, 40, 0.08)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '0.85rem',
                marginBottom: '1.5rem'
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '6px' }}>
                  Full Name *
                </label>
                <input 
                  type="text" 
                  name="name" 
                  id="name"
                  value={formData.name} 
                  onChange={handleChange}
                  placeholder="e.g. Rajesh Kumar" 
                  className={errors.name ? 'form-input-error' : ''}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: errors.name ? '1.5px solid var(--danger)' : '1px solid var(--primary-gold-border)', fontSize: '0.88rem' }}
                />
                {errors.name && <span className="error-msg-inline">{errors.name}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '6px' }}>
                  Contact Phone Number *
                </label>
                <input 
                  type="tel" 
                  name="phone" 
                  id="phone"
                  value={formData.phone} 
                  onChange={handleChange}
                  placeholder="e.g. +91 99999 99999" 
                  className={errors.phone ? 'form-input-error' : ''}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: errors.phone ? '1.5px solid var(--danger)' : '1px solid var(--primary-gold-border)', fontSize: '0.88rem' }}
                />
                {errors.phone && <span className="error-msg-inline">{errors.phone}</span>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '6px' }}>
                  WhatsApp Number (If different)
                </label>
                <input 
                  type="tel" 
                  name="whatsapp" 
                  value={formData.whatsapp} 
                  onChange={handleChange}
                  placeholder="e.g. +91 99999 99999" 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--primary-gold-border)', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '6px' }}>
                  City / Location
                </label>
                <input 
                  type="text" 
                  name="city" 
                  value={formData.city} 
                  onChange={handleChange}
                  placeholder="e.g. Mumbai, Maharashtra" 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--primary-gold-border)', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '6px' }}>
                  Preferred Deity Avatar
                </label>
                <select 
                  name="deity_interest" 
                  value={formData.deity_interest} 
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--primary-gold-border)', fontSize: '0.88rem', background: 'white' }}
                >
                  <option value="">Select Deity Interest...</option>
                  <option value="Lord Ganesha">Lord Ganesha</option>
                  <option value="Lord Shiva">Lord Shiva</option>
                  <option value="Goddess Lakshmi">Goddess Lakshmi</option>
                  <option value="Radha Krishna">Radha Krishna</option>
                  <option value="Lord Hanuman">Lord Hanuman</option>
                  <option value="Custom Shrine Setups">Custom Multi-Deity Shrine Setups</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '6px' }}>
                  Mandir Space Dimensions (Width x Depth x Height)
                </label>
                <input 
                  type="text" 
                  name="dimensions" 
                  value={formData.dimensions} 
                  onChange={handleChange}
                  placeholder="e.g. 3 x 2 x 4 Feet" 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--primary-gold-border)', fontSize: '0.88rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '6px' }}>
                  Preferred Session Date
                </label>
                <input 
                  type="date" 
                  name="preferred_date" 
                  value={formData.preferred_date} 
                  onChange={handleChange}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--primary-gold-border)', fontSize: '0.88rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '6px' }}>
                Vastu concerns or Custom request notes
              </label>
              <textarea 
                name="notes" 
                value={formData.notes} 
                onChange={handleChange}
                placeholder="Describe your design vision, material preference (Gold/Silver plating), or home Vastu queries..." 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--primary-gold-border)', fontSize: '0.88rem', minHeight: '120px', resize: 'vertical' }}
              />
            </div>

            <button 
              type="submit" 
              className="btn-gold" 
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              {loading ? 'Submitting Request...' : 'Book Design Consultation Session'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
