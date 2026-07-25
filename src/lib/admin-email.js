import { sendEmail } from '@/lib/email';
import { createAdminClient } from '@/lib/supabase/admin';

function getAdminEmail() {
  return process.env.ADMIN_EMAIL || process.env.CONTACT_EMAIL || process.env.SMTP_USER || 'anantarts39@gmail.com';
}

function formatINR(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(num);
}

/**
 * Log email notification attempts into DB without raising exceptions
 */
async function logNotificationResult(eventType, recipient, success, error = null, details = null) {
  try {
    const supabase = createAdminClient();
    // Try inserting into notification_logs or notifications table
    const logPayload = {
      event_type: eventType,
      recipient,
      status: success ? 'sent' : 'failed',
      error_message: error ? String(error).substring(0, 500) : null,
      details: details ? (typeof details === 'object' ? JSON.stringify(details) : String(details)) : null,
      created_at: new Date().toISOString()
    };

    const { error: logErr } = await supabase.from('notification_logs').insert(logPayload);
    if (logErr) {
      // Fallback to notifications table if notification_logs doesn't exist
      await supabase.from('notifications').insert({
        message: `[Email Alert ${success ? 'Sent' : 'Failed'}] ${eventType} to ${recipient}. ${error ? 'Error: ' + error : ''}`,
        is_read: 0,
        type: success ? 'info' : 'warning',
        link: '/admin/settings'
      }).catch(() => {});
    }
  } catch (err) {
    console.warn('[Admin Notification Logger Exception]:', err.message);
  }
}

/**
 * 1. Send Instant Admin New Order Notification Email
 */
export async function sendAdminNewOrderEmail(order, items = []) {
  try {
    if (!order) return;
    const adminEmail = getAdminEmail();
    const orderItems = items || order.items || [];
    const formattedDate = order.created_at
      ? new Date(order.created_at).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      : new Date().toLocaleString('en-IN');

    const subject = `🛍 New Order Received - Anant Arts`;

    const itemsHtml = orderItems.length > 0
      ? orderItems.map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #EAEAEA; font-size: 13px;"><strong>${item.product_name}</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #EAEAEA; font-size: 13px; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #EAEAEA; font-size: 13px; text-align: right;">${formatINR(item.price)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #EAEAEA; font-size: 13px; text-align: right;"><strong>${formatINR(item.total_price || (item.price * item.quantity))}</strong></td>
        </tr>
      `).join('')
      : `<tr><td colspan="4" style="padding: 10px; text-align: center; color: #777;">1 Sacred Sculpture Item</td></tr>`;

    const html = `
      <div style="background-color: #FAF7F2; padding: 16px; border-radius: 8px; border: 1px solid #EAE3D2; margin-bottom: 24px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8C2425; font-weight: 700;">🛍 Instant Order Alert</span>
        <h2 style="margin: 4px 0 0 0; font-size: 20px; color: #1C1C1C;">New Order #${order.order_number}</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Received on ${formattedDate}</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
        <div style="background: #FFFFFF; padding: 14px; border: 1px solid #EEE; border-radius: 6px; font-size: 13px;">
          <h4 style="margin: 0 0 8px 0; color: #8C2425; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Customer Details</h4>
          <strong>Name:</strong> ${order.customer_name}<br>
          <strong>Phone:</strong> ${order.customer_phone}<br>
          <strong>Email:</strong> ${order.customer_email}
        </div>
        <div style="background: #FFFFFF; padding: 14px; border: 1px solid #EEE; border-radius: 6px; font-size: 13px;">
          <h4 style="margin: 0 0 8px 0; color: #8C2425; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Transaction Details</h4>
          <strong>Amount:</strong> ${formatINR(order.total_amount)}<br>
          <strong>Payment Mode:</strong> ${(order.payment_method || 'Online').toUpperCase()}<br>
          <strong>Payment Status:</strong> ${order.payment_status || 'Pending'}
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <h4 style="margin: 0 0 8px 0; color: #8C2425; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Shipping Address</h4>
        <div style="background: #FFFFFF; padding: 12px; border: 1px solid #EEE; border-radius: 6px; font-size: 13px; color: #333;">
          ${order.shipping_address}
        </div>
      </div>

      <h4 style="margin: 0 0 10px 0; color: #8C2425; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Products Ordered</h4>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
        <thead>
          <tr style="background: #8C2425; color: #FFFFFF;">
            <th style="padding: 10px; font-size: 12px; text-align: left;">Product</th>
            <th style="padding: 10px; font-size: 12px; text-align: center;">Qty</th>
            <th style="padding: 10px; font-size: 12px; text-align: right;">Price</th>
            <th style="padding: 10px; font-size: 12px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- View Order Action Button -->
      <div style="text-align: center; margin: 32px 0 16px 0;">
        <a href="https://anantarts.in/admin/orders" 
           style="display: inline-block; background-color: #8C2425; color: #FFFFFF; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(140, 36, 37, 0.3);">
          View Order in Admin Panel ➔
        </a>
      </div>
    `;

    const result = await sendEmail({
      to: adminEmail,
      subject,
      html,
      text: `New Order Received - Order #${order.order_number} for ${formatINR(order.total_amount)} by ${order.customer_name}. Phone: ${order.customer_phone}`
    });

    logNotificationResult('new_order_email', adminEmail, result.success, result.error, { order_number: order.order_number });
    return result;
  } catch (err) {
    console.error('[Admin Email Error] New Order Exception:', err.message);
    logNotificationResult('new_order_email', getAdminEmail(), false, err.message, { order_number: order?.order_number });
    return { success: false, error: err.message };
  }
}

