'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addOrUpdateCoupon, deleteCoupon } from '@/app/actions';
import { formatPrice } from '@/lib/utils';

export default function CouponManager({ coupons = [] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);

  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage', 'flat', 'free_shipping'
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('0');
  const [usageLimit, setUsageLimit] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 5000);
  };

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
    
    // Format dates for datetime-local input fields (YYYY-MM-DDTHH:MM)
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
      startTransition(() => {
        router.refresh();
      });
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
      startTransition(() => {
        router.refresh();
      });
    } else {
      showAlert('danger', res.message);
    }
  };

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

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', margin: 0 }}>Coupon Codes</h1>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage percentage discounts, flat deals, and free shipping promos</span>
        </div>
        <button onClick={handleOpenCreate} className="btn-gold" style={{ fontSize: '0.8rem', padding: '10px 16px' }}>
          <i className="fas fa-plus" style={{ marginRight: '6px' }}></i> Create Coupon
        </button>
      </div>

      {/* Table grid */}
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
                  No coupons found. Click "Create Coupon" to add one!
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

      {/* Add/Edit Modal */}
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
    </div>
  );
}
