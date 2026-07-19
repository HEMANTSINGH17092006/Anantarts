'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrderStatus } from '@/app/actions';
import { formatPrice } from '@/lib/utils';

export default function OrderManager({ initialOrders = [] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Status editing states
  const [nextStatus, setNextStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
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

  const orderTabs = ['All', 'Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];
  const paymentStatusOptions = ['All', 'Captured', 'Authorized', 'Pending', 'Failed', 'Refunded'];

  // Metrics Calculations
  const totalCapturedRevenue = initialOrders
    .filter(o => o.payment_status === 'Captured' || o.payment_status === 'Paid')
    .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

  const authorizedCount = initialOrders.filter(o => o.payment_status === 'Authorized').length;
  const capturedCount = initialOrders.filter(o => o.payment_status === 'Captured' || o.payment_status === 'Paid').length;
  const pendingCount = initialOrders.filter(o => !o.payment_status || o.payment_status === 'Pending').length;
  const failedCount = initialOrders.filter(o => o.payment_status === 'Failed' || o.payment_status === 'Refunded').length;

  const filteredOrders = initialOrders.filter(o => {
    const matchesSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) ||
                          o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
                          (o.razorpay_payment_id && o.razorpay_payment_id.toLowerCase().includes(search.toLowerCase()));
    const matchesTab = activeTab === 'All' || o.order_status === activeTab;
    const matchesPayment = paymentFilter === 'All' || 
                           (paymentFilter === 'Captured' && (o.payment_status === 'Captured' || o.payment_status === 'Paid')) ||
                           o.payment_status === paymentFilter;
    return matchesSearch && matchesTab && matchesPayment;
  });

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
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${o.order_number} - Anant Arts</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1c1c1c; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; }
            .company { font-family: Georgia, serif; font-size: 24px; color: #8C2425; font-weight: bold; }
            .invoice-title { font-size: 20px; text-transform: uppercase; letter-spacing: 2px; color: #D4AF37; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 30px 0; }
            .box { background: #FAF7F2; padding: 15px; border-radius: 4px; border: 1px solid #EAE3D2; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #8C2425; color: white; }
            .totals { margin-top: 30px; float: right; width: 300px; }
            .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="company">ANANT ARTS</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">Divine Metal Craft & Idols Studio</div>
            </div>
            <div style="text-align: right;">
              <div class="invoice-title">Tax Invoice</div>
              <div style="font-size: 14px; font-weight: bold;">Order #${o.order_number}</div>
              <div style="font-size: 12px; color: #666;">Date: ${new Date(o.created_at).toLocaleDateString('en-IN')}</div>
            </div>
          </div>

          <div class="details-grid">
            <div class="box">
              <strong>Billed & Shipped To:</strong><br />
              ${o.customer_name}<br />
              ${o.shipping_address}<br />
              Phone: ${o.customer_phone}<br />
              Email: ${o.customer_email}
            </div>
            <div class="box">
              <strong>Payment Summary:</strong><br />
              Method: ${o.payment_method || 'Razorpay'}<br />
              Status: ${o.payment_status || 'Captured'}<br />
              Transaction ID: ${o.razorpay_payment_id || o.payment_id || 'N/A'}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${o.items?.map(item => `
                <tr>
                  <td>${item.product_name}</td>
                  <td>${formatPrice(item.price)}</td>
                  <td>${item.quantity}</td>
                  <td>${formatPrice(item.total_price)}</td>
                </tr>
              `).join('') || '<tr><td colspan="4">No item details</td></tr>'}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>${formatPrice(o.subtotal || o.total_amount)}</span>
            </div>
            ${o.discount_amount > 0 ? `
            <div class="totals-row" style="color: green;">
              <span>Discount:</span>
              <span>-${formatPrice(o.discount_amount)}</span>
            </div>
            ` : ''}
            <div class="totals-row">
              <span>Shipping:</span>
              <span>${o.shipping_charge === 0 ? 'FREE' : formatPrice(o.shipping_charge)}</span>
            </div>
            <hr />
            <div class="totals-row" style="font-size: 16px; font-weight: 700;">
              <span>Grand Total:</span>
              <span>${formatPrice(o.total_amount)}</span>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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

        {/* Payment Filter Dropdown */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Payment:</span>
          <select 
            value={paymentFilter} 
            onChange={(e) => setPaymentFilter(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--primary-gold-border)', fontSize: '0.8rem', background: 'white' }}
          >
            {paymentStatusOptions.map(opt => (
              <option key={opt} value={opt}>{opt === 'All' ? 'All Payment Statuses' : opt}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search ref, customer, pay_id..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid var(--primary-gold-border)',
              fontSize: '0.8rem',
              width: '220px'
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
                <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
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

                return (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--bg-cream-dark)' }}>
                    <td style={{ padding: '12px', fontWeight: '600' }}>{o.order_number}</td>
                    <td style={{ padding: '12px' }}>{o.customer_name}</td>
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

            {/* Status updates Form */}
            <form onSubmit={handleStatusUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--primary-gold-border)', paddingTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Order Status Log</label>
                  <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px', background: 'white' }}>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Packed">Packed</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '500', marginBottom: '4px' }}>Courier Tracking No</label>
                  <input type="text" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. BD-12345" style={{ width: '100%', padding: '8px', border: '1px solid var(--primary-gold-border)', borderRadius: '4px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => handlePrintInvoice(selectedOrder)} className="btn-outline-gold" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
                  <i className="fas fa-print" style={{ marginRight: '6px' }}></i> Invoice
                </button>
                <button type="submit" className="btn-gold" style={{ padding: '8px 16px', fontSize: '0.8rem' }} disabled={updating}>
                  {updating ? 'Saving logs...' : 'Save Order Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
