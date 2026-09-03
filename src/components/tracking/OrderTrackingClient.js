'use client';
import { useState, useEffect, Suspense } from 'react';
import { trackOrderAction } from '@/app/actions';
import { useSearchParams } from 'next/navigation';
import TrackingTimeline from '@/components/TrackingTimeline';

function OrderTrackingInner() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [trackingEvents, setTrackingEvents] = useState([]);
  const [error, setError] = useState('');

  const urlOrder = searchParams.get('order') || searchParams.get('id');
  const urlPhone = searchParams.get('phone');

  const trackOrder = async (num, ph) => {
    if (!num?.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    setTrackingEvents([]);

    const result = await trackOrderAction(num.trim(), ph?.trim() || '');

    if (!result.success) {
      setError(result.message);
    } else {
      setOrder(result.order);
      setTrackingEvents(result.trackingEvents || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (urlOrder) {
      Promise.resolve().then(() => {
        setOrderNumber(urlOrder);
        if (urlPhone) setPhone(urlPhone);
        trackOrder(urlOrder, urlPhone || '');
      });
    }
  }, [urlOrder, urlPhone]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    trackOrder(orderNumber, phone);
  };

  return (
    <>
      {/* Search bar */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)', marginBottom: '32px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Order ID (e.g. ANT-20260720-XXXX)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
              style={{ flex: '2 1 220px', padding: '12px 16px', borderRadius: '6px', border: '1px solid var(--primary-gold-border)', fontSize: '0.9rem', outline: 'none' }}
            />
            <input
              type="tel"
              placeholder="Registered phone number (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ flex: '1 1 180px', padding: '12px 16px', borderRadius: '6px', border: '1px solid var(--primary-gold-border)', fontSize: '0.9rem', outline: 'none' }}
            />
            <button type="submit" className="btn-primary btn-md" style={{ padding: '12px 28px', whiteSpace: 'nowrap' }} disabled={loading}>
              {loading ? 'Searching...' : 'Track Order'}
            </button>
          </div>
        </form>
        {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: '12px 0 0 0', fontWeight: '500' }}>⚠️ {error}</p>}
      </div>

      {/* Tracking Details */}
      {order && (
        <TrackingTimeline order={order} trackingEvents={trackingEvents} />
      )}
    </>
  );
}

export default function OrderTrackingClient() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '8px', border: '1px solid var(--primary-gold-border)' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading tracking portal...</p>
      </div>
    }>
      <OrderTrackingInner />
    </Suspense>
  );
}
