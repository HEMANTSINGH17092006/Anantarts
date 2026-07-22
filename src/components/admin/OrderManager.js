'use client';
import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrderStatus, addAdminOrderTrackingEventAction, getAdminOrderTrackingEventsAction } from '@/app/actions';
import { formatPrice } from '@/lib/utils';

export default function OrderManager({ initialOrders = [] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [orders, setOrders] = useState(initialOrders);
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const [activeTab, setActiveTab] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [popoverOrderId, setPopoverOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Permanent Deletion States
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteStep, setDeleteStep] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  // Status & Tracking editing states
  const [nextStatus, setNextStatus] = useState('');
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [trackingEvents, setTrackingEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [updating, setUpdating] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const handleExportCSV = () => {
    const headers = ['Order Number', 'Date', 'Customer Name', 'Customer Email', 'Customer Phone', 'Total Amount', 'Order Status', 'Payment Status', 'Payment Method', 'Payment ID'];
    const rows = filteredOrders.map(o => [
      o.order_number,
      new Date(o.created_at).toLocaleDateString('en-IN'),
      o.customer_name,
      o.customer_email,
      o.customer_phone,
      o.total_amount,
      o.order_status,
      o.payment_status || 'Pending',
      o.payment_method || 'COD',
      o.razorpay_payment_id || o.payment_id || ''
    ]);
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `anant_arts_orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 5000);
  };

  const orderTabs = ['All', 'Pending', 'Payment Confirmed', 'Order Confirmed', 'Preparing Shipment', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled'];
  const paymentStatusOptions = ['All', 'Captured', 'Authorized', 'Pending', 'Failed', 'Refunded'];

  // Metrics Calculations
  const totalCapturedRevenue = orders
    .filter(o => o.payment_status === 'Captured' || o.payment_status === 'Paid')
    .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  const authorizedCount = orders.filter(o => o.payment_status === 'Authorized').length;
  const capturedCount = orders.filter(o => o.payment_status === 'Captured' || o.payment_status === 'Paid').length;
  const pendingCount = orders.filter(o => !o.payment_status || o.payment_status === 'Pending').length;
  const failedCount = orders.filter(o => o.payment_status === 'Failed' || o.payment_status === 'Refunded').length;

  const filteredOrders = orders.filter(o => {
    const term = search.toLowerCase().trim();
    const matchesSearch = !term ||
      (o.order_number && o.order_number.toLowerCase().includes(term)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(term)) ||
      (o.customer_phone && o.customer_phone.toLowerCase().includes(term)) ||
      (o.customer_email && o.customer_email.toLowerCase().includes(term)) ||
      (o.razorpay_payment_id && o.razorpay_payment_id.toLowerCase().includes(term)) ||
      (o.items && o.items.some(item => item.product_name && item.product_name.toLowerCase().includes(term)));

    const matchesTab = activeTab === 'All' || o.order_status === activeTab;
    const matchesPayment = paymentFilter === 'All' || 
                           (paymentFilter === 'Captured' && (o.payment_status === 'Captured' || o.payment_status === 'Paid')) ||
                           o.payment_status === paymentFilter;
    return matchesSearch && matchesTab && matchesPayment;
  }).sort((a, b) => {
    if (sortBy === 'value-high') {
      return (Number(b.total_amount) || 0) - (Number(a.total_amount) || 0);
    }
    if (sortBy === 'items-most') {
      const aQty = (a.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
      const bQty = (b.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
      return bQty - aQty;
    }
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  // Permanent Deletion Handlers
  const handlePromptDelete = (o) => {
    if (!o) return;
    setDeleteTarget(o);
    const pStatus = (o.payment_status || '').toUpperCase();
    if (pStatus === 'CAPTURED' || pStatus === 'PAID') {
      setDeleteStep('captured_warning');
    } else {
      setDeleteStep('confirm_delete');
    }
  };

  const handleConfirmCapturedWarning = () => {
    setDeleteStep('confirm_delete');
  };

  const handleExecuteDeleteOrder = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const res = await fetch('/api/admin/orders/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: deleteTarget.id,
          orderNumber: deleteTarget.order_number
        })
      });

      const data = await res.json();
      setDeleting(false);

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete order. Please try again.');
      }

      const deletedId = deleteTarget.id;
      setOrders(prev => prev.filter(o => o.id !== deletedId));

      if (selectedOrder && selectedOrder.id === deletedId) {
        setSelectedOrder(null);
      }

      setDeleteTarget(null);
      setDeleteStep('');

      showAlert('success', 'Order permanently deleted.');

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setDeleting(false);
      showAlert('danger', 'Failed to delete order. Please try again.');
    }
  };

  const handleOpenDetail = (o) => {
    setSelectedOrder(o);
    setNextStatus(o.order_status);
    setTrackingNumber(o.tracking_number || '');
  };

  const handleStatusUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdating(true);

    const res = await updateOrderStatus(selectedOrder.id, nextStatus, trackingNumber);
    setUpdating(false);

    if (res.success) {
      showAlert('success', `Order status updated to "${nextStatus}" successfully!`);
      setSelectedOrder({ ...selectedOrder, order_status: nextStatus, tracking_number: trackingNumber });
      startTransition(() => {
        router.refresh();
      });
    } else {
      showAlert('danger', res.message);
    }
  };

  const handleManualCapture = async (order) => {
    const paymentId = order.razorpay_payment_id || order.payment_id;
    if (!paymentId) {
      showAlert('danger', 'No Razorpay payment ID found for this order.');
      return;
    }

    setCapturing(true);
    try {
      const res = await fetch('/api/admin/payments/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          payment_id: paymentId,
          amount: order.total_amount
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Capture failed.');
      }

      showAlert('success', data.message);
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder({ ...selectedOrder, payment_status: 'Captured' });
      }
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      showAlert('danger', err.message);
    } finally {
      setCapturing(false);
    }
  };

  const handleRefundPayment = async (order) => {
    const paymentId = order.razorpay_payment_id || order.payment_id;
    if (!paymentId) {
      showAlert('danger', 'No Razorpay transaction ID recorded for this order.');
      return;
    }

    const confirmRefund = window.confirm(`Are you sure you want to refund ₹${order.total_amount} for Order ${order.order_number}?`);
    if (!confirmRefund) return;

    const reason = window.prompt('Enter reason for refund:', 'Customer requested refund');
    if (reason === null) return;

    setRefunding(true);
    try {
      const res = await fetch('/api/admin/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          payment_id: paymentId,
          amount: order.total_amount,
          reason
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Refund failed.');
      }

      showAlert('success', data.message);
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder({ ...selectedOrder, payment_status: 'Refunded', order_status: 'Cancelled' });
      }
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      showAlert('danger', err.message);
    } finally {
      setRefunding(false);
    }
  };

  const handleSendWhatsApp = (o) => {
    const phoneClean = o.customer_phone.replace(/[^\d]/g, '');
    let text = `Hi ${o.customer_name}, greetings from Anant Arts! 🪷\n\n`;
    
    if (o.order_status === 'Pending') {
      text += `Your order ${o.order_number} of total amount ${formatPrice(o.total_amount)} has been registered. We are preparing the divine casts.`;
    } else if (o.order_status === 'Confirmed') {
      text += `Your order ${o.order_number} has been confirmed. The electroplating ritual has commenced.`;
    } else if (o.order_status === 'Packed') {
      text += `Your order ${o.order_number} is packed in a reinforced wooden crate for transit security. Shipping dispatch soon.`;
    } else if (o.order_status === 'Shipped') {
      text += `Your order ${o.order_number} has been shipped! 🚚\n`;
      if (o.tracking_number) {
        text += `Tracking Number: ${o.tracking_number}\n`;
      }
      text += `Track here: https://anantarts.in/order-tracking?order=${o.order_number}`;
    } else if (o.order_status === 'Delivered') {
      text += `Your order ${o.order_number} has been safely delivered! May the divine idols bring health, peace, and abundance to your home. 🙏`;
    } else {
      text += `Update regarding your order ${o.order_number}: Current status is ${o.order_status}.`;
    }

    let toNum = phoneClean;
    if (toNum.length === 10) toNum = '91' + toNum;
    window.open(`https://wa.me/${toNum}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrintInvoice = (o) => {
    if (!o || !o.id) return;
    window.open(`/api/orders/${o.id}/invoice`, '_blank');
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

      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', margin: 0 }}>Order & Payment Dashboard</h1>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time payment capture status, auto-capture controls, and order dispatch</span>
        </div>
        <button onClick={handleExportCSV} className="btn-outline-gold" style={{ fontSize: '0.8rem', padding: '10px 16px' }}>
          <i className="fas fa-file-export" style={{ marginRight: '6px' }}></i> Export Orders CSV
        </button>
      </div>

      {/* Payment Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Captured Revenue</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--success)', marginTop: '4px' }}>{formatPrice(totalCapturedRevenue)}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>{capturedCount} Paid Orders</div>
        </div>

        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #FFE082', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: '#E65100', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Authorized (Stuck)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#E65100', marginTop: '4px' }}>{authorizedCount}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Requires capture verification</div>
        </div>

        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending COD</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-dark)', marginTop: '4px' }}>{pendingCount}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Cash on delivery</div>
        </div>

        <div style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #FFCDD2', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '0.75rem', color: '#C62828', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Failed / Refunded</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#C62828', marginTop: '4px' }}>{failedCount}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Cancelled or refunded</div>
        </div>
      </div>

      {/* Filter controls */}
      <div style={{ background: 'white', padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Order Status Tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {orderTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '6px 14px',
                borderRadius: '4px',
                border: 'none',
                background: activeTab === tab ? 'var(--primary-gold)' : 'var(--bg-cream)',
                color: activeTab === tab ? 'white' : 'var(--text-dark)',
                fontSize: '0.8rem',
                fontWeight: activeTab === tab ? '600' : '400',
                cursor: 'pointer'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filter & Sort Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            value={paymentFilter} 
            onChange={(e) => setPaymentFilter(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--primary-gold-border)', fontSize: '0.8rem', background: 'white' }}
          >
            {paymentStatusOptions.map(opt => (
              <option key={opt} value={opt}>{opt === 'All' ? 'All Payment Statuses' : opt}</option>
            ))}
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--primary-gold-border)', fontSize: '0.8rem', background: 'white', fontWeight: '600' }}
          >
            <option value="latest">Sort: Latest Orders</option>
            <option value="value-high">Sort: Highest Value Orders</option>
            <option value="items-most">Sort: Most Ordered Products</option>
          </select>

          <input
            type="text"
            placeholder="Search Order ID, Customer, Product, Phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid var(--primary-gold-border)',
              fontSize: '0.8rem',
              width: '260px'
            }}
          />
        </div>
      </div>

      {/* Grid Table */}
      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--bg-cream-dark)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '12px' }}>Order Ref</th>
              <th style={{ padding: '12px' }}>Customer Name</th>
              <th style={{ padding: '12px' }}>📦 Product / Idol</th>
              <th style={{ padding: '12px' }}>Date</th>
              <th style={{ padding: '12px' }}>Amount</th>
              <th style={{ padding: '12px' }}>Payment Mode</th>
              <th style={{ padding: '12px' }}>Payment Status</th>
              <th style={{ padding: '12px' }}>Order Status</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No orders registered under this criteria.
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => {
                const payStatus = o.payment_status || 'Pending';
                const isCaptured = payStatus === 'Captured' || payStatus === 'Paid';
                const isAuthorized = payStatus === 'Authorized';
                const isFailed = payStatus === 'Failed';
                const isRefunded = payStatus === 'Refunded';

                const firstItem = o.items && o.items.length > 0 ? o.items[0] : null;
                const extraItemsCount = o.items && o.items.length > 1 ? o.items.length - 1 : 0;

                return (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--bg-cream-dark)' }}>
                    <td style={{ padding: '12px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      {o.order_number}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <strong style={{ display: 'block', color: 'var(--text-dark)' }}>{o.customer_name}</strong>
                      {o.customer_phone && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📞 {o.customer_phone}</span>
                      )}
                    </td>
                    
                    {/* 📦 Product / Idol Column */}
                    <td style={{ padding: '12px', minWidth: '220px', maxWidth: '280px', verticalAlign: 'middle' }}>
                      {!firstItem ? (
                        <span style={{ fontSize: '0.78rem', color: '#999', fontStyle: 'italic' }}>No item details</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={firstItem.image_path || '/images/placeholder.jpg'}
                            alt={firstItem.product_name}
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '6px',
                              objectFit: 'cover',
                              border: '1px solid var(--primary-gold-border)',
                              flexShrink: 0,
                              background: '#F9F9F9'
                            }}
                            onError={(e) => { e.target.src = '/images/placeholder.jpg'; }}
                          />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontSize: '0.82rem',
                                fontWeight: '700',
                                color: 'var(--text-dark)',
                                wordBreak: 'break-word',
                                lineHeight: '1.25'
                              }}
                              title={firstItem.product_name}
                            >
                              {firstItem.product_name}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span>Qty: <strong style={{ color: '#111' }}>{firstItem.quantity}</strong></span>
                              
                              {extraItemsCount > 0 && (
                                <div
                                  style={{ position: 'relative', display: 'inline-block' }}
                                  onMouseEnter={() => setPopoverOrderId(o.id)}
                                  onMouseLeave={() => setPopoverOrderId(null)}
                                >
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPopoverOrderId(popoverOrderId === o.id ? null : o.id);
                                    }}
                                    style={{
                                      background: 'var(--bg-cream, #FAF7F2)',
                                      color: 'var(--primary, #8C2425)',
                                      border: '1px solid var(--primary-gold-border, #D4AF37)',
                                      padding: '1px 7px',
                                      borderRadius: '12px',
                                      fontSize: '0.7rem',
                                      fontWeight: '700',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '2px',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                    }}
                                  >
                                    +{extraItemsCount} more items
                                  </span>

                                  {/* Hover / Click Popover Dropdown */}
                                  {popoverOrderId === o.id && (
                                    <div
                                      style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '100%',
                                        marginTop: '6px',
                                        width: '280px',
                                        background: '#FFFFFF',
                                        border: '1px solid var(--primary-gold-border)',
                                        borderRadius: '8px',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                                        zIndex: 1000,
                                        padding: '12px',
                                        fontSize: '0.78rem',
                                        textAlign: 'left'
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div style={{ fontWeight: '700', fontSize: '0.78rem', color: 'var(--primary)', marginBottom: '8px', borderBottom: '1px solid #F0F0F0', paddingBottom: '4px' }}>
                                        📦 Ordered Items ({o.items.length})
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                                        {o.items.map((item, idx) => (
                                          <div key={item.id || idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', borderBottom: idx < o.items.length - 1 ? '1px dashed #EEE' : 'none', paddingBottom: '4px' }}>
                                            <img
                                              src={item.image_path || '/images/placeholder.jpg'}
                                              alt={item.product_name}
                                              style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #DDD', flexShrink: 0 }}
                                              onError={(e) => { e.target.src = '/images/placeholder.jpg'; }}
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                              <div style={{ fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#222' }}>
                                                {item.product_name}
                                              </div>
                                              <div style={{ color: '#666', fontSize: '0.72rem' }}>
                                                Qty: <strong>{item.quantity}</strong> × {formatPrice(item.price)}
                                              </div>
                                            </div>
                                            <div style={{ fontWeight: '700', color: '#222', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                              {formatPrice(item.total_price || (item.price * item.quantity))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: '12px', fontWeight: '600' }}>{formatPrice(o.total_amount)}</td>
                    <td style={{ padding: '12px', textTransform: 'uppercase' }}>{o.payment_method || 'COD'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        backgroundColor: isCaptured ? 'rgba(46,125,50,0.12)' : (isAuthorized ? '#FFF3E0' : (isFailed ? '#FFEBEE' : (isRefunded ? '#F3E5F5' : 'rgba(239,108,0,0.1)'))),
                        color: isCaptured ? '#2E7D32' : (isAuthorized ? '#E65100' : (isFailed ? '#C62828' : (isRefunded ? '#7B1FA2' : '#E65100')))
                      }}>
                        {isCaptured ? '✓ CAPTURED' : (isAuthorized ? '⚡ AUTHORIZED' : payStatus.toUpperCase())}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.68rem',
                        fontWeight: '600',
                        backgroundColor: o.order_status === 'Delivered' ? 'rgba(46,125,50,0.1)' : 'rgba(21, 101, 192, 0.1)',
                        color: o.order_status === 'Delivered' ? 'var(--success)' : 'var(--info)'
                      }}>
                        {o.order_status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {isAuthorized && (
                        <button 
                          onClick={() => handleManualCapture(o)} 
                          className="btn-gold" 
                          style={{ padding: '4px 8px', fontSize: '0.7rem', background: '#E65100', borderColor: '#E65100' }}
                          title="Capture authorized payment"
                          disabled={capturing}
                        >
                          Capture
                        </button>
                      )}
                      {isCaptured && (o.razorpay_payment_id || o.payment_id) && (
                        <button 
                          onClick={() => handleRefundPayment(o)} 
                          style={{ padding: '4px 8px', fontSize: '0.7rem', background: 'transparent', border: '1px solid #7B1FA2', color: '#7B1FA2', borderRadius: '4px', cursor: 'pointer' }}
                          title="Refund captured payment"
                          disabled={refunding}
                        >
                          Refund
                        </button>
                      )}
                      <button onClick={() => handleOpenDetail(o)} className="header-icon" title="View details" style={{ color: 'var(--info)' }}><i className="fas fa-eye"></i></button>
                      <button onClick={() => handlePrintInvoice(o)} className="header-icon" title="Print Invoice" style={{ color: 'var(--text-dark)' }}><i className="fas fa-print"></i></button>
                      <button onClick={() => handleSendWhatsApp(o)} className="header-icon" title="Send WhatsApp Update" style={{ color: '#25D366' }}><i className="fab fa-whatsapp"></i></button>
                      <button onClick={() => handlePromptDelete(o)} className="header-icon" title="Delete Order Permanently" style={{ color: 'var(--danger, #C62828)' }}><i className="fas fa-trash-alt"></i></button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Details / Status Edit Modal */}
      {selectedOrder && (
        <div className="admin-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="admin-modal-content" style={{ maxWidth: '650px', width: '90%', padding: '24px' }}>
            <span className="modal-close-btn" onClick={() => setSelectedOrder(null)}>&times;</span>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '16px' }}>
              Order Detail: {selectedOrder.order_number}
            </h3>

            {/* Customer Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.8rem', background: 'var(--bg-cream)', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
              <div>
                <strong>Customer Info:</strong><br />
                Name: {selectedOrder.customer_name}<br />
                Phone: {selectedOrder.customer_phone}<br />
                Email: {selectedOrder.customer_email}
              </div>
              <div>
                <strong>Shipping Address:</strong><br />
                {selectedOrder.shipping_address}
              </div>
            </div>

            {/* Payment Details Box */}
            <div style={{ background: '#FAF7F2', padding: '12px 16px', borderRadius: '6px', border: '1px solid var(--primary-gold-border)', marginBottom: '16px', fontSize: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <strong>Payment Method:</strong> {selectedOrder.payment_method || 'Razorpay'}<br />
                <strong>Payment Status:</strong> <span style={{ fontWeight: '700', color: selectedOrder.payment_status === 'Captured' || selectedOrder.payment_status === 'Paid' ? '#2E7D32' : '#E65100' }}>{selectedOrder.payment_status || 'Pending'}</span>
              </div>
              <div>
                <strong>Transaction ID:</strong> <code style={{ fontSize: '0.75rem' }}>{selectedOrder.razorpay_payment_id || selectedOrder.payment_id || 'N/A'}</code><br />
                <strong>Razorpay Order ID:</strong> <code style={{ fontSize: '0.75rem' }}>{selectedOrder.razorpay_order_id || 'N/A'}</code>
              </div>
            </div>

            {/* Action Buttons for Authorized or Captured */}
            {selectedOrder.payment_status === 'Authorized' && (
              <div style={{ background: '#FFF3E0', border: '1px solid #FFE082', padding: '12px', borderRadius: '6px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#E65100', fontWeight: '600' }}>⚠️ Payment is Authorized but not yet Captured.</span>
                <button onClick={() => handleManualCapture(selectedOrder)} className="btn-gold" style={{ padding: '6px 14px', fontSize: '0.75rem', background: '#E65100', borderColor: '#E65100' }} disabled={capturing}>
                  {capturing ? 'Capturing...' : 'Capture Payment Now'}
                </button>
              </div>
            )}

            {/* Items */}
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--primary-gold-border)', borderRadius: '4px', padding: '10px', marginBottom: '16px', fontSize: '0.78rem' }}>
              {selectedOrder.items?.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span>{item.product_name} <strong>x{item.quantity}</strong></span>
                  <strong>{formatPrice(item.total_price)}</strong>
                </div>
              ))}
            </div>

            {/* Status & Tracking updates Form */}
            <form onSubmit={handleStatusUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--primary-gold-border)', paddingTop: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#D4AF37' }}>📦 Shipment &amp; Tracking Management</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Order Status</label>
                  <select value={nextStatus} onChange={(e) => { setNextStatus(e.target.value); if (!eventTitle) setEventTitle(`Order ${e.target.value}`); }} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px', background: 'white', fontSize: '0.82rem' }}>
                    <option value="Pending">Pending</option>
                    <option value="Payment Confirmed">Payment Confirmed</option>
                    <option value="Order Confirmed">Order Confirmed</option>
                    <option value="Preparing Shipment">Preparing Shipment</option>
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
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Courier Partner Name</label>
                  <input type="text" value={courierName} onChange={(e) => setCourierName(e.target.value)} placeholder="e.g. BlueDart / Delhivery" style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px', fontSize: '0.82rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Tracking / AWB Number</label>
                  <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. BD-987654321" style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px', fontSize: '0.82rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', marginBottom: '4px' }}>Expected Delivery Date</label>
                  <input type="text" value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} placeholder="e.g. 25 July 2026" style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px', fontSize: '0.82rem' }} />
                </div>
              </div>

              {/* Event Timeline Entry */}
              <div style={{ background: '#FDFBF7', padding: '12px', borderRadius: '6px', border: '1px solid #EAE3D2' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#333', display: 'block', marginBottom: '8px' }}>➕ Add Timeline Tracking Event</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Event Title (e.g. Package Handed to Courier)" style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #DDD', fontSize: '0.8rem' }} />
                  <input type="text" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} placeholder="Location (e.g. Mumbai Sorting Hub)" style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #DDD', fontSize: '0.8rem' }} />
                </div>
                <input type="text" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} placeholder="Event Details / Note (e.g. Package cleared security scan and departed facility)" style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #DDD', fontSize: '0.8rem', boxSizing: 'border-box' }} />
              </div>

              {/* Tracking History Timeline */}
              {trackingEvents.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#555', display: 'block', marginBottom: '6px' }}>📜 Recorded Tracking Timeline ({trackingEvents.length})</span>
                  <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #EEE', borderRadius: '4px', padding: '8px', background: '#FAFAFA', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {trackingEvents.map((evt, idx) => (
                      <div key={evt.id || idx} style={{ borderBottom: '1px solid #EEE', paddingBottom: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#333' }}>
                          <strong>{evt.title || evt.status}</strong>
                          <span style={{ color: '#888' }}>{new Date(evt.timestamp || Date.now()).toLocaleString('en-IN')}</span>
                        </div>
                        {evt.location && <div style={{ color: '#666', fontSize: '0.7rem' }}>📍 {evt.location}</div>}
                        {evt.description && <div style={{ color: '#555', fontSize: '0.72rem' }}>{evt.description}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => handlePrintInvoice(selectedOrder)} className="btn-outline-gold" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                  <i className="fas fa-print" style={{ marginRight: '6px' }}></i> Invoice
                </button>
                <button type="submit" className="btn-gold" style={{ padding: '8px 16px', fontSize: '0.8rem' }} disabled={updating}>
                  {updating ? 'Recording Status...' : 'Post Tracking Update & Alert Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PERMANENT DELETE CONFIRMATION MODAL ================= */}
      {deleteTarget && (
        <div className="admin-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)' }}>
          <div className="admin-modal-content" style={{ maxWidth: '440px', width: '90%', padding: '28px', borderRadius: '12px', background: '#FFFFFF', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid var(--primary-gold-border)' }}>
            
            {deleteStep === 'captured_warning' ? (
              <>
                <div style={{ fontSize: '2.5rem', color: '#E65100', marginBottom: '12px' }}>⚠️</div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '12px', color: '#1C1C1C' }}>
                  Delete Order - Warning
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#555', lineHeight: '1.5', marginBottom: '24px' }}>
                  This order contains a successful payment. Deleting it may remove payment records permanently.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => { setDeleteTarget(null); setDeleteStep(''); }}
                    className="btn-outline-gold"
                    style={{ flex: 1, padding: '10px', fontSize: '0.82rem' }}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmCapturedWarning}
                    style={{ flex: 1, padding: '10px', fontSize: '0.82rem', background: '#E65100', color: '#FFF', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' }}
                    disabled={deleting}
                  >
                    Proceed to Delete
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '2.5rem', color: 'var(--danger, #C62828)', marginBottom: '12px' }}>🗑️</div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '12px', color: '#1C1C1C' }}>
                  Delete Order
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#555', lineHeight: '1.5', marginBottom: '24px' }}>
                  Are you sure you want to permanently delete this order from the system and database? This action cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => { setDeleteTarget(null); setDeleteStep(''); }}
                    className="btn-outline-gold"
                    style={{ flex: 1, padding: '10px', fontSize: '0.82rem' }}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteDeleteOrder}
                    style={{
                      flex: 1,
                      padding: '10px',
                      fontSize: '0.82rem',
                      background: 'var(--danger, #C62828)',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Permanently Delete'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
