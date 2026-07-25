'use client';

import { useState } from 'react';
import { cancelOrderCustomerAction } from '@/app/actions';
import { useRouter } from 'next/navigation';

const REASON_OPTIONS = [
  'Ordered by mistake',
  'Found a better price',
  'Delivery taking too long',
  'Changed my mind',
  'Ordered wrong item',
  'Other'
];

export const ELIGIBLE_CANCELLATION_STATUSES = [
  'Pending Payment',
  'Pending',
  'Payment Confirmed',
  'Order Confirmed',
  'Confirmed',
  'Processing',
  'Preparing for Dispatch',
  'Preparing',
  'Order Received'
];

export const DISALLOWED_CANCELLATION_STATUSES = [
  'Packed',
  'Picked Up',
  'Shipped',
  'In Transit',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Returned',
  'Refunded'
];

export function isOrderEligibleForCancellation(status) {
  if (!status) return true;
  const lower = status.trim().toLowerCase();
  
  // If it's in disallowed statuses, strictly hide/disable
  const isDisallowed = DISALLOWED_CANCELLATION_STATUSES.some(s => s.toLowerCase() === lower);
  if (isDisallowed) return false;

  // Check if it's eligible
  return ELIGIBLE_CANCELLATION_STATUSES.some(s => s.toLowerCase() === lower);
}

export default function CancelOrderModal({ order, onCancelled }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Confirmation, 2: Reason Selection
  const [selectedReason, setSelectedReason] = useState(REASON_OPTIONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!order || !isOrderEligibleForCancellation(order.order_status)) {
    return null;
  }

  const handleOpen = () => {
    setIsOpen(true);
    setStep(1);
    setError('');
    setSelectedReason(REASON_OPTIONS[0]);
    setCustomReason('');
  };

  const handleClose = () => {
    if (loading) return;
    setIsOpen(false);
  };

  const handleConfirmStep1 = () => {
    setStep(2);
  };

  const handleSubmitCancellation = async (e) => {
    e.preventDefault();
    if (selectedReason === 'Other' && !customReason.trim()) {
      setError('Please enter your reason for cancellation.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await cancelOrderCustomerAction({
        orderId: order.id,
        orderNumber: order.order_number,
        reason: selectedReason,
        customReason: customReason.trim()
      });

      if (!res.success) {
        setError(res.message || 'Failed to cancel order.');
        setLoading(false);
        return;
      }

      setIsOpen(false);
      if (onCancelled) {
        onCancelled();
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err.message || 'An error occurred while cancelling your order.');
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        style={{
          background: '#FFF0F0',
          color: '#C62828',
          border: '1px solid #FFCDD2',
          padding: '8px 18px',
          borderRadius: '6px',
          fontSize: '0.85rem',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'all 0.2s ease'
        }}
      >
        <i className="fas fa-times-circle"></i> Cancel Order
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFFFF',
            maxWidth: '480px',
            width: '100%',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            border: '1px solid var(--primary-gold-border, #D4AF37)',
            animation: 'fadeIn 0.2s ease'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #EEE', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-heading, serif)', fontSize: '1.25rem', color: '#111' }}>
                {step === 1 ? 'Cancel Order?' : 'Select Cancellation Reason'}
              </h3>
              <button
                onClick={handleClose}
                disabled={loading}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#888' }}
              >
                &times;
              </button>
            </div>

            {error && (
              <div style={{ background: '#FFEBEE', color: '#C62828', padding: '10px 14px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '16px', border: '1px solid #FFCDD2' }}>
                ⚠️ {error}
              </div>
            )}

            {/* STEP 1: CONFIRMATION POPUP */}
            {step === 1 && (
              <div>
                <p style={{ color: '#444', fontSize: '0.92rem', lineHeight: '1.5', margin: '0 0 20px 0' }}>
                  Are you sure you want to cancel this order?
                </p>
                <div style={{ background: '#FAF9F6', padding: '12px 16px', borderRadius: '8px', border: '1px solid #EAE3D2', marginBottom: '20px', fontSize: '0.82rem', color: '#666' }}>
                  <strong>Order Ref:</strong> {order.order_number || `#${order.id}`}<br />
                  <strong>Current Status:</strong> {order.order_status}
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '6px',
                      border: '1px solid #CCC',
                      background: '#FFFFFF',
                      color: '#333',
                      fontSize: '0.88rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Keep Order
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmStep1}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#C62828',
                      color: '#FFFFFF',
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Yes, Cancel Order
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: REASON SELECTION */}
            {step === 2 && (
              <form onSubmit={handleSubmitCancellation}>
                <p style={{ color: '#555', fontSize: '0.85rem', margin: '0 0 14px 0' }}>
                  Please tell us why you are cancelling your order:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  {REASON_OPTIONS.map((opt) => (
                    <label
                      key={opt}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        border: selectedReason === opt ? '1px solid #D4AF37' : '1px solid #EAEAEA',
                        background: selectedReason === opt ? 'rgba(212, 175, 55, 0.08)' : '#FFFFFF',
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                        color: '#333',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="radio"
                        name="cancellationReason"
                        value={opt}
                        checked={selectedReason === opt}
                        onChange={() => setSelectedReason(opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>

                {selectedReason === 'Other' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#444', marginBottom: '6px' }}>
                      Specify reason:
                    </label>
                    <textarea
                      rows="3"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="Please provide details for cancellation..."
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #DDD',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box',
                        outline: 'none'
                      }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={loading}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '6px',
                      border: '1px solid #DDD',
                      background: '#F5F5F5',
                      color: '#444',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      padding: '10px 22px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#C62828',
                      color: '#FFFFFF',
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {loading ? 'Cancelling Order...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
