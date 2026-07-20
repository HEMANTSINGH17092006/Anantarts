'use client';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

export default function TrackingTimeline({ order, trackingEvents = [] }) {
  if (!order) return null;

  const ALL_STEPS = [
    { key: 'Pending', label: 'Order Placed' },
    { key: 'Payment Confirmed', label: 'Payment Verified' },
    { key: 'Order Confirmed', label: 'Order Confirmed' },
    { key: 'Preparing Shipment', label: 'Preparing Shipment' },
    { key: 'Packed', label: 'Packed & Boxed' },
    { key: 'Shipped', label: 'Shipped / In Transit' },
    { key: 'Out For Delivery', label: 'Out For Delivery' },
    { key: 'Delivered', label: 'Delivered' }
  ];

  const currentStatus = order.order_status || 'Pending';
  const isCancelled = currentStatus === 'Cancelled' || currentStatus === 'Refunded';

  // Determine current active step index
  let activeIndex = ALL_STEPS.findIndex(s => s.key.toLowerCase() === currentStatus.toLowerCase());
  if (activeIndex === -1) {
    if (currentStatus === 'Confirmed') activeIndex = 2;
    else activeIndex = 0;
  }

  const items = order.order_items || order.items || [];
  const courierName = order.courier_name || 'Express Logistics Partner';
  const trackingNumber = order.tracking_number;
  const estimatedDelivery = order.estimated_delivery || '3-7 Business Days';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Banner Card: Expected Delivery Date & Courier Details */}
      <div style={{
        background: 'linear-gradient(135deg, #111111 0%, #1A1A1A 100%)',
        color: '#FFFFFF',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid rgba(212, 175, 55, 0.4)',
        boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#D4AF37', fontWeight: '700' }}>
              Shipment Status: {isCancelled ? 'CANCELLED' : currentStatus.toUpperCase()}
            </span>
            <h2 style={{ margin: '4px 0 0 0', fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', color: '#FFF' }}>
              {isCancelled ? 'Order Cancelled' : `Expected Delivery: ${estimatedDelivery}`}
            </h2>
          </div>
          <span style={{
            background: isCancelled ? '#FFCDD2' : currentStatus === 'Delivered' ? '#E8F5E9' : 'rgba(212, 175, 55, 0.2)',
            color: isCancelled ? '#B71C1C' : currentStatus === 'Delivered' ? '#2E7D32' : '#D4AF37',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '0.8rem',
            fontWeight: '700',
            border: '1px solid rgba(212,175,55,0.3)'
          }}>
            {order.order_number}
          </span>
        </div>

        {/* Courier Meta Box */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          fontSize: '0.85rem'
        }}>
          <div>
            <span style={{ color: 'rgba(255,255,255,0.6)', display: 'block', fontSize: '0.75rem' }}>Courier Partner</span>
            <strong style={{ color: '#FFF' }}>{courierName}</strong>
          </div>
          <div>
            <span style={{ color: 'rgba(255,255,255,0.6)', display: 'block', fontSize: '0.75rem' }}>Tracking / AWB No</span>
            <strong style={{ color: '#D4AF37' }}>{trackingNumber || 'Assigned upon dispatch'}</strong>
          </div>
          <div>
            <span style={{ color: 'rgba(255,255,255,0.6)', display: 'block', fontSize: '0.75rem' }}>Payment Status</span>
            <strong style={{ color: order.payment_status === 'Captured' || order.payment_status === 'Paid' ? '#81C784' : '#FFB74D' }}>
              {order.payment_status ? order.payment_status.toUpperCase() : 'PENDING'}
            </strong>
          </div>
        </div>
      </div>

      {/* Stepper Timeline Card (Amazon/Flipkart Style) */}
      {!isCancelled && (
        <div style={{
          background: '#FFFFFF',
          padding: '28px 24px',
          borderRadius: '12px',
          border: '1px solid var(--primary-gold-border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ margin: '0 0 24px 0', fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: '#333' }}>
            Shipment Progress
          </h3>

          {/* Desktop/Tablet Horizontal Stepper */}
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '0 10px' }} className="desktop-stepper">
            {/* Background Line */}
            <div style={{
              position: 'absolute',
              top: '16px',
              left: '30px',
              right: '30px',
              height: '4px',
              background: '#EAEAEA',
              zIndex: 1
            }}>
              <div style={{
                height: '100%',
                width: `${(activeIndex / (ALL_STEPS.length - 1)) * 100}%`,
                background: 'var(--primary-gold, #D4AF37)',
                transition: 'width 0.4s ease'
              }}></div>
            </div>

            {ALL_STEPS.map((step, idx) => {
              const isCompleted = idx < activeIndex;
              const isCurrent = idx === activeIndex;

              return (
                <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative', flex: 1, textAlign: 'center' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: isCurrent ? 'var(--primary-gold, #D4AF37)' : isCompleted ? '#2E7D32' : '#FFFFFF',
                    border: isCurrent ? '3px solid #FFF' : isCompleted ? '2px solid #2E7D32' : '2px solid #DDD',
                    color: isCurrent || isCompleted ? '#FFFFFF' : '#999',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    boxShadow: isCurrent ? '0 0 12px rgba(212, 175, 55, 0.6)' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    {isCompleted ? '✓' : isCurrent ? '●' : idx + 1}
                  </div>
                  <span style={{
                    marginTop: '8px',
                    fontSize: '0.72rem',
                    fontWeight: isCurrent ? '700' : isCompleted ? '600' : '400',
                    color: isCurrent ? 'var(--primary-gold-hover, #B59021)' : isCompleted ? '#333' : '#999',
                    lineHeight: '1.2'
                  }}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Activity Logs (Amazon Style Events) */}
      {trackingEvents.length > 0 && (
        <div style={{
          background: '#FFFFFF',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid var(--primary-gold-border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: '#333' }}>
            Activity Log &amp; Transit History
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '24px' }}>
            <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: 'var(--primary-gold-border)' }}></div>

            {[...trackingEvents].reverse().map((evt, idx) => (
              <div key={evt.id || idx} style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '-23px',
                  top: '4px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: idx === 0 ? 'var(--primary-gold, #D4AF37)' : '#AAA',
                  border: '2px solid white'
                }}></div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <strong style={{ fontSize: '0.9rem', color: '#333' }}>{evt.title || evt.status}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#888' }}>
                      {new Date(evt.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {evt.location && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--primary-gold)', fontWeight: '600', marginTop: '2px' }}>
                      📍 {evt.location}
                    </div>
                  )}
                  {evt.description && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#666', lineHeight: '1.4' }}>
                      {evt.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Package Summary Card */}
      <div style={{
        background: '#FFFFFF',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid var(--primary-gold-border)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: '#333' }}>
          Items in this Package
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F0F0F0', fontSize: '0.88rem' }}>
              <div>
                <strong style={{ color: '#333' }}>{item.product_name}</strong>
                <span style={{ color: '#777', marginLeft: '8px' }}>x{item.quantity}</span>
              </div>
              <span style={{ fontWeight: '600', color: '#333' }}>{formatPrice(item.total_price || (item.price * item.quantity))}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.82rem', background: '#FAF9F5', padding: '16px', borderRadius: '8px', border: '1px solid #EAE3D2' }}>
          <div>
            <strong style={{ display: 'block', marginBottom: '4px', color: '#333' }}>Delivery Recipient</strong>
            <span style={{ color: '#666' }}>{order.customer_name}<br />{order.customer_phone}<br />{order.customer_email}</span>
          </div>
          <div>
            <strong style={{ display: 'block', marginBottom: '4px', color: '#333' }}>Shipping Address</strong>
            <span style={{ color: '#666', lineHeight: '1.4' }}>{order.shipping_address}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