/**
 * 2. Send Admin Low Stock Alert Email
 */
export async function sendAdminLowStockEmail({ productName, sku, stockQuantity }) {
  try {
    const adminEmail = getAdminEmail();
    const subject = `⚠️ Low Stock Alert - ${productName}`;

    const html = `
      <div style="background-color: #FFF3E0; padding: 16px; border-radius: 8px; border: 1px solid #FFE082; margin-bottom: 20px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #E65100; font-weight: 700;">⚠️ Inventory Warning</span>
        <h2 style="margin: 4px 0 0 0; font-size: 20px; color: #C62828;">Low Stock Warning: ${productName}</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #555;">Inventory for this item is running low.</p>
      </div>

      <div style="background: #FFFFFF; padding: 16px; border: 1px solid #EEE; border-radius: 6px; font-size: 14px; margin-bottom: 24px;">
        <strong>Product Name:</strong> ${productName}<br>
        ${sku ? `<strong>SKU:</strong> ${sku}<br>` : ''}
        <strong>Remaining Stock:</strong> <span style="color: #C62828; font-weight: 800; font-size: 16px;">${stockQuantity} items left</span>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="https://anantarts.in/admin/products" 
           style="display: inline-block; background-color: #D4AF37; color: #111111; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">
          Update Inventory in Admin Panel ➔
        </a>
      </div>
    `;

    const result = await sendEmail({
      to: adminEmail,
      subject,
      html,
      text: `Low Stock Warning: Product "${productName}" is down to ${stockQuantity} items.`
    });

    logNotificationResult('low_stock_email', adminEmail, result.success, result.error, { productName, stockQuantity });
    return result;
  } catch (err) {
    console.error('[Admin Email Error] Low Stock Exception:', err.message);
    logNotificationResult('low_stock_email', getAdminEmail(), false, err.message, { productName });
    return { success: false, error: err.message };
  }
}

/**
 * 3. Send Admin Failed Payment Alert Email
 */
