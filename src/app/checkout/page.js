'use client';
import { useState, useEffect } from 'react';
import { useCart } from '@/components/context/AppContext';
import { formatPrice, generateOrderNumber } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", 
  "Ladakh", "Lakshadweep", "Puducherry"
];

function WhatsAppAutoOpen({ url }) {
  useEffect(() => {
    if (url) {
      const timer = setTimeout(() => {
        window.open(url, '_blank');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [url]);
  return null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    loading: cartLoading,
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
  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' or 'cod'
  const [createAccount, setCreateAccount] = useState(false);
  const [touched, setTouched] = useState({});

  // Auth & Saved Addresses
  const [authUser, setAuthUser] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Checkout execution states
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  // Inline Validation Helpers
  const validateName = (val) => val.trim().length >= 3 && val.trim().length <= 50 && /^[a-zA-Z\s\.]+$/.test(val.trim());
  const validatePhone = (val) => /^[6-9][0-9]{9}$/.test(val.trim());
  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const validateAddress = (val) => val.trim().length >= 5;
  const validateCity = (val) => val.trim().length >= 3 && /^[a-zA-Z\s\.\-]+$/.test(val.trim());
  const validateState = (val) => val.trim().length > 0;
  const validateZip = (val) => /^[1-9][0-9]{5}$/.test(val.trim());
  const validateLandmark = (val) => val.trim().length === 0 || val.trim().length <= 100;

  const handleInputChange = (field, value, validator, errorMessage) => {
    if (field === 'name') setName(value);
    if (field === 'email') setEmail(value);
    if (field === 'phone') setPhone(value);
    if (field === 'address') setAddress(value);
    if (field === 'landmark') setLandmark(value);
    if (field === 'city') setCity(value);
    if (field === 'state') setState(value);
    
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (!validator(value)) {
      setErrors(prev => ({ ...prev, [field]: errorMessage }));
    } else {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  // Form validity check
  const isFormValid = validateName(name) && validateEmail(email) && validatePhone(phone) && validateAddress(address) && validateCity(city) && validateState(state) && validateZip(zip) && validateLandmark(landmark);

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [applying, setApplying] = useState(false);

  const [settings, setSettings] = useState({});

  // Health check state
  const [paymentHealth, setPaymentHealth] = useState({ checked: true, healthy: true, message: '' });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error('Failed to fetch settings', err));
      
    // Fetch customer profile & addresses
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setAuthUser(data.user);
          if (data.user.name) setName(data.user.name);
          if (data.user.email) setEmail(data.user.email);
          if (data.user.phone) setPhone(data.user.phone);
        }
        if (data.addresses && data.addresses.length > 0) {
          setSavedAddresses(data.addresses);
          const defaultAddr = data.addresses[0]; // Assuming sorted by is_default
          handleSelectAddress(defaultAddr);
        }
      })
      .catch(err => console.error('Failed to fetch customer profile', err));
  }, []);

  const handleSelectAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setName(addr.name || authUser?.name || '');
    setPhone(addr.phone || authUser?.phone || '');
    setAddress(addr.address || '');
    setCity(addr.city || '');
    setState(addr.state || '');
    setZip(addr.pincode || '');
    
    // Clear errors for fields that are filled
    setErrors({});
  };

  useEffect(() => {
    fetch('/api/razorpay/health')
      .then(res => res.json())
      .then(data => {
        setPaymentHealth({
          checked: true,
          healthy: Boolean(data.healthy),
          message: data.healthy ? '' : ''
        });
      })
      .catch(() => {
        setPaymentHealth({ checked: true, healthy: true, message: '' });
      });
  }, []);

  // Next.js Script will be used to load Razorpay natively instead of manual DOM manipulation.

  if (orderSuccess) {
    const adminNumber = settings.whatsapp_admin_number || '917275819354';
    const template = settings.whatsapp_message_template || "🛒 *New Order Received – Anant Arts*\n\nOrder ID: {{order_id}}\n\nCustomer Name: {{customer_name}}\nMobile Number: {{customer_phone}}\nEmail: {{customer_email}}\n\nProducts Ordered:\n{{product_list}}\n\nTotal Amount: ₹{{order_total}}\n\nPayment Method: {{payment_method}}\nPayment Status: {{payment_status}}\n\nDelivery Address:\n{{full_address}}\n\nOrder Date:\n{{order_date}}\n\nView Order:\n{{admin_order_link}}\n\nPlease process this order as soon as possible.";

    const productListStr = (orderSuccess.items || []).map((item, index) => {
      return `${index + 1}. ${item.product_name || item.name} × ${item.quantity}`;
    }).join('\n');

    const templateData = {
      order_id: orderSuccess.order_number,
      customer_name: orderSuccess.customer_name,
      customer_phone: orderSuccess.customer_phone || phone,
      customer_email: orderSuccess.customer_email || email,
      product_list: productListStr,
      order_total: orderSuccess.total_amount,
      payment_method: orderSuccess.payment_method,
      payment_status: orderSuccess.payment_status,
      full_address: orderSuccess.shipping_address,
      order_date: new Date(orderSuccess.created_at || Date.now()).toLocaleString('en-IN'),
      admin_order_link: typeof window !== 'undefined' ? `${window.location.origin}/admin/orders` : ''
    };

    let parsed = template;
    for (const [key, value] of Object.entries(templateData)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      parsed = parsed.replace(regex, value || '');
    }

    let toNum = adminNumber.replace(/\D/g, '');
    if (toNum.length === 10) toNum = '91' + toNum;
    const waLink = `https://wa.me/${toNum}?text=${encodeURIComponent(parsed)}`;

    return (
      <div style={{ background: 'var(--bg-cream)', padding: '5rem 0', textAlign: 'center' }}>
        <WhatsAppAutoOpen url={waLink} />
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px', background: 'white', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
          <div style={{ fontSize: '4.5rem', color: 'var(--success)', marginBottom: '16px' }}>✔️</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', marginBottom: '8px' }}>Order Placed Successfully!</h2>
          {orderSuccess.warning && (
            <div style={{ background: '#FFF3E0', color: '#E65100', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.9rem', border: '1px solid #FFE082' }}>
              <strong>Payment received successfully.</strong> We are processing your order in the background.
            </div>
          )}
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Thank you for your patronage. Your order has been registered under order number: <strong style={{ color: 'var(--text-dark)' }}>{orderSuccess.order_number}</strong>.
          </p>

          {/* WhatsApp Direct Action Button */}
          <div style={{ background: '#E8F5E9', border: '1px solid #C8E6C9', padding: '20px', borderRadius: '6px', marginBottom: '24px' }}>
            <h4 style={{ color: '#2E7D32', fontSize: '1rem', fontWeight: '700', marginBottom: '8px' }}>🚀 Action Required: Complete Order via WhatsApp</h4>
            <p style={{ fontSize: '0.78rem', color: '#4E7D48', marginBottom: '16px', lineHeight: '1.4' }}>
              Please send a quick WhatsApp message to confirm your order with us. Click the button below to pre-fill your order details.
            </p>
            <a 
              href={waLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-gold" 
              style={{ 
                background: '#25D366', 
                borderColor: '#128C7E', 
                color: 'white', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '12px 24px', 
                fontSize: '0.88rem', 
                fontWeight: '700',
                boxShadow: '0 4px 6px rgba(37, 211, 102, 0.2)' 
              }}
            >
              <i className="fab fa-whatsapp" style={{ fontSize: '1.2rem' }}></i>
              Send Confirmation to WhatsApp
            </a>
          </div>

          <div style={{ background: 'var(--bg-cream)', padding: '18px', borderRadius: '6px', textAlign: 'left', fontSize: '0.85rem', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--primary-gold-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '6px' }}>
              <span><strong>Payment Status:</strong></span>
              <span style={{ 
                background: (orderSuccess.payment_status === 'Captured' || orderSuccess.payment_status === 'Paid') ? '#E8F5E9' : '#FFF3E0', 
                color: (orderSuccess.payment_status === 'Captured' || orderSuccess.payment_status === 'Paid') ? '#2E7D32' : '#E65100', 
                padding: '2px 10px', 
                borderRadius: '12px', 
                fontWeight: '700',
                fontSize: '0.78rem'
              }}>
                ✓ {orderSuccess.payment_status || 'Captured'}
              </span>
            </div>
            {orderSuccess.payment_id && (
              <div><strong>Transaction ID:</strong> <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>{orderSuccess.payment_id}</code></div>
            )}
            <div><strong>Estimated Delivery:</strong> <span style={{ color: 'var(--primary-gold)', fontWeight: '700' }}>3-7 Business Days</span></div>
            <div><strong>Recipient:</strong> {orderSuccess.customer_name}</div>
            <div><strong>Email:</strong> {orderSuccess.customer_email}</div>
            <div><strong>Delivery Address:</strong> {orderSuccess.shipping_address}</div>
            <div><strong>Total Paid:</strong> <strong style={{ fontSize: '1rem', color: 'var(--text-dark)' }}>{formatPrice(orderSuccess.total_amount)}</strong></div>
            <div><strong>Payment Method:</strong> {orderSuccess.payment_method ? orderSuccess.payment_method.toUpperCase() : 'ONLINE'}</div>
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
  if (cartLoading) {
    return (
      <div style={{ background: 'var(--bg-cream)', padding: '10rem 0', textAlign: 'center', minHeight: '60vh' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--primary-gold-border)', borderTopColor: 'var(--primary-gold)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
        <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Loading your checkout...</p>
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

    if (!validateZip(cleaned)) {
      setErrors(prev => ({ ...prev, zip: 'Please enter a valid 6-digit postal code.' }));
    } else {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy.zip;
        return copy;
      });
    }

    if (cleaned.length === 6 && cleaned[0] !== '0') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
        
        const response = await fetch(`https://api.postalpincode.in/pincode/${cleaned}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data && data[0]?.Status === 'Success') {
            const office = data[0].PostOffice[0];
            if (office) {
              setCity(office.District || office.Name || '');
              setState(office.State || '');
              
              setErrors(prev => {
                const copy = { ...prev };
                delete copy.city;
                delete copy.state;
                return copy;
              });

              setTouched(prev => ({ ...prev, city: true, state: true }));
            }
          }
        }
      } catch (err) {
        // Suppress noisy network errors for this non-critical autofill feature
        console.warn('ZIP lookup autofill unavailable:', err.message || err);
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
    setLoading(true);
    
    const orderNumber = generateOrderNumber();
    const shippingAddressString = `${address}, ${landmark ? landmark + ', ' : ''}${city}, ${state} - ${zip}, India`;

    const orderDetailsPayload = {
      order_number: orderNumber,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      street_address: address,
      city: city,
      state: state,
      zip: zip,
      landmark: landmark,
      shipping_address: shippingAddressString,
      billing_address: shippingAddressString,
      coupon_id: coupon?.id || null,
      discount_amount: discount,
      shipping_charge: shipping,
      subtotal: subtotal,
      total_amount: total,
      create_account: createAccount,
      items: cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        price: item.discount_price && item.discount_price > 0 ? item.discount_price : item.price,
        quantity: item.quantity
      }))
    };

    if (paymentMethod === 'razorpay') {
      try {
        // 1. Generate Razorpay Order server-side with 3-attempt auto-retry
        let orderData = null;
        let lastErrMessage = null;

        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            console.log(`[Checkout Client Attempt ${attempt}/3] Requesting Razorpay order creation...`);
            console.log("Creating Order");
            
            const orderRes = await fetch('/api/razorpay/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(orderDetailsPayload)
            });

            const data = await orderRes.json();
            console.log("Order Response:", data);
            
            if (orderRes.ok && data.success) {
              orderData = data;
              break;
            } else {
              lastErrMessage = data.message;
            }
          } catch (fetchErr) {
            console.warn(`[Checkout Client Retry ${attempt}/3 Exception]:`, fetchErr.message);
            lastErrMessage = fetchErr.message;
          }

          if (attempt < 3) {
            await new Promise((res) => setTimeout(res, 500 * attempt));
          }
        }

        if (!orderData) {
          setLoading(false);
          setError(lastErrMessage || "We're unable to connect to our payment partner right now. Please try again in a few moments or choose Cash on Delivery.");
          setPaymentMethod('cod'); // Automatically select COD as fallback!
          return;
        }
        const razorpayKey = orderData.key_id || (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TF5Q4XYGrKlT1b');

        // 2. Configure Razorpay modal with server generated order_id
        if (!orderData || !orderData.order_id) {
          throw new Error(lastErrMessage || 'Failed to initialize payment.');
        }

        // Check if backend gave us a fake order ID because of missing credentials
        if (orderData.order_id.startsWith('order_') && orderData.order_id.length > 25) {
           console.warn("⚠️ Client-side fallback order ID detected. Razorpay popup may fail if credentials are not configured on the backend.");
        }

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'missing_key',
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'Anant Arts',
          description: 'Divine Idols Checkout',
          order_id: orderData.order_id,
          handler: function (response) {
            console.log("Payment Success Callback Started");
            (async () => {
              try {
                setLoading(true);
                console.log("Verification Request - Payment ID:", response.razorpay_payment_id, "Order ID:", response.razorpay_order_id, "Signature:", response.razorpay_signature);
                // 3. Verify Payment & Auto-Capture on server side before creating DB order
                const verifyRes = await fetch('/api/razorpay/verify-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    orderDetails: orderDetailsPayload
                  })
                });

                const verifyData = await verifyRes.json();
                console.log("Verification Response:", verifyData);

                if (!verifyRes.ok || !verifyData.success) {
                  throw new Error(verifyData.message || verifyData.error || `Verification failed for Transaction ${response.razorpay_payment_id}`);
                }

                // Payment Verified & Order Created successfully!
                setOrderSuccess({
                  ...orderDetailsPayload,
                  id: verifyData.order_id,
                  payment_method: 'Razorpay',
                  payment_status: verifyData.payment_status || 'Captured',
                  payment_id: response.razorpay_payment_id,
                  created_at: new Date().toISOString(),
                  warning: verifyData.warning
                });
                clearCart();
              } catch (verifyErr) {
                console.log("Payment Error:", verifyErr);
                console.error('Payment Verification Callback Exception:', verifyErr);
                const actualError = verifyErr.message || 'Verification failed.';
                alert(actualError); // EXACT ROOT ERROR displayed as alert
                setError(`Payment Notice: ${actualError} Transaction Reference: ${response.razorpay_payment_id || 'N/A'}.`);
              } finally {
                setLoading(false);
              }
            })();
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
              setError('Payment window was closed. Your cart and shipping details remain saved. You can retry or choose Cash on Delivery.');
            }
          }
        };

        if (!window.Razorpay) {
          console.error("Razorpay SDK not loaded. Blocked by browser?");
          setLoading(false);
          alert("Payment gateway failed to load. Please disable any adblockers or strict tracking protection, or try Cash on Delivery.");
          setPaymentMethod('cod');
          return;
        }

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          console.error("Razorpay SDK Payment Failed:", response.error);
          setLoading(false);
          setError(`Payment failed: ${response.error.description || 'Unknown error'}. Please try again.`);
        });

        rzp.open();
      } catch (err) {
        console.error('Checkout Submission Error:', err);
        console.error('Razorpay Init Error:', err);
        const actualError = err.message || "We're unable to connect to our payment partner right now.";
        alert("Initialization Error: " + actualError); // EXACT ROOT ERROR displayed as alert
        setError(`${actualError} Please try again in a few moments or choose Cash on Delivery.`);
        setPaymentMethod('cod');
        setLoading(false);
      }
    } else {
      // Cash on Delivery flow
      createDbOrder(orderNumber, shippingAddressString, 'COD', 'Pending', null, orderDetailsPayload);
    }
  };

  const createDbOrder = async (orderNumber, shippingAddress, method, payStatus, paymentId, orderDetailsPayload) => {
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderDetailsPayload,
          payment_method: method,
          payment_status: payStatus,
          payment_id: paymentId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error completing checkout');

      setOrderSuccess({ ...data.order, items: cart });
      clearCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0' }}>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        
        <div className="section-heading" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem' }}>Checkout Details</h2>
          <div className="gold-line" style={{ margin: '8px 0 0 0' }}></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', gap: '3rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          
          {/* Left Column: Customer Form */}
          <div style={{ flex: '2 1 500px', background: 'white', padding: '32px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
            
            {savedAddresses.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '16px' }}>Saved Addresses</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {savedAddresses.map(addr => (
                    <div 
                      key={addr.id}
                      onClick={() => handleSelectAddress(addr)}
                      style={{
                        padding: '16px',
                        border: selectedAddressId === addr.id ? '2px solid var(--primary-gold)' : '1px solid var(--primary-gold-border)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: selectedAddressId === addr.id ? 'var(--primary-gold-light)' : 'white'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ fontSize: '0.9rem' }}>{addr.name}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{addr.phone}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-dark)', lineHeight: '1.4' }}>
                        {addr.address}<br />
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => {
                      setSelectedAddressId(null);
                      setAddress(''); setCity(''); setState(''); setZip('');
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-gold)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', textAlign: 'left', padding: '8px 0' }}
                  >
                    + Add New Address
                  </button>
                </div>
              </div>
            )}

            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '20px' }}>{savedAddresses.length > 0 && selectedAddressId ? 'Edit Shipping Information' : 'Shipping Information'}</h3>
            
            {paymentHealth.checked && !paymentHealth.healthy && (
              <div style={{ padding: '12px 16px', borderRadius: '6px', background: '#FFF3E0', border: '1px solid #FFE082', color: '#E65100', marginBottom: '16px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
                <span>{paymentHealth.message}</span>
              </div>
            )}
            
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
                  onChange={(e) => handleInputChange('name', e.target.value, validateName, 'Please enter a valid full name.')}
                  onBlur={() => handleInputChange('name', name, validateName, 'Please enter a valid full name.')}
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
                    onChange={(e) => handleInputChange('email', e.target.value, validateEmail, 'Please enter a valid email address.')}
                    onBlur={() => handleInputChange('email', email, validateEmail, 'Please enter a valid email address.')}
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
                    onChange={(e) => handleInputChange('phone', e.target.value, validatePhone, 'Please enter a valid 10-digit mobile number.')}
                    onBlur={() => handleInputChange('phone', phone, validatePhone, 'Please enter a valid 10-digit mobile number.')}
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
                  onChange={(e) => handleInputChange('address', e.target.value, validateAddress, 'Please enter a complete delivery address.')}
                  onBlur={() => handleInputChange('address', address, validateAddress, 'Please enter a complete delivery address.')}
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
                  onChange={(e) => handleInputChange('landmark', e.target.value, validateLandmark, 'Landmark must be under 100 characters.')}
                  onBlur={() => handleInputChange('landmark', landmark, validateLandmark, 'Landmark must be under 100 characters.')}
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
                    onChange={(e) => handleInputChange('city', e.target.value, validateCity, 'Please enter a valid city name.')}
                    onBlur={() => handleInputChange('city', city, validateCity, 'Please enter a valid city name.')}
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
                    onChange={(e) => handleInputChange('state', e.target.value, validateState, 'Please select your state.')}
                    onBlur={() => handleInputChange('state', state, validateState, 'Please select your state.')}
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

              {!authUser && (
                <div style={{ marginTop: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-dark)', fontWeight: '500' }}>
                    <input 
                      type="checkbox" 
                      checked={createAccount}
                      onChange={(e) => setCreateAccount(e.target.checked)}
                      style={{ accentColor: 'var(--primary-gold)', width: '16px', height: '16px' }}
                    />
                    Create an account for faster checkout next time
                  </label>
                </div>
              )}

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

                {/* Payment Troubleshooting Callout */}
                <div style={{
                  marginTop: '16px',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  backgroundColor: '#faf8f2',
                  borderLeft: '4px solid var(--primary-gold)',
                  fontSize: '0.8rem',
                  lineHeight: '1.4',
                  color: 'var(--text-dark)'
                }}>
                  💡 <strong>Payment Troubleshooting:</strong> If your online transaction fails due to banking errors (e.g. <em>remitter invalid transaction</em>), please verify your daily bank limits, check your UPI app for pending authorization notifications, or select <strong>Cash on Delivery (COD)</strong> to complete your order immediately.
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
                  opacity: loading ? 0.5 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s'
                }}
                disabled={loading}
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
