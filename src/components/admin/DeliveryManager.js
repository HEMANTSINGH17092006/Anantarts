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
  const [shippingDate, setShippingDate] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [courierWebsite, setCourierWebsite] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [trackingEvents, setTrackingEvents] = useState([]);

  const [updating, setUpdating] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Filter Tabs
  const filterTabs = [
    'All',
    'Pending',
    'Processing',
    'Packed',
    'Shipped',
    'Out for Delivery',
    'Delivered',
    'Cancelled',
    'Returned',
    'Refund Pending'
  ];

  // Full 18 Delivery Status Options for Admin Update
  const allDeliveryStatuses = [
    'Order Received',
    'Payment Confirmed',
    'Order Confirmed',
    'Processing',
    'Preparing for Dispatch',
    'Packed',
    'Ready for Pickup',
    'Picked Up by Courier',
    'Shipped',
    'In Transit',
    'Reached Destination Hub',
    'Out for Delivery',
    'Delivery Attempted',
    'Delivered',
    'Cancelled',
    'Returned',
    'Refund Initiated',
    'Refunded'
  ];

  // Metric cards logic
  const pendingCount = initialOrders.filter(o => ['Pending', 'Pending Payment', 'Order Received'].includes(o.order_status)).length;
  const processingCount = initialOrders.filter(o => ['Payment Confirmed', 'Order Confirmed', 'Processing', 'Preparing for Dispatch', 'Preparing', 'Packed', 'Ready for Pickup'].includes(o.order_status)).length;
  const shippedCount = initialOrders.filter(o => ['Picked Up by Courier', 'Shipped', 'In Transit', 'Reached Destination Hub', 'Out for Delivery', 'Delivery Attempted'].includes(o.order_status)).length;
  const deliveredCount = initialOrders.filter(o => o.order_status === 'Delivered').length;
  const refundPendingCount = initialOrders.filter(o => o.refund_status === 'Refund Pending' || o.order_status === 'Refund Pending').length;

  const filteredOrders = initialOrders.filter(o => {
    const q = search.toLowerCase();

    // Check product names in items
    const itemNames = (o.order_items || o.items || []).map(i => (i.product_name || '').toLowerCase()).join(' ');

    const matchesSearch = !q ||
      (o.order_number || '').toLowerCase().includes(q) ||
      (o.customer_name || '').toLowerCase().includes(q) ||
      (o.customer_phone || '').toLowerCase().includes(q) ||
      (o.customer_email || '').toLowerCase().includes(q) ||
      (o.tracking_number || '').toLowerCase().includes(q) ||
      itemNames.includes(q);

    if (!matchesSearch) return false;

    if (activeTab === 'All') return true;
    if (activeTab === 'Pending') return ['Pending', 'Pending Payment', 'Order Received'].includes(o.order_status);
    if (activeTab === 'Processing') return ['Payment Confirmed', 'Order Confirmed', 'Processing', 'Preparing for Dispatch', 'Preparing'].includes(o.order_status);
    if (activeTab === 'Packed') return ['Packed', 'Ready for Pickup'].includes(o.order_status);
    if (activeTab === 'Shipped') return ['Picked Up by Courier', 'Shipped', 'In Transit', 'Reached Destination Hub'].includes(o.order_status);
    if (activeTab === 'Out for Delivery') return ['Out for Delivery', 'Delivery Attempted'].includes(o.order_status);
    if (activeTab === 'Delivered') return o.order_status === 'Delivered';
    if (activeTab === 'Cancelled') return o.order_status === 'Cancelled';
    if (activeTab === 'Returned') return o.order_status === 'Returned';
    if (activeTab === 'Refund Pending') return o.refund_status === 'Refund Pending' || o.order_status === 'Refund Pending';

    return o.order_status === activeTab;
  });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 6000);
  };

  const handleOpenDetail = async (o) => {
    setSelectedOrder(o);
    setNextStatus(o.order_status || 'Processing');
    setCourierName(o.courier_name || '');
    setTrackingNumber(o.tracking_number || '');
    setShippingDate(o.shipping_date || '');
    setEstimatedDelivery(o.estimated_delivery || '');
    setCourierWebsite(o.courier_website || '');
    setEventTitle(`Order ${o.order_status || 'Processing'}`);
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
      shippingDate,
      estimatedDelivery,
      courierWebsite,
      title: eventTitle || `Order ${nextStatus}`,
      description: eventDescription || `Status updated to ${nextStatus}.`,
      location: eventLocation
    });

    setUpdating(false);

    if (res.success) {
      showAlert('success', `Delivery update posted & Email/WhatsApp notification sent to ${selectedOrder.customer_name}!`);
      const updatedObj = {
        ...selectedOrder,
        order_status: nextStatus,
        courier_name: courierName,
        tracking_number: trackingNumber,
        shipping_date: shippingDate,
        estimated_delivery: estimatedDelivery,
        courier_website: courierWebsite
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
            📦 Delivery Management &amp; Tracking Operations
          </h1>
          <span style={{ fontSize: '0.85rem', color: '#666' }}>
            Real-time courier dispatch control, automated email alerts, timeline audit logs, and status tracking
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

      {/* Dashboard Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '12px', border: '1px solid #FFE082', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#E65100', fontWeight: '700' }}>Pending Orders</span>
          <strong style={{ fontSize: '1.5rem', display: 'block', color: '#E65100', marginTop: '4px' }}>{pendingCount}</strong>
          <span style={{ fontSize: '0.7rem', color: '#777', marginTop: '2px', display: 'block' }}>Awaiting payment / received</span>
        </div>

        <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.4)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#B59021', fontWeight: '700' }}>Processing &amp; Packed</span>
          <strong style={{ fontSize: '1.5rem', display: 'block', color: '#B59021', marginTop: '4px' }}>{processingCount}</strong>
          <span style={{ fontSize: '0.7rem', color: '#777', marginTop: '2px', display: 'block' }}>Workshop boxing &amp; staging</span>
        </div>

        <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '12px', border: '1px solid #BBDEFB', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#1976D2', fontWeight: '700' }}>Shipped / In Transit</span>
          <strong style={{ fontSize: '1.5rem', display: 'block', color: '#1976D2', marginTop: '4px' }}>{shippedCount}</strong>
          <span style={{ fontSize: '0.7rem', color: '#777', marginTop: '2px', display: 'block' }}>Handed to courier partner</span>
        </div>

        <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '12px', border: '1px solid #C8E6C9', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#2E7D32', fontWeight: '700' }}>Delivered Orders</span>
          <strong style={{ fontSize: '1.5rem', display: 'block', color: '#2E7D32', marginTop: '4px' }}>{deliveredCount}</strong>
          <span style={{ fontSize: '0.7rem', color: '#777', marginTop: '2px', display: 'block' }}>Handed to customer</span>
        </div>

        <div style={{ background: '#FFFFFF', padding: '18px', borderRadius: '12px', border: '1px solid #FFCDD2', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#C62828', fontWeight: '700' }}>Refund Pending</span>
          <strong style={{ fontSize: '1.5rem', display: 'block', color: '#C62828', marginTop: '4px' }}>{refundPendingCount}</strong>
          <span style={{ fontSize: '0.7rem', color: '#777', marginTop: '2px', display: 'block' }}>Prepaid cancelled orders</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.3)', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Status Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {filterTabs.map(opt => (
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
                fontWeight: activeTab === opt ? '700' : '500',
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
          placeholder="Search Order ID, Name, Email, Phone, Product, AWB..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid rgba(212, 175, 55, 0.4)', fontSize: '0.85rem', width: '280px', outline: 'none' }}
        />
      </div>

      {/* Orders Delivery Table */}
      <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F0F0F0', color: '#888' }}>
              <th style={{ padding: '14px 16px' }}>Order ID &amp; Date</th>
              <th style={{ padding: '14px 16px' }}>Recipient &amp; Contact</th>
              <th style={{ padding: '14px 16px' }}>Shipping Address</th>
              <th style={{ padding: '14px 16px' }}>Courier Partner &amp; AWB</th>
              <th style={{ padding: '14px 16px' }}>Expected Delivery</th>
              <th style={{ padding: '14px 16px' }}>Delivery Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Update Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
                  No orders match the selected filter or search criteria.
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => {
                const status = o.order_status || 'Pending';
                const isDelivered = status === 'Delivered';
                const isShipped = ['Shipped', 'In Transit', 'Out for Delivery', 'Out For Delivery', 'Picked Up by Courier'].includes(status);
                const isCancelled = status === 'Cancelled' || status === 'Returned' || status === 'Refunded';

                return (
                  <tr key={o.id} style={{ borderBottom: '1px solid #F5F5F5' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <strong style={{ display: 'block', color: '#111' }}>{o.order_number}</strong>
                      <span style={{ color: '#888', fontSize: '0.72rem' }}>
                        {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <strong style={{ display: 'block', color: '#333' }}>{o.customer_name}</strong>
                      <span style={{ color: '#777', fontSize: '0.75rem', display: 'block' }}>{o.customer_phone}</span>
                      <span style={{ color: '#999', fontSize: '0.72rem' }}>{o.customer_email}</span>
                    </td>
                    <td style={{ padding: '14px 16px', maxWidth: '200px', color: '#666', fontSize: '0.78rem', lineHeight: '1.3' }}>
                      {o.shipping_address}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <strong style={{ display: 'block', color: '#333' }}>{o.courier_name || 'Unassigned'}</strong>
                      <span style={{ color: '#D4AF37', fontSize: '0.75rem', fontWeight: '700' }}>{o.tracking_number || 'No AWB assigned'}</span>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#555', fontWeight: '600' }}>
                      {o.estimated_delivery || 'Not set'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          display: 'inline-block',
                          textAlign: 'center',
                          background: isDelivered ? '#E8F5E9' : isShipped ? '#E3F2FD' : isCancelled ? '#FFEBEE' : '#FFF8E1',
                          color: isDelivered ? '#2E7D32' : isShipped ? '#1976D2' : isCancelled ? '#C62828' : '#B59021',
                          border: `1px solid ${isDelivered ? '#C8E6C9' : isShipped ? '#BBDEFB' : isCancelled ? '#FFCDD2' : '#FFE082'}`
                        }}>
                          {status}
                        </span>
                        {o.refund_status === 'Refund Pending' && (
                          <span style={{ fontSize: '0.68rem', color: '#C62828', background: '#FFEBEE', padding: '2px 6px', borderRadius: '4px', textAlign: 'center', fontWeight: 'bold' }}>
                            💸 Refund Pending
                          </span>
                        )}
                      </div>
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

      {/* Status & Courier Update Modal */}
      {selectedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div style={{ background: '#FFFFFF', maxWidth: '700px', width: '100%', borderRadius: '12px', padding: '28px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(212, 175, 55, 0.4)', boxShadow: '0 10px 30px rgba(0,0,0,0.25)' }}>
            
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
                {selectedOrder.shipping_address}<br />
                <strong style={{ color: selectedOrder.refund_status === 'Refund Pending' ? '#C62828' : '#333', display: 'inline-block', marginTop: '4px' }}>
                  Payment: {(selectedOrder.payment_method || 'Online').toUpperCase()} ({selectedOrder.payment_status}) {selectedOrder.refund_status ? `| Refund: ${selectedOrder.refund_status}` : ''}
                </strong>
              </div>
            </div>

            {/* Cancellation Reason Info if Cancelled */}
            {selectedOrder.order_status === 'Cancelled' && selectedOrder.cancellation_reason && (
              <div style={{ background: '#FFEBEE', border: '1px solid #FFCDD2', padding: '12px', borderRadius: '6px', fontSize: '0.82rem', color: '#C62828', marginBottom: '16px' }}>
                <strong>🔴 Cancellation Reason:</strong> {selectedOrder.cancellation_reason}
                {selectedOrder.cancelled_by && <span> (By: {selectedOrder.cancelled_by})</span>}
              </div>
            )}

            {/* Delivery Update Form */}
            <form onSubmit={handleStatusUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#D4AF37' }}>📦 Update Delivery Status &amp; Courier Details</h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px' }}>Delivery Status</label>
                  <select value={nextStatus} onChange={(e) => { setNextStatus(e.target.value); setEventTitle(`Order ${e.target.value}`); }} style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(212, 175, 55, 0.4)', borderRadius: '6px', background: 'white', fontSize: '0.85rem' }}>
                    {allDeliveryStatuses.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
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
                  <input type="text" value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} placeholder="e.g. 28 July 2026" style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(212, 175, 55, 0.4)', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px' }}>Shipping Date</label>
                  <input type="text" value={shippingDate} onChange={(e) => setShippingDate(e.target.value)} placeholder="e.g. 26 July 2026" style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(212, 175, 55, 0.4)', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', marginBottom: '4px' }}>Courier Website / Tracking Link</label>
                  <input type="url" value={courierWebsite} onChange={(e) => setCourierWebsite(e.target.value)} placeholder="https://www.bluedart.com" style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(212, 175, 55, 0.4)', borderRadius: '6px', fontSize: '0.85rem' }} />
                </div>
              </div>

              {/* Custom Timeline Note */}
              <div style={{ background: '#FAF9F5', padding: '14px', borderRadius: '8px', border: '1px solid #EAE3D2' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#333', display: 'block', marginBottom: '8px' }}>➕ Custom Timeline Event &amp; Transit Note</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Event Title (e.g. Package Packed / Reached Hub)" style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #DDD', fontSize: '0.8rem' }} />
                  <input type="text" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Location (e.g. Mumbai Sorting Hub)" style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #DDD', fontSize: '0.8rem' }} />
                </div>
                <textarea rows="2" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} placeholder="Custom update note for customer (e.g. Item passed quality inspection and packed in protective velvet box / Delayed due to heavy rain)" style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #DDD', fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>

              {/* Recorded Event Timeline History */}
              {trackingEvents.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#555', display: 'block', marginBottom: '6px' }}>📜 Timeline History &amp; Audit Trail ({trackingEvents.length})</span>
                  <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid #EEE', borderRadius: '6px', padding: '8px', background: '#FAFAFA', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {trackingEvents.map((evt, idx) => (
                      <div key={evt.id || idx} style={{ borderBottom: '1px solid #EEE', paddingBottom: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#333' }}>
                          <strong>{evt.title || evt.status}</strong>
                          <span style={{ color: '#888' }}>
                            {new Date(evt.timestamp).toLocaleString('en-IN')} {evt.created_by_admin ? `by ${evt.created_by_admin}` : ''}
                          </span>
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
                  {updating ? 'Saving & Alerting Customer...' : 'Post Tracking Update & Dispatch Notifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
