'use client';
import { useState, useEffect, useTransition } from 'react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

export default function MyOrdersPage() {
  const [patronInfo, setPatronInfo] = useState('');
  const [savedPatron, setSavedPatron] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [isPending, startTransition] = useTransition();

  // Cancel & Edit Modal States
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [editOrder, setEditOrder] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editZip, setEditZip] = useState('');
  const [editError, setEditError] = useState('');
  const [updating, setUpdating] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('anant_patron_info');
    if (saved) {
      setSavedPatron(saved);
      fetchOrders(saved);
    }
  }, []);

  const fetchOrders = async (contact) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactInfo: contact })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
      }
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!patronInfo.trim()) return;
    localStorage.setItem('anant_patron_info', patronInfo.trim());
    setSavedPatron(patronInfo.trim());
    fetchOrders(patronInfo.trim());
  };

  const handleLogout = () => {
    localStorage.removeItem('anant_patron_info');
    setSavedPatron('');
    setOrders([]);
    setPatronInfo('');
    setError('');
  };

  const handleCancelOrderSubmit = async () => {
    if (!cancelOrderId) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: cancelOrderId,
          action: 'cancel'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to cancel order');

      // Refresh orders list
      await fetchOrders(savedPatron);
      setCancelOrderId(null);
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenEditModal = (order) => {
    setEditOrder(order);
    setEditName(order.customer_name);
    setEditPhone(order.customer_phone);

    // Try to parse street address from combined shipping string
    // Single string format: "Street Address, City, State - Zip, India"
    const addrParts = order.shipping_address.split(', ');
    if (addrParts.length >= 4) {
      setEditAddress(addrParts[0]);
      setEditCity(addrParts[1]);
      
      const stateZipPart = addrParts[2] || '';
      const stateZipSplit = stateZipPart.split(' - ');
      setEditState(stateZipSplit[0] || '');
      setEditZip(stateZipSplit[1] || '');
    } else {
      setEditAddress(order.shipping_address);
      setEditCity('');
      setEditState('');
      setEditZip('');
    }
    setEditError('');
  };

  const handleEditDetailsSubmit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editName.trim()) {
      setEditError('Recipient name is required.');
      return;
    }
    if (!editPhone.trim() || !/^\+?[0-9\s\-]{8,15}$/.test(editPhone.trim())) {
      setEditError('Please enter a valid phone number.');
      return;
    }
    if (!editAddress.trim()) {
      setEditError('Street address cannot be empty.');
      return;
    }
    if (!editCity.trim()) {
      setEditError('City is required.');
      return;
    }
    if (!editState.trim()) {
      setEditError('State is required.');
      return;
    }
    if (!editZip.trim() || !/^[0-9]{5,6}$/.test(editZip.trim())) {
      setEditError('Please enter a valid pincode/zipcode.');
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: editOrder.id,
          action: 'update_shipping',
          data: {
            name: editName,
            phone: editPhone,
            address: editAddress,
            city: editCity,
            state: editState,
            zip: editZip
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update details');

      // Refresh orders
      await fetchOrders(savedPatron);
      setEditOrder(null);
    } catch (err) {
      setEditError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Filter orders by active tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Cancelled') return order.order_status === 'Cancelled';
    if (activeTab === 'Delivered') return order.order_status === 'Delivered';
    if (activeTab === 'Processing') {
      return ['Pending', 'Confirmed', 'Packed', 'Shipped'].includes(order.order_status);
    }
    return true;
  });

  const isUpdatable = (status) => ['Pending', 'Confirmed'].includes(status);

  return (
    <div style={{ background: 'var(--bg-cream)', minHeight: '80vh' }} className="responsive-section">
      <div className="responsive-container">
        
        {/* Title Heading */}
        <div className="section-heading" style={{ marginBottom: '2.5rem' }}>
          <h2>My Sacred Orders</h2>
          <div className="gold-line"></div>
          <p>Track delivery progression, customize shipment details, or request order cancellations.</p>
        </div>

        {!savedPatron ? (
          /* LOOKUP PORTAL */
          <div style={{ maxWidth: '500px', margin: '0 auto', background: 'white', padding: '32px', borderRadius: '12px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '16px', textAlign: 'center' }}>Patron Lookup Portal</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '24px' }}>
              Please enter the email address or phone number used during checkout to retrieve your selection details.
            </p>
            <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-dark)', display: 'block', marginBottom: '6px' }}>Email or Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. hemant@example.com or +919876543210"
                  value={patronInfo}
                  onChange={(e) => setPatronInfo(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid var(--primary-gold-border)', fontSize: '0.88rem' }}
                />
              </div>
              {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
              <button type="submit" className="btn-gold" style={{ justifyContent: 'center', padding: '12px' }} disabled={loading}>
                {loading ? 'Searching...' : 'Retrieve Orders'}
              </button>
            </form>
          </div>
        ) : (
          /* DASHBOARD VIEW */
          <div>
            {/* Patron header banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '16px 24px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Logged in as:</span>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-dark)' }}>{savedPatron}</strong>
              </div>
              <button onClick={handleLogout} className="btn-outline-gold" style={{ padding: '8px 16px', fontSize: '0.75rem' }}>
                <i className="fas fa-sign-out-alt"></i> Lookup Different Patron
              </button>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--primary-gold-border)', paddingBottom: '1px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {['All', 'Processing', 'Delivered', 'Cancelled'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '10px 20px',
                    border: activeTab === tab ? '1px solid var(--primary-gold-border)' : '1px solid transparent',
                    background: activeTab === tab ? 'white' : 'transparent',
                    borderTopLeftRadius: '6px',
                    borderTopRightRadius: '6px',
                    borderBottom: activeTab === tab ? '1px solid white' : 'none',
                    fontSize: '0.82rem',
                    fontWeight: activeTab === tab ? '600' : '400',
                    cursor: 'pointer',
                    color: activeTab === tab ? 'var(--text-dark)' : 'var(--text-muted)'
                  }}
                >
                  {tab} Orders
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
                <p style={{ color: 'var(--text-muted)' }}>Retrieving your sacred orders list...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🪷</div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '8px' }}>No Orders Found</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>We couldn't find any orders matching "{activeTab}" status under your profile.</p>
              </div>
            ) : (
              /* ORDERS LIST */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {filteredOrders.map((order) => (
                  <div key={order.id} style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                    
                    {/* Header Details */}
                    <div style={{ background: 'var(--bg-cream-dark)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', fontSize: '0.82rem', borderBottom: '1px solid var(--primary-gold-border)' }}>
                      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>ORDER PLACED</span>
                          <strong>{new Date(order.created_at).toLocaleDateString('en-IN')}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>TOTAL AMOUNT</span>
                          <strong>{formatPrice(order.total_amount)}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>SHIP TO</span>
                          <strong>{order.customer_name}</strong>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>ORDER NUMBER</span>
                        <strong>{order.order_number}</strong>
                      </div>
                    </div>

                    {/* Order Body info */}
                    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', flexWrap: 'wrap' }}>
                      
                      {/* Products List & Status */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Premium Order Progress Tracker */}
                        {order.order_status !== 'Cancelled' ? (
                          <div className="order-progress-tracker">
                            {['Pending', 'Processing', 'Shipped', 'Delivered'].map((step, idx, arr) => {
                              const statusOrder = ['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered'];
                              const currentIndex = statusOrder.indexOf(order.order_status);
                              const stepIndex = statusOrder.indexOf(step);
                              
                              let state = 'pending';
                              if (currentIndex > stepIndex || order.order_status === 'Delivered') state = 'completed';
                              else if (currentIndex === stepIndex || (step === 'Processing' && ['Confirmed', 'Packed'].includes(order.order_status))) state = 'current';

                              return (
                                <div key={step} className={`order-progress-step ${state}`}>
                                  <div className="order-progress-dot"></div>
                                  <span className="order-progress-label">{step}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: '600' }}>Status:</span>
                            <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '600', backgroundColor: 'rgba(198,40,40,0.1)', color: 'var(--danger)', textTransform: 'uppercase' }}>
                              CANCELLED
                            </span>
                          </div>
                        )}

                        {order.items?.map((item) => (
                          <div key={item.id} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <img src={item.image_path} alt={item.product_name} style={{ width: '64px', height: '64px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--primary-gold-border)' }} />
                            <div>
                              <h4 style={{ fontSize: '0.88rem', fontWeight: '600', margin: 0 }}>{item.product_name}</h4>
                              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                                Qty: {item.quantity} • Price: {formatPrice(item.price)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Delivery and payment summaries */}
                      <div style={{ borderLeft: '1px solid var(--bg-cream-dark)', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.8rem' }}>
                        <div>
                          <strong style={{ display: 'block', marginBottom: '4px' }}>Delivery Address:</strong>
                          <span style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>{order.shipping_address}</span>
                          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>Phone: {order.customer_phone}</p>
                        </div>
                        <div>
                          <strong style={{ display: 'block', marginBottom: '4px' }}>Payment Summary:</strong>
                          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Method: {order.payment_method.toUpperCase()}</p>
                          <p style={{ margin: 0, color: 'var(--text-muted)' }}>Status: {order.payment_status}</p>
                        </div>

                        {/* Customer Actions */}
                        {isUpdatable(order.order_status) && (
                          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                            <button
                              onClick={() => handleOpenEditModal(order)}
                              className="btn-outline-gold"
                              style={{ padding: '8px 12px', fontSize: '0.72rem', flex: 1, justifyContent: 'center' }}
                            >
                              Edit Address
                            </button>
                            <button
                              onClick={() => setCancelOrderId(order.id)}
                              style={{
                                padding: '8px 12px',
                                fontSize: '0.72rem',
                                flex: 1,
                                background: 'transparent',
                                border: '1px solid var(--danger)',
                                borderRadius: '4px',
                                color: 'var(--danger)',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                              }}
                            >
                              Cancel Order
                            </button>
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ============ CANCELLATION MODAL ============ */}
      {cancelOrderId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '36px 32px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', border: '1px solid var(--primary-gold-border)' }}>
            <div style={{ fontSize: '3rem', color: 'var(--danger)', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '12px' }}>Cancel Your Order?</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '24px' }}>
              Are you sure you want to cancel this order? This action will restore product inventories and cannot be reversed.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setCancelOrderId(null)}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--text-muted)' }}
              >
                Go Back
              </button>
              <button
                onClick={handleCancelOrderSubmit}
                style={{ flex: 1, padding: '10px', background: 'var(--danger)', border: 'none', borderRadius: '4px', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                disabled={updating}
              >
                {updating ? 'Processing...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ EDIT SHIPPING DETAILS MODAL ============ */}
      {editOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '480px', width: '95%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', border: '1px solid var(--primary-gold-border)', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '15px', right: '20px', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setEditOrder(null)}>&times;</span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '16px' }}>Update Delivery Details</h3>

            
            <form onSubmit={handleEditDetailsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Recipient Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Street Address *</label>
                <input
                  type="text"
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>City *</label>
                  <input
                    type="text"
                    required
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>State *</label>
                  <input
                    type="text"
                    required
                    value={editState}
                    onChange={(e) => setEditState(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', display: 'block', marginBottom: '4px' }}>ZIP *</label>
                  <input
                    type="text"
                    required
                    value={editZip}
                    onChange={(e) => setEditZip(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }}
                  />
                </div>
              </div>

              {editError && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: 0 }}>{editError}</p>}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--primary-gold-border)', paddingTop: '16px' }}>
                <button type="button" onClick={() => setEditOrder(null)} className="btn-secondary" style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--text-muted)' }}>Cancel</button>
                <button type="submit" className="btn-gold" style={{ padding: '8px 16px' }} disabled={updating}>
                  {updating ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
