'use client';
import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';
import { submitContactInquiry } from '@/app/actions';

// ============================================================
// ANANT ARTS — USER ACCOUNT PANEL
// A unified dashboard for customer order management,
// wishlist, profile, and support.
// ============================================================

const PANEL_SECTIONS = [
  { id: 'overview',    icon: 'fa-home',          label: 'Dashboard'     },
  { id: 'orders',      icon: 'fa-box-open',       label: 'My Orders'     },
  { id: 'wishlist',    icon: 'fa-heart',          label: 'Wishlist'      },
  { id: 'profile',     icon: 'fa-user-circle',    label: 'My Profile'    },
  { id: 'support',     icon: 'fa-headset',        label: 'Support'       },
];

const STATUS_COLOR = {
  Pending:   { bg: 'rgba(212,175,55,0.12)',   color: '#B59029' },
  Confirmed: { bg: 'rgba(21,101,192,0.1)',    color: '#1565C0' },
  Packed:    { bg: 'rgba(21,101,192,0.1)',    color: '#1565C0' },
  Shipped:   { bg: 'rgba(230,126,34,0.12)',   color: '#E67E22' },
  Delivered: { bg: 'rgba(46,125,50,0.1)',     color: '#2E7D32' },
  Cancelled: { bg: 'rgba(198,40,40,0.1)',     color: '#C62828' },
};

const steps = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];

