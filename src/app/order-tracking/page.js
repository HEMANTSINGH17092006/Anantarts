'use client';
import { useState, useEffect, Suspense } from 'react';
import { trackOrderAction } from '@/app/actions';
import { formatPrice } from '@/lib/utils';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function OrderTrackingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  const urlOrder = searchParams.get('order') || searchParams.get('id');
  const urlPhone = searchParams.get('phone');

  const trackOrder = async (num, ph) => {
    if (!num?.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    setItems([]);

    const result = await trackOrderAction(num.trim(), ph?.trim() || '');

    if (!result.success) {
      setError(result.message);
    } else {
      setOrder(result.order);
      setItems(result.order?.order_items || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (urlOrder) {
      setOrderNumber(urlOrder);
      if (urlPhone) setPhone(urlPhone);
      trackOrder(urlOrder, urlPhone || '');
    }
  }, [urlOrder, urlPhone]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    trackOrder(orderNumber, phone);
  };

  const statusSteps = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];
  const getStepIndex = (status) => statusSteps.indexOf(status);
  const currentStepIdx = order ? getStepIndex(order.order_status) : -1;

  return (
    <>
      {/* Search bar */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)', marginBottom: '32px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Order ID (e.g. ANT-20260720-XXXX)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
              style={{ flex: '2 1 200px', padding: '12px 16px', borderRadius: '4px', border: '1px solid var(--primary-gold-border)', fontSize: '0.85rem' }}
            />
            <input
              type="tel"
              placeholder="Registered phone number (optional if logged in)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ flex: '1 1 160px', padding: '12px 16px', borderRadius: '4px', border: '1px solid var(--primary-gold-border)', fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn-gold" style={{ padding: '12px 24px', whiteSpace: 'nowrap' }} disabled={loading}>
              {loading ? 'Tracking...' : 'Track Order'}
            </button>
          </div>
        </form>
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.82rem', margin: '12px 0 0 0' }}>{error}</p>}
      </div>

      {/* Tracking Details */}
      {order && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Steps Timeline Card */}
          <div style={{ background: 'white', padding: '32px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '24px', textAlign: 'center' }}>
              Order Tracker
            </h3>

            {/* Progress Line */}
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '12px' }}>
              <div style={{
                position: 'absolute',
                top: '15px',
                left: '5%',
                right: '5%',
                height: '4px',
                background: 'var(--bg-cream-dark)',
                zIndex: 1
              }}>
                <div style={{
                  height: '100%',
                  width: `${currentStepIdx >= 0 ? (currentStepIdx / (statusSteps.length - 1)) * 100 : 0}%`,
                  background: 'var(--primary-gold)',
                  transition: 'width 0.4s ease'
                }}></div>
              </div>

              {statusSteps.map((step, idx) => {
                const isActive = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                return (
                  <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative', width: '18%' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isCurrent ? 'var(--primary-gold)' : isActive ? 'var(--text-dark)' : 'white',
                      border: '2px solid var(--primary-gold)',
                      color: isActive ? 'white' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      boxShadow: isCurrent ? 'var(--shadow-gold)' : 'none'
                    }}>
                      {isActive ? '✓' : idx + 1}
                    </div>
                    <span style={{
                      marginTop: '8px',
                      fontSize: '0.72rem',
                      fontWeight: isActive ? '600' : '400',
                      color: isActive ? 'var(--text-dark)' : 'var(--text-muted)'
                    }}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Receipt Summary Card */}
          <div style={{ background: 'white', padding: '32px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ borderBottom: '1px solid var(--primary-gold-border)', paddingBottom: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Receipt: {order.order_number}</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Placed on: {new Date(order.created_at).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ text_align: 'right' }}>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  backgroundColor: order.order_status === 'Delivered' ? 'var(--success)' : 'var(--primary-gold-light)',
                  color: order.order_status === 'Delivered' ? 'white' : 'var(--primary-gold-hover)',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  {order.order_status}
                </span>
              </div>
            </div>

            {/* Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>{item.product_name} <strong>x{item.quantity}</strong></span>
                  <span style={{ fontWeight: '600' }}>{formatPrice(item.total_price)}</span>
                </div>
              ))}
            </div>

            {/* Shipping and Delivery summary */}
            <div style={{ borderTop: '1px solid var(--primary-gold-border)', paddingTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', fontSize: '0.8rem' }}>
              <div>
                <strong style={{ display: 'block', marginBottom: '6px' }}>Delivery Address</strong>
                <span style={{ color: 'var(--text-muted)', lineHeight: '1.5' }}>{order.shipping_address}</span>
              </div>
              <div>
                <strong style={{ display: 'block', marginBottom: '6px' }}>Shipment Details</strong>
                <span style={{ color: 'var(--text-muted)' }}>
                  Payment Mode: {order.payment_method.toUpperCase()}<br />
                  Payment Status: {order.payment_status}<br />
                  {order.tracking_number && (
                    <>
                      Tracking No: <strong>{order.tracking_number}</strong>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function OrderTrackingPage() {
  return (
    <div style={{ background: 'var(--bg-cream)', padding: '4rem 0' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 2rem' }}>
        
        <div className="section-heading" style={{ marginBottom: '2.5rem' }}>
          <h2>Track Your Shipment</h2>
          <div className="gold-line"></div>
          <p>Verify the craft and delivery status of your divine electroplated sculpture.</p>
        </div>

        <Suspense fallback={
          <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
            <p style={{ color: 'var(--text-muted)' }}>Loading tracking panel...</p>
          </div>
        }>
          <OrderTrackingContent />
        </Suspense>

      </div>
    </div>
  );
}
