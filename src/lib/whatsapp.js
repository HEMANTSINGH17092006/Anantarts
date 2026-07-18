import { createAdminClient } from './supabase/admin';

/**
 * Sends a WhatsApp text message using the Meta Cloud API.
 * Includes a basic retry mechanism.
 */
async function sendWhatsAppMessage(to, messageBody, retries = 1) {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    throw new Error('WhatsApp API credentials are not configured in environment variables.');
  }

  const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: to,
    type: 'text',
    text: { body: messageBody }
  };

  let attempt = 0;
  while (attempt <= retries) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, data };
      } else {
        throw new Error(data?.error?.message || 'Unknown WhatsApp API error');
      }
    } catch (err) {
      attempt++;
      if (attempt > retries) {
        return { success: false, error: err.message };
      }
      // Small delay before retry
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

/**
 * Parses the template, replacing placeholders with order data.
 */
function parseTemplate(template, data) {
  let parsed = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    parsed = parsed.replace(regex, value || '');
  }
  return parsed;
}

/**
 * Main function to notify admin of a new order.
 * This should be called from the order creation route.
 */
export async function sendAdminOrderNotification(order, items, settings) {
  try {
    const isEnabled = settings.whatsapp_notifications_enabled === '1';
    const adminNumber = settings.whatsapp_admin_number;
    let template = settings.whatsapp_message_template;

    if (!isEnabled || !adminNumber || !template) {
      return; // Not configured or disabled
    }

    // Format products list
    const productListStr = items.map((item, index) => {
      return `${index + 1}. ${item.product_name} × ${item.quantity}`;
    }).join('\n');

    // Prepare template data
    const templateData = {
      order_id: order.order_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email,
      product_list: productListStr,
      order_total: order.total_amount,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      full_address: order.shipping_address,
      order_date: new Date(order.created_at || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      admin_order_link: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/orders`
    };

    const finalMessage = parseTemplate(template, templateData);

    // Ensure country code is present. Standardize slightly (assuming Indian numbers usually if 10 digits).
    let toNum = adminNumber.replace(/\D/g, '');
    if (toNum.length === 10) toNum = '91' + toNum; // Default to India if only 10 digits

    // Log attempt as Retrying (Initial)
    const supabase = createAdminClient();
    const { data: logEntry } = await supabase.from('whatsapp_logs').insert({
      order_number: order.order_number,
      phone_number: toNum,
      status: 'Retrying',
      message: finalMessage
    }).select('id').single();

    // Send via API
    const result = await sendWhatsAppMessage(toNum, finalMessage, 1);

    // Update log status
    if (logEntry) {
      await supabase.from('whatsapp_logs').update({
        status: result.success ? 'Sent' : 'Failed',
        message: result.success ? finalMessage : `ERROR: ${result.error}\n\n${finalMessage}`
      }).eq('id', logEntry.id);
    }

    return result;
  } catch (err) {
    console.error('Failed to send admin WhatsApp notification:', err);
  }
}