export default function AccountPage() {
  const [section, setSection] = useState('overview');
  const [patron, setPatron] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wishlist, setWishlist] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Profile form
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  // Support form
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [supportStatus, setSupportStatus] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);

  // Cancel/Edit modal
  const [cancelId, setCancelId] = useState(null);
  const [editOrder, setEditOrder] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [editError, setEditError] = useState('');
  const [updating, setUpdating] = useState(false);

  // Tracking expand
  const [expandedOrder, setExpandedOrder] = useState(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('anant_patron_info');
    const name  = localStorage.getItem('anant_patron_name') || '';
    const phone = localStorage.getItem('anant_patron_phone') || '';
    if (saved) {
      setPatron(saved);
      fetchOrders(saved);
    }
    if (name)  setProfileName(name);
    if (phone) setProfilePhone(phone);

    // Load wishlist from localStorage
    try {
      const wl = JSON.parse(localStorage.getItem('anant_wishlist') || '[]');
      setWishlist(wl);
    } catch (e) {}
  }, []);

  const fetchOrders = async (contact) => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/orders/user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contactInfo: contact }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch orders');
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    localStorage.setItem('anant_patron_info', inputVal.trim());
    setPatron(inputVal.trim());
    fetchOrders(inputVal.trim());
  };

  const handleLogout = () => {
    localStorage.removeItem('anant_patron_info');
    setPatron(''); setOrders([]); setInputVal(''); setError('');
    setSection('overview');
  };

  const handleSaveProfile = () => {
    localStorage.setItem('anant_patron_name', profileName);
    localStorage.setItem('anant_patron_phone', profilePhone);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    setSupportLoading(true);
    const result = await submitContactInquiry({
      name: profileName || patron,
      email: patron.includes('@') ? patron : 'customer@unknown.com',
      phone: profilePhone || patron,
      subject: supportSubject,
      message: supportMsg,
    });
    setSupportLoading(false);
    setSupportStatus(result.success ? '✅ ' + result.message : '❌ ' + result.message);
    if (result.success) { setSupportSubject(''); setSupportMsg(''); }
  };

  const handleCancel = async () => {
    setUpdating(true);
    try {
      const res  = await fetch('/api/orders/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: cancelId, action: 'cancel' }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchOrders(patron);
      setCancelId(null);
    } catch (err) { alert(err.message); }
    finally { setUpdating(false); }
  };

  const handleOpenEdit = (order) => {
    setEditOrder(order);
    const parts = (order.shipping_address || '').split(', ');
    const stateZip = (parts[2] || '').split(' - ');
    setEditFields({ name: order.customer_name || '', phone: order.customer_phone || '', address: parts[0] || '', city: parts[1] || '', state: stateZip[0] || '', zip: stateZip[1] || '' });
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res  = await fetch('/api/orders/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: editOrder.id, action: 'update_shipping', data: editFields }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchOrders(patron);
      setEditOrder(null);
    } catch (err) { setEditError(err.message); }
    finally { setUpdating(false); }
  };

  const isUpdatable = (s) => ['Pending', 'Confirmed'].includes(s);
  const delivered   = orders.filter(o => o.order_status === 'Delivered').length;
  const active      = orders.filter(o => !['Delivered', 'Cancelled'].includes(o.order_status)).length;
  const totalSpend  = orders.filter(o => o.order_status !== 'Cancelled').reduce((s, o) => s + (o.total_amount || 0), 0);

  // ─── LOGIN GATE ──────────────────────────────────────────────
  if (!patron) {
    return (
      <div style={{ background: 'var(--bg-cream)', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: '440px', background: 'white', borderRadius: '16px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
          {/* Card Header */}
          <div style={{ background: 'linear-gradient(135deg, #1E1A17 0%, #3B2F2F 100%)', padding: '36px 32px 28px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(212,175,55,0.15)', border: '2px solid rgba(212,175,55,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="fas fa-user-circle" style={{ fontSize: '2rem', color: 'var(--primary-gold)' }}></i>
            </div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: 'white', margin: '0 0 6px' }}>My Account</h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', margin: 0 }}>Enter your email or phone used at checkout</p>
          </div>

          {/* Form */}
          <div style={{ padding: '32px' }}>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email or Phone Number</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. you@email.com or +919876543210"
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  style={{ width: '100%', padding: '13px 16px', borderRadius: '8px', border: '1.5px solid var(--primary-gold-border)', fontSize: '0.9rem', background: '#fafafa', transition: 'border-color 0.2s', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: 0 }}>{error}</p>}
              <button type="submit" className="btn-gold" style={{ justifyContent: 'center', padding: '13px', fontSize: '0.9rem', borderRadius: '8px', width: '100%' }} disabled={loading}>
                {loading ? <><i className="fas fa-spinner fa-spin"></i> Accessing...</> : <><i className="fas fa-sign-in-alt"></i> Access My Orders</>}
              </button>
            </form>
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--primary-gold-border)', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link href="/shop" style={{ fontSize: '0.8rem', color: 'var(--primary-gold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fas fa-store"></i> Browse Shop
              </Link>
              <span style={{ color: 'var(--primary-gold-border)', fontSize: '0.8rem' }}>•</span>
              <Link href="/order-tracking" style={{ fontSize: '0.8rem', color: 'var(--primary-gold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fas fa-truck"></i> Track Order
              </Link>
              <span style={{ color: 'var(--primary-gold-border)', fontSize: '0.8rem' }}>•</span>
              <Link href="/contact" style={{ fontSize: '0.8rem', color: 'var(--primary-gold)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fas fa-headset"></i> Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN DASHBOARD ──────────────────────────────────────────
  return (
    <div style={{ background: 'var(--bg-cream)', minHeight: '80vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Mobile header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', margin: 0 }}>
              {profileName ? `Welcome, ${profileName.split(' ')[0]} 🙏` : 'My Account'}
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>{patron}</p>
          </div>
          <button onClick={handleLogout} style={{ padding: '8px 14px', fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--primary-gold-border)', borderRadius: '6px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px', alignItems: 'start' }}>

          {/* ─── SIDEBAR ─── */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', position: 'sticky', top: '100px' }}>
            {/* Avatar block */}
            <div style={{ padding: '24px 20px', background: 'linear-gradient(135deg, #1E1A17, #3B2F2F)', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(212,175,55,0.2)', border: '2px solid rgba(212,175,55,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <i className="fas fa-user" style={{ color: 'var(--primary-gold)', fontSize: '1.4rem' }}></i>
              </div>
              <p style={{ color: 'white', fontWeight: '600', fontSize: '0.88rem', margin: '0 0 2px' }}>{profileName || 'Patron'}</p>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', margin: 0, wordBreak: 'break-all' }}>{patron}</p>
            </div>
            {/* Nav links */}
            <nav style={{ padding: '10px 0' }}>
              {PANEL_SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSection(s.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 20px', border: 'none', background: section === s.id ? 'var(--primary-gold-light)' : 'transparent',
                    borderLeft: section === s.id ? '3px solid var(--primary-gold)' : '3px solid transparent',
                    color: section === s.id ? 'var(--primary-gold-hover)' : 'var(--text-dark)',
                    fontSize: '0.85rem', fontWeight: section === s.id ? '600' : '400',
                    cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                  }}
                >
                  <i className={`fas ${s.icon}`} style={{ width: '18px', textAlign: 'center', opacity: section === s.id ? 1 : 0.6 }}></i>
                  {s.label}
                  {s.id === 'orders' && orders.length > 0 && (
                    <span style={{ marginLeft: 'auto', background: 'var(--primary-gold)', color: 'white', borderRadius: '10px', padding: '1px 8px', fontSize: '0.68rem', fontWeight: '700' }}>
                      {orders.length}
                    </span>
                  )}
                  {s.id === 'wishlist' && wishlist.length > 0 && (
                    <span style={{ marginLeft: 'auto', background: '#C62828', color: 'white', borderRadius: '10px', padding: '1px 8px', fontSize: '0.68rem', fontWeight: '700' }}>
                      {wishlist.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
            {/* Quick links */}
            <div style={{ padding: '10px 16px 16px', borderTop: '1px solid var(--primary-gold-border)', marginTop: '6px' }}>
              <p style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)', margin: '0 0 10px 4px' }}>Quick Links</p>
              {[
                { href: '/shop',           icon: 'fa-store',   label: 'Browse Shop' },
                { href: '/order-tracking', icon: 'fa-truck',   label: 'Track Order' },
                { href: '/contact',        icon: 'fa-envelope',label: 'Contact Us'  },
              ].map(l => (
                <Link key={l.href} href={l.href} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 4px', fontSize: '0.78rem', color: 'var(--text-muted)', borderRadius: '4px' }}>
                  <i className={`fas ${l.icon}`} style={{ width: '14px', color: 'var(--primary-gold)', opacity: 0.7 }}></i>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* ─── MAIN CONTENT PANEL ─── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* ══════ OVERVIEW ══════ */}
            {section === 'overview' && (
              <>
                {/* Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                  {[
                    { label: 'Total Orders',    value: orders.length,                    icon: 'fa-box',         color: '#1565C0' },
                    { label: 'Active Orders',   value: active,                           icon: 'fa-shipping-fast', color: '#E67E22' },
                    { label: 'Delivered',       value: delivered,                        icon: 'fa-check-circle', color: '#2E7D32' },
                    { label: 'Total Spent',     value: formatPrice(totalSpend),          icon: 'fa-rupee-sign',  color: 'var(--primary-gold-hover)' },
                  ].map(stat => (
                    <div key={stat.label} style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' }}>{stat.label}</p>
                          <p style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'var(--font-heading)', color: 'var(--text-dark)', margin: 0 }}>{stat.value}</p>
                        </div>
                        <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className={`fas ${stat.icon}`} style={{ color: stat.color, fontSize: '1rem' }}></i>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Orders */}
                <div style={{ background: 'white', borderRadius: '10px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--primary-gold-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', margin: 0 }}>Recent Orders</h3>
                    <button onClick={() => setSection('orders')} style={{ fontSize: '0.78rem', color: 'var(--primary-gold)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>View All →</button>
                  </div>
                  {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}><i className="fas fa-spinner fa-spin"></i> Loading...</div>
                  ) : orders.length === 0 ? (
                    <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🪷</div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No orders found under <strong>{patron}</strong>.</p>
                      <Link href="/shop" className="btn-gold" style={{ display: 'inline-flex', marginTop: '16px', padding: '10px 24px', fontSize: '0.85rem' }}>Start Shopping</Link>
                    </div>
                  ) : (
                    orders.slice(0, 3).map(order => (
                      <div key={order.id} style={{ padding: '16px 24px', borderBottom: '1px solid var(--primary-gold-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <p style={{ fontWeight: '600', fontSize: '0.88rem', margin: '0 0 2px' }}>{order.order_number}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{formatPrice(order.total_amount)}</span>
                          <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', background: STATUS_COLOR[order.order_status]?.bg || '#eee', color: STATUS_COLOR[order.order_status]?.color || '#666' }}>{order.order_status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Wishlist preview */}
                {wishlist.length > 0 && (
                  <div style={{ background: 'white', borderRadius: '10px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--primary-gold-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', margin: 0 }}>❤️ Wishlist ({wishlist.length})</h3>
                      <button onClick={() => setSection('wishlist')} style={{ fontSize: '0.78rem', color: 'var(--primary-gold)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>View All →</button>
                    </div>
                    <div style={{ padding: '16px 24px', display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '20px' }}>
                      {wishlist.slice(0, 6).map(item => (
                        <Link key={item.id} href={`/product/${item.slug}`} style={{ flex: '0 0 90px', textAlign: 'center' }}>
                          <div style={{ width: '90px', height: '90px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', overflow: 'hidden', marginBottom: '6px' }}>
                            <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <p style={{ fontSize: '0.68rem', color: 'var(--text-dark)', lineHeight: '1.3', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.name}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ══════ ORDERS ══════ */}
            {section === 'orders' && (
              <div style={{ background: 'white', borderRadius: '10px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--primary-gold-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', margin: 0 }}>📦 My Orders</h3>
                  <button onClick={() => fetchOrders(patron)} style={{ fontSize: '0.78rem', color: 'var(--primary-gold)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <i className="fas fa-sync-alt"></i> Refresh
                  </button>
                </div>

                {loading ? (
                  <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}><i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem' }}></i></div>
                ) : orders.length === 0 ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🪷</div>
                    <h4 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 8px' }}>No Orders Yet</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Start your divine collection today.</p>
                    <Link href="/shop" className="btn-gold" style={{ display: 'inline-flex', marginTop: '16px', padding: '10px 28px' }}>Browse Idols</Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {orders.map(order => (
                      <div key={order.id} style={{ borderBottom: '1px solid var(--primary-gold-border)' }}>
                        {/* Order Header */}
                        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'var(--bg-cream)', cursor: 'pointer' }} onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                          <div>
                            <p style={{ fontWeight: '700', fontSize: '0.9rem', margin: '0 0 3px' }}>{order.order_number}</p>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>{formatPrice(order.total_amount)}</span>
                            <span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', background: STATUS_COLOR[order.order_status]?.bg || '#eee', color: STATUS_COLOR[order.order_status]?.color || '#666' }}>{order.order_status}</span>
                            <i className={`fas fa-chevron-${expandedOrder === order.id ? 'up' : 'down'}`} style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}></i>
                          </div>
                        </div>

                        {/* Expanded Detail */}
                        {expandedOrder === order.id && (
                          <div style={{ padding: '20px 24px' }}>
                            {/* Progress Steps */}
                            {order.order_status !== 'Cancelled' && (
                              <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                                  <div style={{ position: 'absolute', top: '14px', left: '14px', right: '14px', height: '2px', background: 'var(--primary-gold-border)', zIndex: 0 }}></div>
                                  {steps.map((step, i) => {
                                    const current = steps.indexOf(order.order_status);
                                    const done = i <= current;
                                    return (
                                      <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 1, flex: 1 }}>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: done ? 'var(--primary-gold)' : 'white', border: `2px solid ${done ? 'var(--primary-gold)' : 'var(--primary-gold-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: done ? 'white' : 'var(--text-muted)', transition: 'all 0.3s' }}>
                                          {done ? <i className="fas fa-check"></i> : i + 1}
                                        </div>
                                        <span style={{ fontSize: '0.62rem', color: done ? 'var(--primary-gold-hover)' : 'var(--text-muted)', fontWeight: done ? '600' : '400', textAlign: 'center' }}>{step}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Items */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                              {order.items?.map(item => (
                                <div key={item.id} style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '12px', background: 'var(--bg-cream)', borderRadius: '8px' }}>
                                  {item.image_path && <img src={item.image_path} alt={item.product_name} style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--primary-gold-border)', flexShrink: 0 }} />}
                                  <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: '600', fontSize: '0.88rem', margin: '0 0 3px' }}>{item.product_name}</p>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Qty: {item.quantity} × {formatPrice(item.price)}</p>
                                  </div>
                                  <p style={{ fontWeight: '700', fontSize: '0.88rem', margin: 0 }}>{formatPrice(item.quantity * item.price)}</p>
                                </div>
                              ))}
                            </div>

                            {/* Info grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.82rem', marginBottom: '16px' }}>
                              <div style={{ padding: '14px', background: 'var(--bg-cream)', borderRadius: '8px' }}>
                                <p style={{ fontWeight: '600', margin: '0 0 6px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Delivery Address</p>
                                <p style={{ margin: 0, lineHeight: '1.5', color: 'var(--text-dark)' }}>{order.shipping_address}</p>
                                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>📞 {order.customer_phone}</p>
                              </div>
                              <div style={{ padding: '14px', background: 'var(--bg-cream)', borderRadius: '8px' }}>
                                <p style={{ fontWeight: '600', margin: '0 0 6px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Payment</p>
                                <p style={{ margin: 0 }}>Method: <strong>{(order.payment_method || '').toUpperCase()}</strong></p>
                                <p style={{ margin: '4px 0 0' }}>Status: <strong style={{ color: order.payment_status === 'Paid' ? '#2E7D32' : '#E67E22' }}>{order.payment_status}</strong></p>
                                {order.tracking_number && <p style={{ margin: '4px 0 0' }}>Tracking: <strong>{order.tracking_number}</strong></p>}
                              </div>
                            </div>

                            {/* Actions */}
                            {isUpdatable(order.order_status) && (
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => handleOpenEdit(order)} className="btn-outline-gold" style={{ padding: '9px 18px', fontSize: '0.8rem' }}>
                                  <i className="fas fa-edit"></i> Edit Address
                                </button>
                                <button onClick={() => setCancelId(order.id)} style={{ padding: '9px 18px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--danger)', borderRadius: '6px', color: 'var(--danger)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <i className="fas fa-times"></i> Cancel Order
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══════ WISHLIST ══════ */}
            {section === 'wishlist' && (
              <div style={{ background: 'white', borderRadius: '10px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--primary-gold-border)' }}>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', margin: 0 }}>❤️ My Wishlist</h3>
                </div>
                {wishlist.length === 0 ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🤍</div>
                    <h4 style={{ fontFamily: 'var(--font-heading)', margin: '0 0 8px' }}>Your Wishlist is Empty</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Heart any idol from the shop to save it here.</p>
                    <Link href="/shop" className="btn-gold" style={{ display: 'inline-flex', marginTop: '16px', padding: '10px 28px' }}>Explore Idols</Link>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px', padding: '24px' }}>
                    {wishlist.map(item => (
                      <Link key={item.id} href={`/product/${item.slug}`} style={{ display: 'block', borderRadius: '10px', border: '1px solid var(--primary-gold-border)', overflow: 'hidden', transition: 'box-shadow 0.2s', textDecoration: 'none' }}>
                        <div style={{ height: '160px', overflow: 'hidden', background: 'var(--bg-cream)' }}>
                          <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '12px' }}>
                          <p style={{ fontWeight: '600', fontSize: '0.85rem', margin: '0 0 4px', lineHeight: '1.3' }}>{item.name}</p>
                          <p style={{ fontSize: '0.82rem', color: 'var(--primary-gold-hover)', fontWeight: '700', margin: 0 }}>{formatPrice(item.price)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══════ PROFILE ══════ */}
            {section === 'profile' && (
              <div style={{ background: 'white', borderRadius: '10px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)', padding: '28px 32px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '24px', paddingBottom: '12px', borderBottom: '1px solid var(--primary-gold-border)' }}>👤 My Profile</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '480px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Display Name</label>
                    <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Your Name" style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid var(--primary-gold-border)', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Contact Identifier</label>
                    <input type="text" value={patron} readOnly style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid var(--primary-gold-border)', fontSize: '0.9rem', background: '#f5f5f5', color: 'var(--text-muted)', boxSizing: 'border-box' }} />
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>This is your order lookup identifier. Contact support to change it.</p>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Phone Number</label>
                    <input type="tel" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} placeholder="+91 98765 43210" style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid var(--primary-gold-border)', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ paddingTop: '8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button className="btn-gold" onClick={handleSaveProfile} style={{ padding: '11px 28px' }}>
                      <i className="fas fa-save"></i> Save Profile
                    </button>
                    {profileSaved && <span style={{ color: 'var(--success)', fontSize: '0.82rem', fontWeight: '600' }}>✅ Saved!</span>}
                  </div>
                  <div style={{ marginTop: '8px', padding: '14px', background: '#fff8f0', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    <i className="fas fa-info-circle" style={{ color: 'var(--primary-gold)', marginRight: '6px' }}></i>
                    Profile information is stored locally in your browser. It helps personalize your experience and pre-fills support forms.
                  </div>
                </div>
              </div>
            )}

            {/* ══════ SUPPORT ══════ */}
            {section === 'support' && (
              <div style={{ background: 'white', borderRadius: '10px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)', padding: '28px 32px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '6px' }}>🎧 Customer Support</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--primary-gold-border)' }}>
                  Our team responds within 24 hours on business days.
                </p>

                {/* Contact cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
                  {[
                    { icon: 'fa-whatsapp', label: 'WhatsApp', value: '+91 72758 19354', href: 'https://wa.me/917275819354', color: '#25D366' },
                    { icon: 'fa-envelope', label: 'Email Support', value: 'support@anantarts.in', href: 'mailto:support@anantarts.in', color: 'var(--primary-gold-hover)' },
                    { icon: 'fa-box', label: 'Order Issues', value: 'orders@anantarts.in', href: 'mailto:orders@anantarts.in', color: '#1565C0' },
                  ].map(c => (
                    <a key={c.label} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '18px 12px', borderRadius: '10px', border: '1px solid var(--primary-gold-border)', textDecoration: 'none', transition: 'box-shadow 0.2s', textAlign: 'center' }}>
                      <i className={`fab ${c.icon}`} style={{ fontSize: '1.5rem', color: c.color }}></i>
                      <span style={{ fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{c.label}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dark)', fontWeight: '500' }}>{c.value}</span>
                    </a>
                  ))}
                </div>

                {/* Support form */}
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', marginBottom: '16px' }}>Send a Message</h4>
                {supportStatus && (
                  <div style={{ padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.84rem', background: supportStatus.startsWith('✅') ? 'rgba(46,125,50,0.08)' : 'rgba(198,40,40,0.08)', color: supportStatus.startsWith('✅') ? 'var(--success)' : 'var(--danger)', border: `1px solid ${supportStatus.startsWith('✅') ? 'rgba(46,125,50,0.2)' : 'rgba(198,40,40,0.2)'}` }}>
                    {supportStatus}
                  </div>
                )}
                <form onSubmit={handleSupportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '520px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Subject</label>
                    <select value={supportSubject} onChange={e => setSupportSubject(e.target.value)} required style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid var(--primary-gold-border)', fontSize: '0.88rem', background: 'white', boxSizing: 'border-box' }}>
                      <option value="">— Select a topic —</option>
                      <option>Order Status Inquiry</option>
                      <option>Damaged Product / Refund Request</option>
                      <option>Shipment Not Received</option>
                      <option>Change Delivery Address</option>
                      <option>Cancel Order Request</option>
                      <option>Product Question</option>
                      <option>Corporate / Bulk Order</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Message</label>
                    <textarea rows="4" required value={supportMsg} onChange={e => setSupportMsg(e.target.value)} placeholder="Describe your issue or question in detail..." style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1.5px solid var(--primary-gold-border)', fontSize: '0.88rem', fontFamily: 'var(--font-body)', resize: 'vertical', boxSizing: 'border-box' }} />
                  </div>
                  <button type="submit" className="btn-gold" style={{ padding: '12px 28px', width: 'fit-content' }} disabled={supportLoading}>
                    {supportLoading ? <><i className="fas fa-spinner fa-spin"></i> Sending...</> : <><i className="fas fa-paper-plane"></i> Send Message</>}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ──── CANCEL MODAL ──── */}
      {cancelId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '36px 32px', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', margin: '0 0 12px' }}>Cancel This Order?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6', margin: '0 0 28px' }}>This action cannot be undone. If you paid online, a refund will be processed within 7–10 business days.</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setCancelId(null)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', background: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem' }}>Keep Order</button>
              <button onClick={handleCancel} disabled={updating} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', background: 'var(--danger)', color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem' }}>
                {updating ? 'Processing...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── EDIT ADDRESS MODAL ──── */}
      {editOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '460px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0 }}>Edit Delivery Details</h3>
              <button onClick={() => setEditOrder(null)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Recipient Name', key: 'name', type: 'text' },
                { label: 'Phone Number',   key: 'phone', type: 'tel' },
                { label: 'Street Address', key: 'address', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>{f.label}</label>
                  <input type={f.type} required value={editFields[f.key] || ''} onChange={e => setEditFields(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1.5px solid var(--primary-gold-border)', fontSize: '0.88rem', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {[{ label: 'City', key: 'city' }, { label: 'State', key: 'state' }, { label: 'Pincode', key: 'zip' }].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase' }}>{f.label}</label>
                    <input type="text" required value={editFields[f.key] || ''} onChange={e => setEditFields(p => ({ ...p, [f.key]: e.target.value }))} style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1.5px solid var(--primary-gold-border)', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
              {editError && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', margin: 0 }}>{editError}</p>}
              <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
                <button type="button" onClick={() => setEditOrder(null)} style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', background: 'white', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                <button type="submit" className="btn-gold" style={{ flex: 1, padding: '11px', justifyContent: 'center' }} disabled={updating}>
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
