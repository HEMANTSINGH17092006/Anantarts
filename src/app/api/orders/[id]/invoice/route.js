import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return new NextResponse('Order ID is required', { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch order by ID or order_number
    let { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', isNaN(id) ? -1 : parseInt(id, 10))
      .maybeSingle();

    if (!order) {
      // Try matching by order_number
      const { data: orderByNum } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', id)
        .maybeSingle();
      order = orderByNum;
    }

    if (!order) {
      return new NextResponse('Order not found', { status: 404 });
    }

    // Fetch order items
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    // Fetch store metadata settings
    const { data: settingsRows } = await supabase
      .from('website_settings')
      .select('*');

    const settings = {};
    if (settingsRows) {
      settingsRows.forEach(r => { settings[r.key] = r.value; });
    }

    const storeName = settings.store_name || 'ANANT ARTS';
    const storeTagline = settings.store_tagline || 'Divine Metal Craft & Idols Studio';
    const storeAddress = settings.contact_address || 'Bhoirwadi, Dombivli East, Maharashtra - 421201';
    const storeEmail = settings.contact_email || 'hemant4507vns@gmail.com';
    const storePhone = settings.contact_phone || '+91 72758 19354';
    const storeGstin = settings.gstin || '27AAAAA0000A1Z5';

    const formatINR = (num) => {
      const val = Number(num) || 0;
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
      }).format(val);
    };

    const orderItems = items || [];
    const subtotal = order.subtotal || orderItems.reduce((acc, item) => acc + (item.total_price || (item.price * item.quantity)), 0);
    const discount = order.discount_amount || 0;
    const shipping = order.shipping_charge === 0 ? 0 : (order.shipping_charge || 0);
    const totalAmount = order.total_amount || (subtotal - discount + shipping);

    // Estimate Tax component (e.g. 18% GST included in total)
    const taxableValue = totalAmount / 1.18;
    const totalGst = totalAmount - taxableValue;
    const cgst = totalGst / 2;
    const sgst = totalGst / 2;

    const formattedDate = order.created_at
      ? new Date(order.created_at).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : new Date().toLocaleDateString('en-IN');

    const url = new URL(request.url);
    const isDownload = url.searchParams.get('download') === '1';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice #${order.order_number} - ${storeName}</title>
  <style>
    :root {
      --primary: #8C2425;
      --gold: #D4AF37;
      --gold-light: #FAF7F2;
      --border: #EAE3D2;
      --text: #1C1C1C;
      --text-muted: #666666;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: var(--text);
      background-color: #F8F9FA;
      padding: 20px;
      line-height: 1.5;
    }
    .action-bar {
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #FFFFFF;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border: 1px solid var(--border);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      font-size: 0.88rem;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .btn-primary {
      background: var(--primary);
      color: #FFFFFF;
      border: none;
    }
    .btn-primary:hover { background: #6F1B1C; }
    .btn-outline {
      background: transparent;
      color: var(--text);
      border: 1px solid #CCC;
    }
    .btn-outline:hover { background: #F0F0F0; }

    .invoice-card {
      max-width: 800px;
      margin: 0 auto;
      background: #FFFFFF;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      border: 1px solid var(--border);
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid var(--gold);
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .brand-title {
      font-family: Georgia, serif;
      font-size: 26px;
      font-weight: bold;
      color: var(--primary);
      letter-spacing: 1px;
    }
    .brand-tagline {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .store-meta {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 6px;
      line-height: 1.4;
    }
    .invoice-badge {
      text-align: right;
    }
    .invoice-label {
      font-size: 22px;
      font-weight: 800;
      color: var(--gold);
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .order-num {
      font-size: 14px;
      font-weight: 700;
      color: var(--text);
      margin-top: 4px;
    }
    .order-date {
      font-size: 12px;
      color: var(--text-muted);
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 28px;
    }
    .info-box {
      background: var(--gold-light);
      padding: 16px 20px;
      border-radius: 8px;
      border: 1px solid var(--border);
      font-size: 13px;
    }
    .info-box h4 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--primary);
      margin-bottom: 8px;
    }

    table.invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    table.invoice-table th {
      background: var(--primary);
      color: #FFFFFF;
      padding: 10px 14px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: left;
    }
    table.invoice-table td {
      padding: 12px 14px;
      border-bottom: 1px solid #EAEAEA;
      font-size: 13px;
    }
    table.invoice-table tbody tr:nth-child(even) {
      background-color: #FAFAFA;
    }

    .summary-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 30px;
    }
    .summary-box {
      width: 320px;
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 16px;
      font-size: 13px;
      border-bottom: 1px solid #F0F0F0;
    }
    .summary-row.total-row {
      background: var(--primary);
      color: #FFFFFF;
      font-weight: 700;
      font-size: 15px;
      border-bottom: none;
    }

    .gst-note {
      font-size: 11px;
      color: var(--text-muted);
      background: #F4F4F4;
      padding: 8px 12px;
      border-radius: 4px;
      margin-top: 12px;
      text-align: right;
    }

    .footer-note {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px dashed var(--border);
      text-align: center;
      font-size: 11px;
      color: var(--text-muted);
      font-style: italic;
    }

    @media print {
      body { background: #FFFFFF; padding: 0; }
      .action-bar { display: none !important; }
      .invoice-card { box-shadow: none; border: none; padding: 0; }
    }
  </style>
</head>
<body>

  <div class="action-bar">
    <div style="font-weight: 600; font-size: 0.9rem; color: var(--primary);">
      📄 Tax Invoice - Order #${order.order_number}
    </div>
    <div style="display: flex; gap: 10px;">
      <button onclick="window.print()" class="btn btn-primary">
        🖨️ Print / Save PDF
      </button>
      <button onclick="window.close()" class="btn btn-outline">
        ✕ Close
      </button>
    </div>
  </div>

  <div class="invoice-card">
    <!-- Header -->
    <div class="header-row">
      <div>
        <div class="brand-title">${storeName}</div>
        <div class="brand-tagline">${storeTagline}</div>
        <div class="store-meta">
          ${storeAddress}<br>
          Email: ${storeEmail} | Phone: ${storePhone}<br>
          GSTIN: ${storeGstin}
        </div>
      </div>
      <div class="invoice-badge">
        <div class="invoice-label">Tax Invoice</div>
        <div class="order-num">Invoice #: INV-${order.order_number.replace(/^ANT-/, '')}</div>
        <div class="order-num">Order #: ${order.order_number}</div>
        <div class="order-date">Date: ${formattedDate}</div>
      </div>
    </div>

    <!-- Customer & Payment Meta -->
    <div class="grid-2">
      <div class="info-box">
        <h4>Billed &amp; Shipped To</h4>
        <strong>${order.customer_name || 'Valued Patron'}</strong><br>
        ${order.shipping_address || 'Address on file'}<br>
        Phone: ${order.customer_phone || 'N/A'}<br>
        Email: ${order.customer_email || 'N/A'}
      </div>
      <div class="info-box">
        <h4>Payment &amp; Transaction Details</h4>
        Payment Method: <strong>${(order.payment_method || 'Online').toUpperCase()}</strong><br>
        Payment Status: <strong>${order.payment_status || 'Paid'}</strong><br>
        Transaction Ref: <strong>${order.razorpay_payment_id || order.payment_id || 'N/A'}</strong><br>
        Order Status: <strong>${order.order_status || 'Confirmed'}</strong>
      </div>
    </div>

    <!-- Itemized Table -->
    <table class="invoice-table">
      <thead>
        <tr>
          <th>S.No</th>
          <th>Item Description</th>
          <th style="text-align: right;">Unit Price</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Total Amount</th>
        </tr>
      </thead>
      <tbody>
        ${orderItems.length > 0 ? orderItems.map((item, index) => `
          <tr>
            <td style="width: 40px;">${index + 1}</td>
            <td><strong>${item.product_name}</strong></td>
            <td style="text-align: right;">${formatINR(item.price)}</td>
            <td style="text-align: center;">${item.quantity}</td>
            <td style="text-align: right;">${formatINR(item.total_price || (item.price * item.quantity))}</td>
          </tr>
        `).join('') : `
          <tr>
            <td colspan="5" style="text-align: center; color: var(--text-muted);">Sacred Sculpture Selection (1 unit)</td>
          </tr>
        `}
      </tbody>
    </table>

    <!-- Financial Summary -->
    <div class="summary-section">
      <div class="summary-box">
        <div class="summary-row">
          <span>Subtotal:</span>
          <strong>${formatINR(subtotal)}</strong>
        </div>
        ${discount > 0 ? `
          <div class="summary-row" style="color: #2E7D32;">
            <span>Coupon Discount:</span>
            <strong>-${formatINR(discount)}</strong>
          </div>
        ` : ''}
        <div class="summary-row">
          <span>Shipping Charge:</span>
          <strong>${shipping === 0 ? 'FREE' : formatINR(shipping)}</strong>
        </div>
        <div class="summary-row total-row">
          <span>Grand Total:</span>
          <span>${formatINR(totalAmount)}</span>
        </div>
      </div>
    </div>

    <div class="gst-note">
      * Price includes GST (CGST: ${formatINR(cgst)} | SGST: ${formatINR(sgst)})
    </div>

    <!-- Footer Note -->
    <div class="footer-note">
      Thank you for choosing ${storeName} to bring spiritual elegance into your home.<br>
      This is a computer-generated Tax Invoice and requires no physical signature.
    </div>
  </div>

</body>
</html>`;

    const headers = new Headers();
    headers.set('Content-Type', 'text/html; charset=utf-8');
    if (isDownload) {
      headers.set('Content-Disposition', `attachment; filename="Invoice-${order.order_number}.html"`);
    } else {
      headers.set('Content-Disposition', `inline; filename="Invoice-${order.order_number}.html"`);
    }

    return new NextResponse(htmlContent, { status: 200, headers });
  } catch (err) {
    console.error('Invoice Generation Error:', err);
    return new NextResponse('Failed to generate invoice.', { status: 500 });
  }
}
