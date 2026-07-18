'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrderStatus } from '@/app/actions';
import { formatPrice } from '@/lib/utils';

export default function OrderManager({ initialOrders = [] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Status editing states
  const [nextStatus, setNextStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updating, setUpdating] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 5000);
  };

  const orderTabs = ['All', 'Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];

  const filteredOrders = initialOrders.filter(o => {
    const matchesSearch = o.order_number.toLowerCase().includes(search.toLowerCase()) ||
                          o.customer_name.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'All' || o.order_status === activeTab;
    return matchesSearch && matchesTab;
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
      // Update local state briefly
      setSelectedOrder({ ...selectedOrder, order_status: nextStatus, tracking_number: trackingNumber });
      startTransition(() => {
        router.refresh();
      });
    } else {
      showAlert('danger', res.message);
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
      text += `Track here: https://anantarts.vercel.app/order-tracking?order=${o.order_number}`;
    } else if (o.order_status === 'Delivered') {
      text += `Your order ${o.order_number} has been delivered successfully! May the divine idols bring peace and prosperity to your home. 🙏`;
    }

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${phoneClean}?text=${encoded}`, '_blank');
  };

  // Inline Print handler
  const handlePrintInvoice = (o) => {
    const printWindow = window.open('', '_blank');
    const itemsHtml = o.items.map(item => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 10px;">${item.product_name}</td>
        <td style="padding: 10px; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; text-align: right;">${formatPrice(item.price)}</td>
        <td style="padding: 10px; text-align: right;">${formatPrice(item.total_price)}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Invoice - ${o.order_number}</title>
          <style>
            body { font-family: 'Poppins', sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: 700; color: #D4AF37; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
            .section-title { font-weight: 700; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 10px; text-transform: uppercase; font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 40px; }
            th { background: #FFF8F0; padding: 10px; border-bottom: 2px solid #ddd; text-align: left; }
            .totals { float: right; width: 300px; margin-top: 30px; font-size: 14px; }
            .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <div>
              <span class="title">Anant Arts</span>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">Bringing Divine Art to Every Home</div>
            </div>
            <div style="text-align: right;">
              <strong>INVOICE</strong><br />
              No: ${o.order_number}<br />
              Date: ${new Date(o.created_at).toLocaleDateString('en-IN')}
            </div>
          </div>

          <div class="details">
            <div>
              <div class="section-title">Recipient details</div>
              <strong>${o.customer_name}</strong><br />
              Phone: ${o.customer_phone}<br />
              Email: ${o.customer_email}
            </div>
            <div>
              <div class="section-title">Delivery Address</div>
              ${o.shipping_address}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>${formatPrice(o.subtotal)}</span>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', margin: 0 }}>Order Management</h1>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verify shipments, print invoices, and update status logs</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--primary-gold-border)', paddingBottom: '1px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {orderTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === tab ? 'white' : 'transparent',
              borderTopLeftRadius: '6px',
              borderTopRightRadius: '6px',
              border: activeTab === tab ? '1px solid var(--primary-gold-border)' : '1px solid transparent',
              borderBottom: activeTab === tab ? '1px solid white' : 'none',
              fontSize: '0.82rem',
              fontWeight: activeTab === tab ? '600' : '400',
              cursor: 'pointer',
              color: activeTab === tab ? 'var(--text-dark)' : 'var(--text-muted)'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ background: 'white', padding: '16px 20px', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Search by order number, customer name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            maxWidth: '400px',
            width: '100%',
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid var(--primary-gold-border)',
            fontSize: '0.82rem'
          }}
        />
      </div>

      {/* Grid Table */}
      <div style={{ background: 'white', borderRadius: '8px', border: '1px solid var(--primary-gold-border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
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
              filteredOrders.map((o) => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--bg-cream-dark)' }}>
                  <td style={{ padding: '12px', fontWeight: '600' }}>{o.order_number}</td>
                  <td style={{ padding: '12px' }}>{o.customer_name}</td>
                  <td style={{ padding: '12px' }}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '12px', fontWeight: '600' }}>{formatPrice(o.total_amount)}</td>
                  <td style={{ padding: '12px', textTransform: 'uppercase' }}>{o.payment_method}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.68rem',
                      fontWeight: '600',
                      backgroundColor: o.payment_status === 'Paid' ? 'rgba(46,125,50,0.1)' : 'rgba(239,108,0,0.1)',
                      color: o.payment_status === 'Paid' ? 'var(--success)' : 'var(--warning)'
                    }}>
                      {o.payment_status}
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
                  <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button onClick={() => handleOpenDetail(o)} className="header-icon" title="View details" style={{ color: 'var(--info)' }}><i className="fas fa-eye"></i></button>
                    <button onClick={() => handlePrintInvoice(o)} className="header-icon" title="Print Invoice" style={{ color: 'var(--text-dark)' }}><i className="fas fa-print"></i></button>
                    <button onClick={() => handleSendWhatsApp(o)} className="header-icon" title="Send WhatsApp Update" style={{ color: '#25D366' }}><i className="fab fa-whatsapp"></i></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details / Status Edit Modal */}
      {selectedOrder && (
        <div className="admin-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="admin-modal-content" style={{ maxWidth: '600px', width: '90%', padding: '24px' }}>
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
