'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/components/context/AppContext';
import { formatPrice, generateOrderNumber } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    subtotal,
    discount,
    shipping,
    total,
    coupon,
    applyCoupon,
    removeCoupon,
    clearCart
  } = useCart();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' or 'razorpay'
  const [touched, setTouched] = useState({});

  // Inline Validation Helpers
  const validateName = (val) => val.trim().length >= 3 && val.trim().length <= 50 && /^[a-zA-Z\s]+$/.test(val.trim());
  const validatePhone = (val) => /^[6-9][0-9]{9}$/.test(val.trim());
  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const validateAddress = (val) => val.trim().length >= 10;
  const validateCity = (val) => val.trim().length >= 3 && /^[a-zA-Z\s]+$/.test(val.trim());
  const validateState = (val) => val.trim().length > 0;
  const validateZip = (val) => /^[1-9][0-9]{5}$/.test(val.trim());
  const validateLandmark = (val) => val.trim().length === 0 || val.trim().length <= 100;

  // Real-time validation
  useEffect(() => {
    let tempErrors = {};
    if (touched.name && !validateName(name)) tempErrors.name = 'Please enter a valid full name.';
    if (touched.email && !validateEmail(email)) tempErrors.email = 'Please enter a valid email address.';
    if (touched.phone && !validatePhone(phone)) tempErrors.phone = 'Please enter a valid 10-digit mobile number.';
    if (touched.address && !validateAddress(address)) tempErrors.address = 'Please enter a complete delivery address.';
    if (touched.city && !validateCity(city)) tempErrors.city = 'Please enter a valid city name.';
    if (touched.state && !validateState(state)) tempErrors.state = 'Please select your state.';
    if (touched.zip && !validateZip(zip)) tempErrors.zip = 'Please enter a valid 6-digit postal code.';
    if (touched.landmark && !validateLandmark(landmark)) tempErrors.landmark = 'Landmark must be under 100 characters.';
    setErrors(tempErrors);
  }, [name, email, phone, address, city, state, zip, landmark, touched]);

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [applying, setApplying] = useState(false);

  // Checkout execution states
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  // Load Razorpay Checkout script on mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (orderSuccess) {
    return (
      <div style={{ background: 'var(--bg-cream)', padding: '5rem 0', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px', background: 'white', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
          <div style={{ fontSize: '4.5rem', color: 'var(--success)', marginBottom: '16px' }}>✔️</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', marginBottom: '8px' }}>Order Placed Successfully!</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Thank you for your patronage. Your order has been registered under order number: <strong style={{ color: 'var(--text-dark)' }}>{orderSuccess.order_number}</strong>.
          </p>
          <div style={{ background: 'var(--bg-cream)', padding: '16px', borderRadius: '4px', textAlign: 'left', fontSize: '0.82rem', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div><strong>Recipient:</strong> {orderSuccess.customer_name}</div>
            <div><strong>Email:</strong> {orderSuccess.customer_email}</div>
            <div><strong>Address:</strong> {orderSuccess.shipping_address}</div>
            <div><strong>Total Paid:</strong> {formatPrice(orderSuccess.total_amount)}</div>
            <div><strong>Payment Method:</strong> {orderSuccess.payment_method.toUpperCase()}</div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href={`/order-tracking?order=${orderSuccess.order_number}`} className="btn-gold" style={{ flex: 1, justifyContent: 'center' }}>
              Track Shipment
            </Link>
            <Link href="/" className="btn-outline-gold" style={{ flex: 1, justifyContent: 'center' }}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div style={{ background: 'var(--bg-cream)', padding: '5rem 0', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>👜</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', marginBottom: '8px' }}>Cart is Empty</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Please add some divine idols to your cart before proceeding.</p>
          <Link href="/shop" className="btn-gold">Browse Catalog</Link>
        </div>
      </div>
    );
  }

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setApplying(true);
    setCouponError('');
    setCouponSuccess('');
    
    const res = await applyCoupon(couponCode.trim().toUpperCase());
    setApplying(false);
    
    if (res.success) {
      setCouponSuccess(res.message);
      setCouponCode('');
    } else {
      setCouponError(res.message);
    }
  };

  const handleZipChange = async (e) => {
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
    setZip(cleaned);
    setTouched(prev => ({ ...prev, zip: true }));

    if (cleaned.length === 6 && cleaned[0] !== '0') {
      try {
        const response = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data[0]?.Status === 'Success') {
            const office = data[0].PostOffice[0];
            if (office) {
              setCity(office.District || office.Name || '');
              setState(office.State || '');
              setTouched(prev => ({ ...prev, city: true, state: true }));
            }
          }
        }
      } catch (err) {
        console.error('ZIP lookup failed', err);
      }
    }
  };

  const validate = () => {
    const allTouched = { name: true, email: true, phone: true, address: true, city: true, state: true, zip: true, landmark: true };
    setTouched(allTouched);

    let tempErrors = {};
    if (!validateName(name)) tempErrors.name = 'Please enter a valid full name.';
    if (!validateEmail(email)) tempErrors.email = 'Please enter a valid email address.';
    if (!validatePhone(phone)) tempErrors.phone = 'Please enter a valid 10-digit mobile number.';
    if (!validateAddress(address)) tempErrors.address = 'Please enter a complete delivery address.';
    if (!validateCity(city)) tempErrors.city = 'Please enter a valid city name.';
    if (!validateState(state)) tempErrors.state = 'Please select your state.';
    if (!validateZip(zip)) tempErrors.zip = 'Please enter a valid 6-digit postal code.';
    if (!validateLandmark(landmark)) tempErrors.landmark = 'Landmark must be under 100 characters.';

    setErrors(tempErrors);

    const firstErrKey = Object.keys(tempErrors)[0];
    if (firstErrKey) {
      const el = document.getElementById(firstErrKey);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(100);
      }
    }

    return Object.keys(tempErrors).length === 0;
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setError('Please fix the errors in the shipping form.');
      return;
    }
    setError('');
    
    const orderNumber = generateOrderNumber();
    const shippingAddressString = `${address}, ${landmark ? landmark + ', ' : ''}${city}, ${state} - ${zip}, India`;

    if (paymentMethod === 'razorpay') {
      setLoading(true);
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TF5Q4XYGrKlT1b',
        amount: Math.round(total * 100),
        currency: 'INR',
        name: 'Anant Arts',
        description: `Order ${orderNumber}`,
        handler: async function (response) {
          createDbOrder(orderNumber, shippingAddressString, 'Razorpay', 'Paid', response.razorpay_payment_id);
        },
        prefill: {
          name: name,
          email: email,
          contact: phone,
        },
        theme: {
          color: '#D4AF37',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      setLoading(true);
      createDbOrder(orderNumber, shippingAddressString, 'COD', 'Pending', null);
    }
  };

  const createDbOrder = async (orderNumber, shippingAddress, method, payStatus, paymentId) => {
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: orderNumber,
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          street_address: address,
          city: city,
          state: state,
          zip: zip,
          landmark: landmark,
          shipping_address: shippingAddress,
          billing_address: shippingAddress,
          coupon_id: coupon?.id || null,
          discount_amount: discount,
          shipping_charge: shipping,
          subtotal: subtotal,
          total_amount: total,
          payment_method: method,
          payment_status: payStatus,
          payment_id: paymentId,
          items: cart.map(item => ({
            product_id: item.id,
            product_name: item.name,
            price: item.discount_price && item.discount_price > 0 ? item.discount_price : item.price,
            quantity: item.quantity
          }))
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error completing checkout');

      clearCart();
      setOrderSuccess(data.order);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        
        <div className="section-heading" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem' }}>Checkout Details</h2>
          <div className="gold-line" style={{ margin: '8px 0 0 0' }}></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', gap: '3rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          
          {/* Left Column: Customer Form */}
          <div style={{ flex: '2 1 500px', background: 'white', padding: '32px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '20px' }}>Shipping Information</h3>
            
            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} noValidate>
              {/* Full Name */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', display: 'flex', alignItems: 'center', marginBottom: '6px', color: 'var(--text-dark)' }}>
                  Full Name *
                  {name.trim().length > 0 && validateName(name) && <i className="fas fa-check-circle" style={{ color: 'var(--success)', marginLeft: '6px', fontSize: '0.85rem' }}></i>}
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setTouched(prev => ({ ...prev, name: true }));
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                  placeholder="e.g. Hemant Singh"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '4px',
                    border: errors.name ? '1.5px solid var(--danger)' : (name.trim().length > 0 && validateName(name)) ? '1.5px solid var(--success)' : '1px solid var(--primary-gold-border)',
                    backgroundColor: errors.name ? 'rgba(198,40,40,0.01)' : 'white',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                />
                {errors.name && <span className="error-msg-inline">{errors.name}</span>}
              </div>

              {/* Email & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '600', display: 'flex', alignItems: 'center', marginBottom: '6px', color: 'var(--text-dark)' }}>
                    Email Address *
                    {email.trim().length > 0 && validateEmail(email) && <i className="fas fa-check-circle" style={{ color: 'var(--success)', marginLeft: '6px', fontSize: '0.85rem' }}></i>}
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setTouched(prev => ({ ...prev, email: true }));
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                    placeholder="e.g. customer@example.com"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: errors.email ? '1.5px solid var(--danger)' : (email.trim().length > 0 && validateEmail(email)) ? '1.5px solid var(--success)' : '1px solid var(--primary-gold-border)',
                      backgroundColor: errors.email ? 'rgba(198,40,40,0.01)' : 'white',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                  />
                  {errors.email && <span className="error-msg-inline">{errors.email}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '600', display: 'flex', alignItems: 'center', marginBottom: '6px', color: 'var(--text-dark)' }}>
                    Phone Number *
                    {phone.trim().length > 0 && validatePhone(phone) && <i className="fas fa-check-circle" style={{ color: 'var(--success)', marginLeft: '6px', fontSize: '0.85rem' }}></i>}
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setTouched(prev => ({ ...prev, phone: true }));
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                    placeholder="e.g. 9876543210"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: errors.phone ? '1.5px solid var(--danger)' : (phone.trim().length > 0 && validatePhone(phone)) ? '1.5px solid var(--success)' : '1px solid var(--primary-gold-border)',
                      backgroundColor: errors.phone ? 'rgba(198,40,40,0.01)' : 'white',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                  />
                  {errors.phone && <span className="error-msg-inline">{errors.phone}</span>}
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', display: 'flex', alignItems: 'center', marginBottom: '6px', color: 'var(--text-dark)' }}>
                  Street Address *
                  {address.trim().length > 0 && validateAddress(address) && <i className="fas fa-check-circle" style={{ color: 'var(--success)', marginLeft: '6px', fontSize: '0.85rem' }}></i>}
                </label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setTouched(prev => ({ ...prev, address: true }));
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, address: true }))}
                  placeholder="House No, Building name, Street name, Locality"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '4px',
                    border: errors.address ? '1.5px solid var(--danger)' : (address.trim().length > 0 && validateAddress(address)) ? '1.5px solid var(--success)' : '1px solid var(--primary-gold-border)',
                    backgroundColor: errors.address ? 'rgba(198,40,40,0.01)' : 'white',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                />
                {errors.address && <span className="error-msg-inline">{errors.address}</span>}
              </div>

              {/* Landmark */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', display: 'flex', alignItems: 'center', marginBottom: '6px', color: 'var(--text-dark)' }}>
                  Landmark (Optional)
                  {landmark.trim().length > 0 && validateLandmark(landmark) && <i className="fas fa-check-circle" style={{ color: 'var(--success)', marginLeft: '6px', fontSize: '0.85rem' }}></i>}
                </label>
                <input
                  type="text"
                  id="landmark"
                  value={landmark}
                  onChange={(e) => {
                    setLandmark(e.target.value);
                    setTouched(prev => ({ ...prev, landmark: true }));
                  }}
                  placeholder="e.g. Near Big Temple or School"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '4px',
                    border: errors.landmark ? '1.5px solid var(--danger)' : (landmark.trim().length > 0 && validateLandmark(landmark)) ? '1.5px solid var(--success)' : '1px solid var(--primary-gold-border)',
                    backgroundColor: errors.landmark ? 'rgba(198,40,40,0.01)' : 'white',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                />
                {errors.landmark && <span className="error-msg-inline">{errors.landmark}</span>}
              </div>

              {/* City, State & ZIP Code */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '600', display: 'flex', alignItems: 'center', marginBottom: '6px', color: 'var(--text-dark)' }}>
                    City *
                    {city.trim().length > 0 && validateCity(city) && <i className="fas fa-check-circle" style={{ color: 'var(--success)', marginLeft: '6px', fontSize: '0.85rem' }}></i>}
                  </label>
                  <input
                    type="text"
                    id="city"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setTouched(prev => ({ ...prev, city: true }));
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, city: true }))}
                    placeholder="City"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: errors.city ? '1.5px solid var(--danger)' : (city.trim().length > 0 && validateCity(city)) ? '1.5px solid var(--success)' : '1px solid var(--primary-gold-border)',
                      backgroundColor: errors.city ? 'rgba(198,40,40,0.01)' : 'white',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                  />
                  {errors.city && <span className="error-msg-inline">{errors.city}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '600', display: 'flex', alignItems: 'center', marginBottom: '6px', color: 'var(--text-dark)' }}>
                    State *
                    {state && validateState(state) && <i className="fas fa-check-circle" style={{ color: 'var(--success)', marginLeft: '6px', fontSize: '0.85rem' }}></i>}
                  </label>
                  <select
                    id="state"
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      setTouched(prev => ({ ...prev, state: true }));
                    }}
                    onBlur={() => setTouched(prev => ({ ...prev, state: true }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: errors.state ? '1.5px solid var(--danger)' : (state && validateState(state)) ? '1.5px solid var(--success)' : '1px solid var(--primary-gold-border)',
                      backgroundColor: errors.state ? 'rgba(198,40,40,0.01)' : 'white',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box',
                      backgroundPosition: 'right 12px center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    <option value="">— Select State —</option>
                    {INDIAN_STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.state && <span className="error-msg-inline">{errors.state}</span>}
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', fontWeight: '600', display: 'flex', alignItems: 'center', marginBottom: '6px', color: 'var(--text-dark)' }}>
                    ZIP Code *
                    {zip.trim().length > 0 && validateZip(zip) && <i className="fas fa-check-circle" style={{ color: 'var(--success)', marginLeft: '6px', fontSize: '0.85rem' }}></i>}
                  </label>
                  <input
                    type="text"
                    id="zip"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={zip}
                    onChange={handleZipChange}
                    onBlur={() => setTouched(prev => ({ ...prev, zip: true }))}
                    placeholder="e.g. 400001"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '4px',
                      border: errors.zip ? '1.5px solid var(--danger)' : (zip.trim().length > 0 && validateZip(zip)) ? '1.5px solid var(--success)' : '1px solid var(--primary-gold-border)',
                      backgroundColor: errors.zip ? 'rgba(198,40,40,0.01)' : 'white',
                      fontSize: '0.85rem',
                      transition: 'all 0.2s',
                      boxSizing: 'border-box'
                    }}
                  />
                  {errors.zip && <span className="error-msg-inline">{errors.zip}</span>}
                  {zip.length === 6 && zip[0] !== '0' && (
                    <div style={{ color: 'var(--success)', fontSize: '0.78rem', marginTop: '6px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <i className="fas fa-truck"></i> Estimated delivery: 3–5 business days
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Methods */}
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--primary-gold-border)', paddingTop: '20px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '16px' }}>Payment Method</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', border: '1px solid var(--primary-gold-border)', borderRadius: '6px', cursor: 'pointer', background: paymentMethod === 'cod' ? 'var(--primary-gold-light)' : 'white' }}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      style={{ accentColor: 'var(--primary-gold)' }}
                    />
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.88rem' }}>Cash on Delivery (COD)</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pay cash when the secure wooden crate is delivered.</span>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', border: '1px solid var(--primary-gold-border)', borderRadius: '6px', cursor: 'pointer', background: paymentMethod === 'razorpay' ? 'var(--primary-gold-light)' : 'white' }}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="razorpay"
                      checked={paymentMethod === 'razorpay'}
                      onChange={() => setPaymentMethod('razorpay')}
                      style={{ accentColor: 'var(--primary-gold)' }}
                    />
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.88rem' }}>Razorpay Online Gateway</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pay instantly via UPI, Net Banking, Credit/Debit cards (Sandbox mode).</span>
                    </div>
                  </label>
                </div>
              </div>

              {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: '8px 0 0 0' }}>{error}</p>}

              <button 
                type="submit" 
                className="btn-gold" 
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  marginTop: '24px',
                  padding: '14px',
                  opacity: (!isFormValid || loading) ? 0.5 : 1,
                  cursor: (!isFormValid || loading) ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s'
                }}
                disabled={loading || !isFormValid}
              >
                {loading ? 'Processing Order...' : paymentMethod === 'razorpay' ? 'Pay Now via Razorpay' : 'Place Order (COD)'}
              </button>
            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '16px' }}>Order Summary</h3>
              
              {/* Product list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', maxHeight: '250px', overflowY: 'auto', paddingRight: '6px' }}>
                {cart.map((item) => {
                  const activePrice = item.discount_price && item.discount_price > 0 ? item.discount_price : item.price;
                  return (
                    <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <img src={item.image_path} alt={item.name} style={{ width: '50px', height: '50px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--primary-gold-border)' }} />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '0.82rem', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{item.name}</h4>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Qty: {item.quantity}</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{formatPrice(activePrice * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Coupon inputs */}
              <div style={{ borderTop: '1px solid var(--primary-gold-border)', borderBottom: '1px solid var(--primary-gold-border)', padding: '16px 0', marginBottom: '20px' }}>
                {coupon ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', background: 'var(--primary-gold-light)', padding: '8px 12px', borderRadius: '4px' }}>
                    <span>Coupon <strong>{coupon.code}</strong> Applied</span>
                    <button onClick={removeCoupon} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', fontWeight: '600', cursor: 'pointer' }}>Remove</button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="ENTER PROMO CODE"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--primary-gold-border)', fontSize: '0.78rem' }}
                    />
                    <button type="submit" className="btn-gold" style={{ padding: '8px 12px', fontSize: '0.75rem' }} disabled={applying}>
                      {applying ? '...' : 'Apply'}
                    </button>
                  </form>
                )}
                {couponError && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>{couponError}</p>}
                {couponSuccess && <p style={{ color: 'var(--success)', fontSize: '0.75rem', margin: '4px 0 0 0' }}>{couponSuccess}</p>}
              </div>

              {/* Price Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                    <span>Coupon Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--primary-gold-border)', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: '700' }}>
                  <span>Total Pay</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-cream-dark)', padding: '16px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '1.8rem' }}>🛡️</span>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dark)', lineHeight: '1.5' }}>
                <strong>Secure Transaction Guarantee:</strong> All payment info is processed inside encrypted channels. We do not store card details on our servers.
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
