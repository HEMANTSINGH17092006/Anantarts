'use client';
import { useState, useEffect } from 'react';
import { submitB2bEnquiry } from '@/app/actions';

export default function BulkEnquiryForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [quantity, setQuantity] = useState('');
  const [productInterest, setProductInterest] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [whatsappRedirectUrl, setWhatsappRedirectUrl] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0 || !whatsappRedirectUrl) return;
    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, whatsappRedirectUrl]);

  useEffect(() => {
    if (countdown === 0 && whatsappRedirectUrl) {
      window.open(whatsappRedirectUrl, '_blank');
    }
  }, [countdown, whatsappRedirectUrl]);

  // Inline Validators
  const validateName = (val) => val.trim().length >= 3 && val.trim().length <= 50 && /^[a-zA-Z\s]+$/.test(val.trim());
  const validatePhone = (val) => /^[6-9][0-9]{9}$/.test(val.trim());
  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const validateQuantity = (val) => {
    const num = parseInt(val);
    return !isNaN(num) && num >= 1;
  };

  useEffect(() => {
    let newErrors = {};
    if (touched.name && !validateName(name)) {
      newErrors.name = 'Please enter a valid full name (letters & spaces only).';
    }
    if (touched.email && !validateEmail(email)) {
      newErrors.email = 'Please enter a valid business email.';
    }
    if (touched.phone && !validatePhone(phone)) {
      newErrors.phone = 'Please enter a valid 10-digit mobile number.';
    }
    if (touched.quantity && !validateQuantity(quantity)) {
      newErrors.quantity = 'Estimated quantity must be at least 1.';
    }
    setErrors(newErrors);
  }, [name, email, phone, quantity, touched]);

  const isFormValid = validateName(name) && validateEmail(email) && validatePhone(phone) && validateQuantity(quantity);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, quantity: true });
    
    let tempErrors = {};
    if (!validateName(name)) tempErrors.name = 'Please enter a valid full name.';
    if (!validateEmail(email)) tempErrors.email = 'Please enter a valid email address.';
    if (!validatePhone(phone)) tempErrors.phone = 'Please enter a valid 10-digit mobile number.';
    if (!validateQuantity(quantity)) tempErrors.quantity = 'Please enter a quantity of 1 or more.';

    if (Object.keys(tempErrors).length > 0) {
      setErrors(tempErrors);
      setErrorMsg('Please correct the validation errors below.');
      
      const firstErrKey = Object.keys(tempErrors)[0];
      setTimeout(() => {
        const el = document.getElementById('b2b_' + firstErrKey);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
      }, 100);

      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(100);
      }
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('company', company);
      formData.append('quantity', quantity);
      formData.append('product_interest', productInterest);
      formData.append('message', message);

      const res = await submitB2bEnquiry(null, formData);
      if (res.success) {
        setSuccessMsg(res.message);
        if (res.whatsappRedirectUrl) {
          setWhatsappRedirectUrl(res.whatsappRedirectUrl);
          setCountdown(5);
        }
        setName('');
        setEmail('');
        setPhone('');
        setCompany('');
        setQuantity('');
        setProductInterest('');
        setMessage('');
        setTouched({});
      } else {
        setErrorMsg(res.message);
      }
    } catch (err) {
      setErrorMsg('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'white', border: '1px solid var(--primary-gold-border)', borderRadius: '12px', padding: '32px', boxShadow: 'var(--shadow-md)', maxWidth: '650px', margin: '0 auto' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--text-dark)', marginBottom: '8px', textAlign: 'center' }}>Bulk order and B2B Enquiry</h3>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '24px', textAlign: 'center' }}>Custom packaging, logo engravings, and volume discounts available.</p>

      {successMsg && (
        <div style={{ background: 'rgba(46,125,50,0.08)', color: 'var(--success)', border: '1px solid rgba(46,125,50,0.2)', padding: '24px', borderRadius: '10px', marginBottom: '24px', fontSize: '0.9rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>✓</div>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>{successMsg}</div>
          
          {whatsappRedirectUrl && (
            <div style={{ marginTop: '16px', borderTop: '1px solid rgba(46,125,50,0.15)', paddingTop: '16px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>
                Would you like to connect with a B2B manager directly for an instant catalog and pricing?
              </p>
              
              <a 
                href={whatsappRedirectUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-gold"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  textDecoration: 'none', 
                  backgroundColor: '#25D366', 
                  color: 'white', 
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  boxShadow: '0 4px 10px rgba(37, 211, 102, 0.25)',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
              >
                <i className="fab fa-whatsapp" style={{ fontSize: '1.1rem' }}></i> Connect on WhatsApp Instantly
              </a>
              
              {countdown > 0 ? (
                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '10px', fontStyle: 'italic' }}>
                  Opening WhatsApp automatically in {countdown} seconds...
                </span>
              ) : (
                <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '10px', fontStyle: 'italic' }}>
                  A copy of these enquiry details has also been emailed to your business address.
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div style={{ background: 'rgba(198,40,40,0.08)', color: 'var(--danger)', border: '1px solid rgba(198,40,40,0.2)', padding: '16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.88rem', textAlign: 'center', fontWeight: '500' }}>
          ⚠ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }} noValidate>
        {/* Full Name */}
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', marginBottom: '6px', color: 'var(--text-dark)' }}>
            Full Name *
            {name.trim().length > 0 && validateName(name) && <i className="fas fa-check-circle" style={{ color: 'var(--success)', marginLeft: '6px' }}></i>}
          </label>
          <input
            type="text"
            id="b2b_name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setTouched(p => ({ ...p, name: true }));
            }}
            onBlur={() => setTouched(p => ({ ...p, name: true }))}
            placeholder="e.g. Hemant Singh"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '6px',
              border: errors.name ? '1.5px solid var(--danger)' : (name.trim().length > 0 && validateName(name)) ? '1.5px solid var(--success)' : '1px solid var(--primary-gold-border)',
              backgroundColor: errors.name ? 'rgba(198,40,40,0.01)' : 'white',
              fontSize: '0.88rem',
              boxSizing: 'border-box'
            }}
          />
          {errors.name && <span className="error-msg-inline" style={{ marginTop: '4px' }}>{errors.name}</span>}
        </div>

        {/* Business Email & Phone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', marginBottom: '6px', color: 'var(--text-dark)' }}>
              Business Email *
              {email.trim().length > 0 && validateEmail(email) && <i className="fas fa-check-circle" style={{ color: 'var(--success)', marginLeft: '6px' }}></i>}
            </label>
            <input
              type="email"
              id="b2b_email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setTouched(p => ({ ...p, email: true }));
              }}
              onBlur={() => setTouched(p => ({ ...p, email: true }))}
              placeholder="e.g. business@company.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: errors.email ? '1.5px solid var(--danger)' : (email.trim().length > 0 && validateEmail(email)) ? '1.5px solid var(--success)' : '1px solid var(--primary-gold-border)',
                backgroundColor: errors.email ? 'rgba(198,40,40,0.01)' : 'white',
                fontSize: '0.88rem',
                boxSizing: 'border-box'
              }}
            />
            {errors.email && <span className="error-msg-inline" style={{ marginTop: '4px' }}>{errors.email}</span>}
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', marginBottom: '6px', color: 'var(--text-dark)' }}>
              Phone Number *
              {phone.trim().length > 0 && validatePhone(phone) && <i className="fas fa-check-circle" style={{ color: 'var(--success)', marginLeft: '6px' }}></i>}
            </label>
            <input
              type="tel"
              id="b2b_phone"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setTouched(p => ({ ...p, phone: true }));
              }}
              onBlur={() => setTouched(p => ({ ...p, phone: true }))}
              placeholder="e.g. 9876543210"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: errors.phone ? '1.5px solid var(--danger)' : (phone.trim().length > 0 && validatePhone(phone)) ? '1.5px solid var(--success)' : '1px solid var(--primary-gold-border)',
                backgroundColor: errors.phone ? 'rgba(198,40,40,0.01)' : 'white',
                fontSize: '0.88rem',
                boxSizing: 'border-box'
              }}
            />
            {errors.phone && <span className="error-msg-inline" style={{ marginTop: '4px' }}>{errors.phone}</span>}
          </div>
        </div>

        {/* Company Name & Quantity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: 'var(--text-dark)' }}>Company Name (Optional)</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Anant Retailers"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid var(--primary-gold-border)',
                fontSize: '0.88rem',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', marginBottom: '6px', color: 'var(--text-dark)' }}>
              Estimated Quantity *
              {quantity.toString().trim().length > 0 && validateQuantity(quantity) && <i className="fas fa-check-circle" style={{ color: 'var(--success)', marginLeft: '6px' }}></i>}
            </label>
            <input
              type="number"
              id="b2b_quantity"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setTouched(p => ({ ...p, quantity: true }));
              }}
              onBlur={() => setTouched(p => ({ ...p, quantity: true }))}
              placeholder="e.g. 50"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '6px',
                border: errors.quantity ? '1.5px solid var(--danger)' : (quantity.toString().trim().length > 0 && validateQuantity(quantity)) ? '1.5px solid var(--success)' : '1px solid var(--primary-gold-border)',
                backgroundColor: errors.quantity ? 'rgba(198,40,40,0.01)' : 'white',
                fontSize: '0.88rem',
                boxSizing: 'border-box'
              }}
            />
            {errors.quantity && <span className="error-msg-inline" style={{ marginTop: '4px' }}>{errors.quantity}</span>}
          </div>
        </div>

        {/* Product of Interest */}
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: 'var(--text-dark)' }}>Product of Interest</label>
          <select
            value={productInterest}
            onChange={(e) => setProductInterest(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid var(--primary-gold-border)',
              fontSize: '0.88rem',
              boxSizing: 'border-box',
              background: 'white'
            }}
          >
            <option value="">— Select Category —</option>
            <option value="Spiritual Collection">Spiritual Collection</option>
            <option value="Home Décor">Home Décor</option>
            <option value="Corporate Gifts">Corporate Gifts</option>
            <option value="Decorative Figurines">Decorative Figurines</option>
            <option value="Festive Gifts">Festive Gifts</option>
            <option value="Customized Products">Customized Products</option>
            <option value="Premium Collectibles">Premium Collectibles</option>
            <option value="Other">Other Products</option>
          </select>
        </div>

        {/* Requirements */}
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '6px', color: 'var(--text-dark)' }}>Custom Requirements / Message</label>
          <textarea
            rows="4"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us about your customization, dimensions, or target deadline requirements..."
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: '6px',
              border: '1px solid var(--primary-gold-border)',
              fontSize: '0.88rem',
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: 'var(--font-body)'
            }}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn-gold"
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '12px',
            marginTop: '8px',
            opacity: (!isFormValid || loading) ? 0.55 : 1,
            cursor: (!isFormValid || loading) ? 'not-allowed' : 'pointer'
          }}
          disabled={loading || !isFormValid}
        >
          {loading ? <><i className="fas fa-spinner fa-spin"></i> Submitting...</> : <><i className="fas fa-paper-plane"></i> Submit B2B Enquiry</>}
        </button>
      </form>
    </div>
  );
}