export async function sendAdminFailedPaymentEmail({ orderNumber, customerName, amount, errorReason }) {
  try {
    const adminEmail = getAdminEmail();
    const subject = `❌ Failed Payment Alert - Order #${orderNumber || 'N/A'}`;

    const html = `
      <div style="background-color: #FFEBEE; padding: 16px; border-radius: 8px; border: 1px solid #FFCDD2; margin-bottom: 20px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #C62828; font-weight: 700;">❌ Payment Error</span>
        <h2 style="margin: 4px 0 0 0; font-size: 20px; color: #C62828;">Payment Attempt Failed</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #555;">Order #${orderNumber || 'Unassigned'}</p>
      </div>

      <div style="background: #FFFFFF; padding: 16px; border: 1px solid #EEE; border-radius: 6px; font-size: 13px; margin-bottom: 24px;">
        <strong>Customer:</strong> ${customerName || 'Customer'}<br>
        <strong>Amount:</strong> ${formatINR(amount || 0)}<br>
        <strong>Failure Reason:</strong> <span style="color: #C62828;">${errorReason || 'Transaction rejected or timed out.'}</span>
      </div>

      <div style="text-align: center;">
        <a href="https://anantarts.in/admin/orders" 
           style="display: inline-block; background-color: #8C2425; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">
          View Orders Log ➔
        </a>
      </div>
    `;

    const result = await sendEmail({
      to: adminEmail,
      subject,
      html,
      text: `Failed Payment Alert - Order #${orderNumber || 'N/A'} of ${formatINR(amount || 0)} failed. Reason: ${errorReason}`
    });

    logNotificationResult('failed_payment_email', adminEmail, result.success, result.error, { orderNumber, errorReason });
    return result;
  } catch (err) {
    console.error('[Admin Email Error] Failed Payment Exception:', err.message);
    logNotificationResult('failed_payment_email', getAdminEmail(), false, err.message, { orderNumber });
    return { success: false, error: err.message };
  }
}

/**
 * 4. Send Admin Refund Request Alert Email
 */
export async function sendAdminRefundEmail({ orderNumber, customerName, amount, reason }) {
  try {
    const adminEmail = getAdminEmail();
    const subject = `💸 Refund Request - Order #${orderNumber}`;

    const html = `
      <div style="background-color: #F3E5F5; padding: 16px; border-radius: 8px; border: 1px solid #E1BEE7; margin-bottom: 20px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #7B1FA2; font-weight: 700;">💸 Refund Processed</span>
        <h2 style="margin: 4px 0 0 0; font-size: 20px; color: #7B1FA2;">Refund Triggered for Order #${orderNumber}</h2>
      </div>

      <div style="background: #FFFFFF; padding: 16px; border: 1px solid #EEE; border-radius: 6px; font-size: 13px; margin-bottom: 24px;">
        <strong>Customer:</strong> ${customerName || 'Valued Patron'}<br>
        <strong>Refund Amount:</strong> ${formatINR(amount)}<br>
        <strong>Reason:</strong> ${reason || 'Customer or Admin initiated refund.'}
      </div>

      <div style="text-align: center;">
        <a href="https://anantarts.in/admin/orders" 
           style="display: inline-block; background-color: #8C2425; color: #FFFFFF; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">
          View Refunded Orders ➔
        </a>
      </div>
    `;

    const result = await sendEmail({
      to: adminEmail,
      subject,
      html,
      text: `Refund Processed - Order #${orderNumber} for ${formatINR(amount)}. Reason: ${reason}`
    });

    logNotificationResult('refund_request_email', adminEmail, result.success, result.error, { orderNumber, amount });
    return result;
  } catch (err) {
    console.error('[Admin Email Error] Refund Exception:', err.message);
    logNotificationResult('refund_request_email', getAdminEmail(), false, err.message, { orderNumber });
    return { success: false, error: err.message };
  }
}

/**
 * 5. Send Order Cancellation Email to Customer & Admin
 */
