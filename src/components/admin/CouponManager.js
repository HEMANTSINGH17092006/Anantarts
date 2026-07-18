'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addOrUpdateCoupon, deleteCoupon, addOrUpdateFlashSale, deleteFlashSale } from '@/app/actions';
import { formatPrice } from '@/lib/utils';

export default function CouponManager({ coupons = [], flashSales = [], subscribers = [] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState('Coupons');
  const marketingTabs = ['Coupons', 'Flash Sales', 'Subscribers'];

  // --- Coupon form states ---
  const [formOpen, setFormOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('0');
  const [usageLimit, setUsageLimit] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  // --- Flash Sale form states ---
  const [saleFormOpen, setSaleFormOpen] = useState(false);
  const [editSale, setEditSale] = useState(null);
  const [saleTitle, setSaleTitle] = useState('');
  const [saleDiscount, setSaleDiscount] = useState('');
  const [saleStart, setSaleStart] = useState('');
  const [saleEnd, setSaleEnd] = useState('');
  const [saleActive, setSaleActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 5000);
  };

  // === Coupon Handlers ===
  const handleOpenCreate = () => {
    setEditCoupon(null);
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('10');
    setMinOrderAmount('5000');
    setUsageLimit('100');
    setStartDate('');
    setEndDate('');
    setIsActive(true);
    setFormOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditCoupon(c);
    setCode(c.code);
    setDiscountType(c.discount_type);
    setDiscountValue(c.discount_value?.toString() || '0');
    setMinOrderAmount(c.min_order_amount?.toString() || '0');
    setUsageLimit(c.usage_limit?.toString() || '');
    
    const formatInputDate = (dString) => {
      if (!dString) return '';
      const d = new Date(dString);
      const pad = (num) => String(num).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    
    setStartDate(formatInputDate(c.start_date));
    setEndDate(formatInputDate(c.end_date));
    setIsActive(c.is_active === 1);
    setFormOpen(true);
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to delete coupon code "${title}"?`)) return;
    const res = await deleteCoupon(id);
    if (res.success) {
      showAlert('success', `Coupon code deleted successfully.`);
      startTransition(() => { router.refresh(); });
    } else {
      showAlert('danger', res.message);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!code || !discountType) return;
    setLoading(true);

    const payload = {
      id: editCoupon ? editCoupon.id : undefined,
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: parseFloat(discountValue || 0),
      min_order_amount: parseFloat(minOrderAmount || 0),
      usage_limit: usageLimit ? parseInt(usageLimit) : null,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      is_active: isActive ? 1 : 0
    };

    const res = await addOrUpdateCoupon(payload);
    setLoading(false);

    if (res.success) {
      setFormOpen(false);
      showAlert('success', `Coupon "${code}" successfully ${editCoupon ? 'updated' : 'created'}!`);
      startTransition(() => { router.refresh(); });
    } else {
      showAlert('danger', res.message);
    }
  };

  // === Flash Sale Handlers ===
  const handleOpenCreateSale = () => {
    setEditSale(null);
    setSaleTitle('');
    setSaleDiscount('15');
    setSaleStart('');
    setSaleEnd('');
    setSaleActive(true);
    setSaleFormOpen(true);
  };

  const handleOpenEditSale = (s) => {
    setEditSale(s);
    setSaleTitle(s.title);
    setSaleDiscount(s.discount_percentage?.toString() || '');
    const fmtDate = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      const pad = (n) => String(n).padStart(2, '0');
      return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    };
    setSaleStart(fmtDate(s.start_date));
    setSaleEnd(fmtDate(s.end_date));
    setSaleActive(s.is_active === 1);
    setSaleFormOpen(true);
  };

  const handleDeleteSale = async (id, title) => {
    if (!confirm(`Delete flash sale "${title}"?`)) return;
    const res = await deleteFlashSale(id);
    if (res.success) {
      showAlert('success', 'Flash sale deleted.');
      startTransition(() => { router.refresh(); });
    } else {
      showAlert('danger', res.message);
    }
  };

  const handleSaleFormSubmit = async (e) => {
    e.preventDefault();
    if (!saleTitle) return;
    setLoading(true);

    const payload = {
      id: editSale ? editSale.id : undefined,
      title: saleTitle,
      discount_percentage: parseFloat(saleDiscount || 0),
      start_date: saleStart ? new Date(saleStart).toISOString() : null,
      end_date: saleEnd ? new Date(saleEnd).toISOString() : null,
      is_active: saleActive ? 1 : 0
    };

    const res = await addOrUpdateFlashSale(payload);
    setLoading(false);

    if (res.success) {
      setSaleFormOpen(false);
      showAlert('success', `Flash sale "${saleTitle}" ${editSale ? 'updated' : 'created'}!`);
      startTransition(() => { router.refresh(); });
    } else {
      showAlert('danger', res.message);
    }
  };

  // === Subscribers CSV Export ===
  const handleExportSubscribers = () => {
    const headers = ['Email', 'Subscribed Date'];
    const rows = subscribers.map(s => [
      s.email,
      new Date(s.subscribed_at || s.created_at).toLocaleDateString('en-IN')
    ]);
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `anant_arts_subscribers_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabStyle = (tab) => ({
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
  });

  return (
    <div>
      {/* Alert Banner */}
      {alert.message && (
        <div style={{
          padding: '12px 20px',
          borderRadius: '4px',
          background: alert.type === 'success' ? 'rgba(46, 125, 50, 0.1)' : 'rgba(198, 40, 40, 0.1)',
          border: `1px solid ${alert.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          color: alert.type === 'success' ? 'var(--success)' : 'var(--danger)',
          marginBottom: '20px',
          fontSize: '0.85rem'
        }}>
          {alert.message}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', margin: 0 }}>Marketing & Coupons</h1>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage promotional coupons, flash sales events, and newsletter subscriber lists</span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--primary-gold-border)', paddingBottom: '1px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {marketingTabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={tabStyle(tab)}>
            {tab} {tab === 'Coupons' ? `(${coupons.length})` : tab === 'Flash Sales' ? `(${flashSales.length})` : `(${subscribers.length})`}
          </button>
        ))}
      </div>

      {/* ============ COUPONS TAB ============ */}
      {activeTab === 'Coupons' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={handleOpenCreate} className="btn-gold" style={{ fontSize: '0.8rem', padding: '10px 16px' }}>
              <i className="fas fa-plus" style={{ marginRight: '6px' }}></i> Create Coupon
            </button>
          </div>

          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--bg-cream-dark)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px' }}>Coupon Code</th>
                  <th style={{ padding: '12px' }}>Discount Type</th>
                  <th style={{ padding: '12px' }}>Value</th>
                  <th style={{ padding: '12px' }}>Min Order Requirement</th>
                  <th style={{ padding: '12px' }}>Usage Status</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No coupons found. Click &quot;Create Coupon&quot; to add one!
                    </td>
                  </tr>
                ) : (
                  coupons.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--bg-cream-dark)' }}>
                      <td style={{ padding: '12px', fontWeight: '700', letterSpacing: '0.5px' }}>{c.code}</td>
                      <td style={{ padding: '12px', textTransform: 'capitalize' }}>{c.discount_type.replace('_', ' ')}</td>
                      <td style={{ padding: '12px', fontWeight: '600' }}>
                        {c.discount_type === 'percentage' ? `${c.discount_value}%` : c.discount_type === 'flat' ? formatPrice(c.discount_value) : 'Free Shipping'}
                      </td>
                      <td style={{ padding: '12px' }}>{c.min_order_amount > 0 ? formatPrice(c.min_order_amount) : 'None'}</td>
                      <td style={{ padding: '12px' }}>
                        {c.times_used} / {c.usage_limit || '∞'} uses
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.68rem',
                          fontWeight: '600',
                          backgroundColor: c.is_active === 1 ? 'rgba(46,125,50,0.1)' : 'rgba(198,40,40,0.1)',
                          color: c.is_active === 1 ? 'var(--success)' : 'var(--danger)'
                        }}>
                          {c.is_active === 1 ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button onClick={() => handleOpenEdit(c)} className="header-icon" title="Edit" style={{ color: 'var(--info)' }}><i className="fas fa-edit"></i></button>
                        <button onClick={() => handleDelete(c.id, c.code)} className="header-icon" title="Delete" style={{ color: 'var(--danger)' }}><i className="far fa-trash-alt"></i></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ============ FLASH SALES TAB ============ */}
      {activeTab === 'Flash Sales' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={handleOpenCreateSale} className="btn-gold" style={{ fontSize: '0.8rem', padding: '10px 16px' }}>
              <i className="fas fa-bolt" style={{ marginRight: '6px' }}></i> Create Flash Sale
            </button>
          </div>

          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--bg-cream-dark)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px' }}>Sale Title</th>
                  <th style={{ padding: '12px' }}>Discount %</th>
                  <th style={{ padding: '12px' }}>Start Date</th>
                  <th style={{ padding: '12px' }}>End Date</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {flashSales.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No flash sales configured yet.
                    </td>
                  </tr>
                ) : (
                  flashSales.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--bg-cream-dark)' }}>
                      <td style={{ padding: '12px', fontWeight: '600' }}>{s.title}</td>
                      <td style={{ padding: '12px', fontWeight: '700', color: 'var(--primary-gold-hover)' }}>{s.discount_percentage}%</td>
                      <td style={{ padding: '12px', fontSize: '0.78rem' }}>{s.start_date ? new Date(s.start_date).toLocaleString('en-IN') : '-'}</td>
                      <td style={{ padding: '12px', fontSize: '0.78rem' }}>{s.end_date ? new Date(s.end_date).toLocaleString('en-IN') : '-'}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '12px', fontSize: '0.68rem', fontWeight: '600',
                          backgroundColor: s.is_active === 1 ? 'rgba(46,125,50,0.1)' : 'rgba(198,40,40,0.1)',
                          color: s.is_active === 1 ? 'var(--success)' : 'var(--danger)'
                        }}>
                          {s.is_active === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button onClick={() => handleOpenEditSale(s)} className="header-icon" title="Edit" style={{ color: 'var(--info)' }}><i className="fas fa-edit"></i></button>
                        <button onClick={() => handleDeleteSale(s.id, s.title)} className="header-icon" title="Delete" style={{ color: 'var(--danger)' }}><i className="far fa-trash-alt"></i></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ============ SUBSCRIBERS TAB ============ */}
      {activeTab === 'Subscribers' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={handleExportSubscribers} className="btn-outline-gold" style={{ fontSize: '0.8rem', padding: '10px 16px' }}>
              <i className="fas fa-file-export" style={{ marginRight: '6px' }}></i> Export Subscribers CSV
            </button>
          </div>

          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--bg-cream-dark)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '14px 12px' }}>#</th>
                  <th style={{ padding: '14px 12px' }}>Email Address</th>
                  <th style={{ padding: '14px 12px', textAlign: 'right' }}>Subscribed On</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      No newsletter subscribers yet.
                    </td>
                  </tr>
                ) : (
                  subscribers.map((s, idx) => (
                    <tr key={s.id || idx} style={{ borderBottom: '1px solid var(--bg-cream-dark)' }}>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td style={{ padding: '12px', fontWeight: '500' }}>{s.email}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                        {new Date(s.subscribed_at || s.created_at).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ============ COUPON MODAL ============ */}
      {formOpen && (
        <div className="admin-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="admin-modal-content" style={{ maxWidth: '480px', width: '90%', padding: '24px' }}>
            <span className="modal-close-btn" onClick={() => setFormOpen(false)}>&times;</span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '16px' }}>
              {editCoupon ? 'Edit Coupon' : 'Create Promotion Coupon'}
            </h3>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Coupon Code *</label>
                  <input type="text" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. DIWALI20" style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Discount Type *</label>
                  <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px', background: 'white' }}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Cash (₹)</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Discount Value *</label>
                  <input type="number" required value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} disabled={discountType === 'free_shipping'} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Min Order Amount (₹)</label>
                  <input type="number" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Maximum Usage Limit (uses)</label>
                <input type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="e.g. 150" style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Start Promo Date</label>
                  <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px', fontSize: '0.8rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>End Promo Date</label>
                  <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px', fontSize: '0.8rem' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="active-chk" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ accentColor: 'var(--primary-gold)' }} />
                <label htmlFor="active-chk" style={{ fontSize: '0.85rem', cursor: 'pointer' }}><strong>Active Status</strong> (Enable for customer check-out)</label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--primary-gold-border)', paddingTop: '16px' }}>
                <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--text-muted)' }}>Cancel</button>
                <button type="submit" className="btn-gold" style={{ padding: '8px 16px', fontSize: '0.8rem' }} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============ FLASH SALE MODAL ============ */}
      {saleFormOpen && (
        <div className="admin-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="admin-modal-content" style={{ maxWidth: '480px', width: '90%', padding: '24px' }}>
            <span className="modal-close-btn" onClick={() => setSaleFormOpen(false)}>&times;</span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '16px' }}>
              {editSale ? 'Edit Flash Sale' : 'Create Flash Sale'}
            </h3>

            <form onSubmit={handleSaleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Sale Title *</label>
                <input type="text" required value={saleTitle} onChange={(e) => setSaleTitle(e.target.value)} placeholder="e.g. Monsoon Mega Sale" style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Discount Percentage (%)</label>
                <input type="number" value={saleDiscount} onChange={(e) => setSaleDiscount(e.target.value)} placeholder="15" style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Start Date</label>
                  <input type="datetime-local" value={saleStart} onChange={(e) => setSaleStart(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px', fontSize: '0.8rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>End Date</label>
                  <input type="datetime-local" value={saleEnd} onChange={(e) => setSaleEnd(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px', fontSize: '0.8rem' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="sale-active-chk" checked={saleActive} onChange={(e) => setSaleActive(e.target.checked)} style={{ accentColor: 'var(--primary-gold)' }} />
                <label htmlFor="sale-active-chk" style={{ fontSize: '0.85rem', cursor: 'pointer' }}><strong>Active</strong> (Show on storefront)</label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--primary-gold-border)', paddingTop: '16px' }}>
                <button type="button" onClick={() => setSaleFormOpen(false)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--text-muted)' }}>Cancel</button>
                <button type="submit" className="btn-gold" style={{ padding: '8px 16px', fontSize: '0.8rem' }} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Flash Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

