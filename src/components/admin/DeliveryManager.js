'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addAdminOrderTrackingEventAction, getAdminOrderTrackingEventsAction } from '@/app/actions';
import { formatPrice } from '@/lib/utils';

export default function DeliveryManager({ initialOrders = [] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Form states for status update
  const [nextStatus, setNextStatus] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [trackingEvents, setTrackingEvents] = useState([]);

  const [updating, setUpdating] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const statusOptions = [
    'All', 'Pending Payment', 'Payment Confirmed', 'Order Confirmed',
    'Preparing', 'Packed', 'Shipped', 'Out For Delivery',
    'Delivered', 'Cancelled', 'Returned', 'Refunded'
  ];

  // 4 Dashboard Cards Calculations
  const pendingCount = initialOrders.filter(o => o.order_status === 'Pending' || o.order_status === 'Pending Payment').length;
  const processingCount = initialOrders.filter(o => ['Payment Confirmed', 'Order Confirmed', 'Preparing', 'Packed', 'Confirmed'].includes(o.order_status)).length;
  const shippedCount = initialOrders.filter(o => ['Shipped', 'Out For Delivery'].includes(o.order_status)).length;
  const deliveredCount = initialOrders.filter(o => o.order_status === 'Delivered').length;

  const filteredOrders = initialOrders.filter(o => {
    const q = search.toLowerCase();
    const matchesSearch = (o.order_number || '').toLowerCase().includes(q) ||
                          (o.customer_name || '').toLowerCase().includes(q) ||
                          (o.customer_phone || '').toLowerCase().includes(q) ||
                          (o.tracking_number || '').toLowerCase().includes(q);
    const matchesTab = activeTab === 'All' || o.order_status === activeTab;
    return matchesSearch && matchesTab;
  });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 5000);
  };

  const handleOpenDetail = async (o) => {
    setSelectedOrder(o);
    setNextStatus(o.order_status || 'Preparing');
    setCourierName(o.courier_name || '');
    setTrackingNumber(o.tracking_number || '');
    setEstimatedDelivery(o.estimated_delivery || '');
    setEventTitle(`Order ${o.order_status || 'Preparing'}`);
    setEventDescription('');
    setEventLocation('');
    setTrackingEvents([]);

    const res = await getAdminOrderTrackingEventsAction(o.id);
    if (res.success) {
      setTrackingEvents(res.events || []);
    }
  };

  const handleStatusUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdating(true);

    const res = await addAdminOrderTrackingEventAction({
      orderId: selectedOrder.id,
      status: nextStatus,
      courierName,
      trackingNumber,
      estimatedDelivery,
      title: eventTitle || `Order ${nextStatus}`,
      description: eventDescription || `Status updated to ${nextStatus}.`,
      location: eventLocation
    });

    setUpdating(false);

    if (res.success) {
      showAlert('success', `Delivery update posted & Email/WhatsApp sent to ${selectedOrder.customer_name}!`);
      const updatedObj = {
        ...selectedOrder,
        order_status: nextStatus,
        courier_name: courierName,
        tracking_number: trackingNumber,
        estimated_delivery: estimatedDelivery
      };
      setSelectedOrder(updatedObj);
      if (res.event) {
        setTrackingEvents(prev => [...prev, res.event]);
      }
      setEventTitle('');
      setEventDescription('');
      setEventLocation('');
      startTransition(() => { router.refresh(); });
    } else {
      showAlert('danger', res.message || 'Failed to update delivery status.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.75rem', margin: 0, color: '#111' }}>
            📦 Delivery &amp; Shipment Management
          </h1>
          <span style={{ fontSize: '0.85rem', color: '#666' }}>
            Post real-time courier tracking events, update delivery status, and trigger automatic Email/WhatsApp alerts
          </span>
        </div>
      </div>

      {/* Alert Banner */}
      {alert.message && (
        <div style={{
          padding: '12px 20px',
          borderRadius: '8px',
          background: alert.type === 'success' ? '#E8F5E9' : '#FFEBEE',
          border: `1px solid ${alert.type === 'success' ? '#2E7D32' : '#C62828'}`,
          color: alert.type === 'success' ? '#2E7D32' : '#C62828',
          fontSize: '0.88rem',
          fontWeight: '600'
        }}>
          {alert.message}
        </div>
      )}

      {/* 4 Dashboard Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #FFE082', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#E65100', fontWeight: '700' }}>Pending Orders</span>
          <strong style={{ fontSize: '1.6rem', display: 'block', color: '#E65100', marginTop: '4px' }}>{pendingCount}</strong>
          <span style={{ fontSize: '0.72rem', color: '#777', marginTop: '4px', display: 'block' }}>Awaiting payment/confirmation</span>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.4)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#B59021', fontWeight: '700' }}>Processing / Packed</span>
          <strong style={{ fontSize: '1.6rem', display: 'block', color: '#B59021', marginTop: '4px' }}>{processingCount}</strong>
          <span style={{ fontSize: '0.72rem', color: '#777', marginTop: '4px', display: 'block' }}>Being boxed at workshop</span>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #BBDEFB', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#1976D2', fontWeight: '700' }}>Shipped / In Transit</span>
          <strong style={{ fontSize: '1.6rem', display: 'block', color: '#1976D2', marginTop: '4px' }}>{shippedCount}</strong>
          <span style={{ fontSize: '0.72rem', color: '#777', marginTop: '4px', display: 'block' }}>Handed to courier partner</span>
        </div>

        <div style={{ background: '#FFFFFF', padding: '20px', borderRadius: '12px', border: '1px solid #C8E6C9', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#2E7D32', fontWeight: '700' }}>Delivered Orders</span>
          <strong style={{ fontSize: '1.6rem', display: 'block', color: '#2E7D32', marginTop: '4px' }}>{deliveredCount}</strong>
          <span style={{ fontSize: '0.72rem', color: '#777', marginTop: '4px', display: 'block' }}>Successfully handed to customer</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.3)', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Status Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {statusOptions.map(opt => (
            <button
              key={opt}
              onClick={() => setActiveTab(opt)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === opt ? '#D4AF37' : '#F5F5F5',
                color: activeTab === opt ? '#FFFFFF' : '#333333',
                fontSize: '0.78rem',
                fontWeight: activeTab === opt ? '700' : '400',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search order ref, customer, AWB..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid rgba(212, 175, 55, 0.4)', fontSize: '0.85rem', width: '240px', outline: 'none' }}
        />
      </div>

      {/* Orders Delivery Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F0F0F0', color: '#888' }}>
              <th style={{ padding: '14px 16px' }}>Order Ref</th>
              <th style={{ padding: '14px 16px' }}>Recipient &amp; Phone</th>
              <th style={{ padding: '14px 16px' }}>Shipping Address</th>
              <th style={{ padding: '14px 16px' }}>Courier &amp; AWB</th>
              <th style={{ padding: '14px 16px' }}>Expected Delivery</th>
              <th style={{ padding: '14px 16px' }}>Delivery Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Update Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
                  No orders found under this delivery status.
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => {
                const status = o.order_status || 'Pending';
                const isDelivered = status === 'Delivered';
                const isShipped = status === 'Shipped' || status === 'Out For Delivery';
                const isCancelled = status === 'Cancelled' || status === 'Refunded';

                return (
                  <tr key={o.id} style={{ borderBottom: '1px solid #F5F5F5' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: '#111' }}>
                      {o.order_number}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <strong style={{ display: 'block', color: '#333' }}>{o.customer_name}</strong>
                      <span style={{ color: '#777', fontSize: '0.75rem' }}>{o.customer_phone}</span>
                    </td>
                    <td style={{ padding: '14px 16px', maxWidth: '220px', color: '#666', fontSize: '0.78rem', lineHeight: '1.3' }}>
                      {o.shipping_address}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <strong style={{ display: 'block', color: '#333' }}>{o.courier_name || 'Unassigned'}</strong>
                      <span style={{ color: '#D4AF37', fontSize: '0.75rem', fontWeight: '700' }}>{o.tracking_number || 'No AWB yet'}</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#555', fontWeight: '600' }}>
                      {o.estimated_delivery || 'Not set'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        background: isDelivered ? '#E8F5E9' : isShipped ? '#E3F2FD' : isCancelled ? '#FFEBEE' : '#FFF8E1',
                        color: isDelivered ? '#2E7D32' : isShipped ? '#1976D2' : isCancelled ? '#C62828' : '#B59021',
                        border: `1px solid ${isDelivered ? '#C8E6C9' : isShipped ? '#BBDEFB' : isCancelled ? '#FFCDD2' : '#FFE082'}`
                      }}>
                        {status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button onClick={() => handleOpenDetail(o)} className="btn-gold" style={{ padding: '6px 14px', fontSize: '0.78rem', borderRadius: '6px' }}>
                        Manage Tracking <i className="fas fa-truck-moving" style={{ marginLeft: '4px' }}></i>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Status & Tracking Update Modal */}
      {selectedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#FFFFFF', maxWidth: '650px', width: '92%', borderRadius: '12px', padding: '28px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(212, 175, 55, 0.4)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #EEE', paddingBottom: '12px' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", margin: 0, fontSize: '1.25rem', color: '#111' }}>
                Delivery Control: Order #{selectedOrder.order_number}
              </h3>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888' }}>&times;</button>
            </div>

            {/* Customer & Address Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8rem', background: '#FAF8F5', padding: '14px', borderRadius: '8px', border: '1px solid #EAE3D2', marginBottom: '16px' }}>
              <div>
                <strong>Customer Recipient:</strong><br />
                Name: {selectedOrder.customer_name}<br />
                Phone: {selectedOrder.customer_phone}<br />
                Email: {selectedOrder.customer_email || 'N/A'}
              </div>
              <div>
                <strong>Shipping Destination:</strong><br />
                {selectedOrder.shipping_address}
              </div>
            </div>

            {/* Delivery Update Form */}
            <form onSubmit={handleStatusUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#D4AF37' }}>📦 Post Live Status Update</h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px' }}>Delivery Status</label>
                  <select value={nextStatus} onChange={(e) => { setNextStatus(e.target.value); setEventTitle(`Order ${e.target.value}`); }} style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(212, 175, 55, 0.4)', borderRadius: '6px', background: 'white', fontSize: '0.85rem' }}>
                    <option value="Pending Payment">Pending Payment</option>
                    <option value="Payment Confirmed">Payment Confirmed</option>
                    <option value="Order Confirmed">Order Confirmed</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Packed">Packed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Out For Delivery">Out For Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Returned">Returned</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px' }}>Courier Partner Name</label>
                  <input type="text" value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="e.g. BlueDart / Delhivery / DTDC" style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(212, 175, 55, 0.4)', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px' }}>Tracking / AWB Number</label>
                  <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. BD-987654321" style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(212, 175, 55, 0.4)', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px' }}>Expected Delivery Date</label>
                  <input type="text" value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} placeholder="e.g. 25 July 2026" style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(212, 175, 55, 0.4)', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ background: '#FAF9F5', padding: '14px', borderRadius: '8px', border: '1px solid #EAE3D2' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#333', display: 'block', marginBottom: '8px' }}>➕ Timeline Event &amp; Location Note</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Event Title (e.g. Package Boxed)" style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #DDD', fontSize: '0.8rem' }} />
                  <input type="text" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Location (e.g. Delhi Hub)" style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #DDD', fontSize: '0.8rem' }} />
                </div>
                <input type="text" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} placeholder="Note for customer (e.g. Item passed quality check and packed with protective velvet box)" style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #DDD', fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>

              {/* Recorded Event History */}
              {trackingEvents.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#555', display: 'block', marginBottom: '6px' }}>📜 Recorded Timeline History ({trackingEvents.length})</span>
                  <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #EEE', borderRadius: '6px', padding: '8px', background: '#FAFAFA', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {trackingEvents.map((evt, idx) => (
                      <div key={evt.id || idx} style={{ borderBottom: '1px solid #EEE', paddingBottom: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#333' }}>
                          <strong>{evt.title || evt.status}</strong>
                          <span style={{ color: '#888' }}>{new Date(evt.timestamp).toLocaleString('en-IN')}</span>
                        </div>
                        {evt.location && <div style={{ color: '#666', fontSize: '0.7rem' }}>📍 {evt.location}</div>}
                        {evt.description && <div style={{ color: '#555', fontSize: '0.72rem' }}>{evt.description}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setSelectedOrder(null)} style={{ padding: '8px 16px', border: 'none', background: '#EEE', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Close</button>
                <button type="submit" className="btn-gold" style={{ padding: '8px 20px', fontSize: '0.8rem', borderRadius: '6px', fontWeight: '700' }} disabled={updating}>
                  {updating ? 'Saving & Alerting Customer...' : 'Post Tracking Update & Dispatch Alerts'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