export async function sendOrderCancellationEmails({ order, reason, cancelledBy = 'CUSTOMER' }) {
  try {
    if (!order) return;
    const adminEmail = getAdminEmail();
    const customerEmail = order.customer_email;
    const orderNumber = order.order_number || order.id;
    const amount = order.total_amount || 0;
    const customerName = order.customer_name || 'Valued Customer';

    // 1. Email to Customer
    if (customerEmail) {
      const customerSubject = `Order #${orderNumber} Cancellation Confirmation - Anant Arts`;
      const customerHtml = `
        <div style="background-color: #FFEBEE; padding: 16px; border-radius: 8px; border: 1px solid #FFCDD2; margin-bottom: 24px;">
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #C62828; font-weight: 700;">🔴 Order Cancelled</span>
          <h2 style="margin: 4px 0 0 0; font-size: 20px; color: #1C1C1C;">Order #${orderNumber} Has Been Cancelled</h2>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Cancelled by ${cancelledBy === 'CUSTOMER' ? 'You' : 'Store Administrator'}</p>
        </div>

        <div style="background: #FFFFFF; padding: 16px; border: 1px solid #EEE; border-radius: 6px; font-size: 13px; margin-bottom: 24px;">
          <h4 style="margin: 0 0 10px 0; color: #C62828; font-size: 12px; text-transform: uppercase;">Cancellation Details</h4>
          <strong>Order ID:</strong> #${orderNumber}<br>
          <strong>Customer Name:</strong> ${customerName}<br>
          <strong>Total Amount:</strong> ${formatINR(amount)}<br>
          <strong>Reason:</strong> ${reason || 'Not specified'}<br>
          <strong>Payment Mode:</strong> ${(order.payment_method || 'Online').toUpperCase()}<br>
          <strong>Refund Status:</strong> ${order.payment_status === 'Paid' || order.payment_status === 'Captured' ? 'Refund Pending (Admin will review and process)' : 'N/A (No charge or COD)'}
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <a href="https://anantarts.in/order-tracking?order=${orderNumber}" 
             style="display: inline-block; background-color: #D4AF37; color: #FFFFFF; padding: 10px 22px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">
            View Order Status ➔
          </a>
        </div>
      `;

      sendEmail({
        to: customerEmail,
        subject: customerSubject,
        html: customerHtml,
        text: `Your Order #${orderNumber} of ${formatINR(amount)} has been cancelled. Reason: ${reason}`
      }).catch(e => console.error('[Order Cancellation Email Customer Error]:', e));
    }

    // 2. Email to Admin
    const adminSubject = `🔴 Order #${orderNumber} Cancelled by ${cancelledBy}`;
    const adminHtml = `
      <div style="background-color: #FFEBEE; padding: 16px; border-radius: 8px; border: 1px solid #FFCDD2; margin-bottom: 24px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #C62828; font-weight: 700;">🔴 Admin Alert: Order Cancelled</span>
        <h2 style="margin: 4px 0 0 0; font-size: 20px; color: #1C1C1C;">Order #${orderNumber} Cancelled</h2>
      </div>

      <div style="background: #FFFFFF; padding: 16px; border: 1px solid #EEE; border-radius: 6px; font-size: 13px; margin-bottom: 24px;">
        <strong>Order ID:</strong> #${orderNumber}<br>
        <strong>Customer:</strong> ${customerName} (${order.customer_email || 'N/A'}, ${order.customer_phone || 'N/A'})<br>
        <strong>Amount:</strong> ${formatINR(amount)}<br>
        <strong>Cancelled By:</strong> ${cancelledBy}<br>
        <strong>Cancellation Reason:</strong> <span style="color: #C62828; font-weight: bold;">${reason || 'No reason provided'}</span><br>
        <strong>Payment Mode:</strong> ${(order.payment_method || 'Online').toUpperCase()} (${order.payment_status || 'Pending'})
      </div>

      <div style="text-align: center;">
        <a href="https://anantarts.in/admin/delivery" 
           style="display: inline-block; background-color: #8C2425; color: #FFFFFF; padding: 10px 22px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px;">
          Manage Orders &amp; Delivery Console ➔
        </a>
      </div>
    `;

    const adminResult = await sendEmail({
      to: adminEmail,
      subject: adminSubject,
      html: adminHtml,
      text: `Order #${orderNumber} was cancelled by ${cancelledBy}. Amount: ${formatINR(amount)}. Reason: ${reason}`
    });

    logNotificationResult('order_cancelled_email', adminEmail, adminResult.success, adminResult.error, { orderNumber, reason });
    return adminResult;
  } catch (err) {
    console.error('[Admin Email Error] Order Cancellation Email Exception:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 6. Send Delivery Status Update Email to Customer
 */
export async function sendDeliveryStatusEmail({ order, status, trackingNumber, courierName, estimatedDelivery, notes, items = [] }) {
  try {
    if (!order || !order.customer_email) return { success: false, error: 'No order or customer email' };
    const orderNumber = order.order_number || order.id;
    const customerName = order.customer_name || 'Valued Customer';
    const orderItems = items.length > 0 ? items : (order.order_items || order.items || []);

    const statusIcons = {
      'Packed': '📦',
      'Shipped': '🚚',
      'Out For Delivery': '🚛',
      'Out for Delivery': '🚛',
      'Delivered': '✅',
      'Cancelled': '🔴',
      'Returned': '↩️',
      'In Transit': '🛣'
    };
    const icon = statusIcons[status] || '📦';
    const subject = `${icon} Order #${orderNumber} Update: ${status}`;

    const itemsHtml = orderItems.length > 0
      ? orderItems.map(item => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #EEE; font-size: 13px;">${item.product_name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #EEE; font-size: 13px; text-align: center;">x${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #EEE; font-size: 13px; text-align: right;">${formatINR(item.total_price || (item.price * item.quantity))}</td>
        </tr>
      `).join('')
      : `<tr><td colspan="3" style="padding: 8px; text-align: center; color: #777;">Order Items</td></tr>`;

    const html = `
      <div style="background-color: #FAF7F2; padding: 16px; border-radius: 8px; border: 1px solid #EAE3D2; margin-bottom: 24px;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #D4AF37; font-weight: 700;">${icon} Delivery Progress</span>
        <h2 style="margin: 4px 0 0 0; font-size: 20px; color: #1C1C1C;">Order Status: ${status}</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Order #${orderNumber}</p>
      </div>

      ${notes ? `
        <div style="background: #FFFDE7; border-left: 4px solid #FBC02D; padding: 12px; font-size: 13px; margin-bottom: 20px; color: #444;">
          <strong>Update Note:</strong> ${notes}
        </div>
      ` : ''}

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
        <div style="background: #FFFFFF; padding: 12px; border: 1px solid #EEE; border-radius: 6px; font-size: 12px;">
          <strong>Courier Partner:</strong> ${courierName || order.courier_name || 'Express Logistics'}<br>
          <strong>Tracking / AWB Number:</strong> <span style="color: #D4AF37; font-weight: bold;">${trackingNumber || order.tracking_number || 'Assigned upon dispatch'}</span>
        </div>
        <div style="background: #FFFFFF; padding: 12px; border: 1px solid #EEE; border-radius: 6px; font-size: 12px;">
          <strong>Expected Delivery:</strong> ${estimatedDelivery || order.estimated_delivery || '3-7 Business Days'}<br>
          <strong>Recipient:</strong> ${customerName}
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <h4 style="margin: 0 0 10px 0; color: #333; font-size: 13px; text-transform: uppercase;">Items in Package</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #F9F9F9; color: #666; font-size: 11px; text-transform: uppercase;">
              <th style="padding: 6px; text-align: left;">Product</th>
              <th style="padding: 6px; text-align: center;">Qty</th>
              <th style="padding: 6px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <a href="https://anantarts.in/order-tracking?order=${orderNumber}" 
           style="display: inline-block; background-color: #D4AF37; color: #FFFFFF; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
          Track Live Shipment Status ➔
        </a>
      </div>
    `;

    const result = await sendEmail({
      to: order.customer_email,
      subject,
      html,
      text: `Order #${orderNumber} status update: ${status}. Tracking No: ${trackingNumber || order.tracking_number || 'N/A'}. Track live at: https://anantarts.in/order-tracking?order=${orderNumber}`
    });

    logNotificationResult('delivery_status_email', order.customer_email, result.success, result.error, { orderNumber, status });
    return result;
  } catch (err) {
    console.error('[Admin Email Error] Delivery Status Email Exception:', err.message);
    return { success: false, error: err.message };
  }
}

