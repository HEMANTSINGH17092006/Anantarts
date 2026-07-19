import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Enterprise Payment Logging Utility
 * Stores payment attempts, order creation status, capture results, and errors.
 */
export async function logPaymentEvent({
  eventType, // 'payment_attempt' | 'order_creation' | 'order_failure' | 'capture_failure' | 'webhook_event' | 'health_check'
  orderNumber = null,
  razorpayOrderId = null,
  razorpayPaymentId = null,
  amount = null,
  status = 'info', // 'info' | 'success' | 'warning' | 'error'
  errorMessage = null,
  errorStack = null,
  customerInfo = null,
  rawPayload = null
}) {
  const timestamp = new Date().toISOString();
  
  // Format console log for real-time terminal & server debugging
  const logPrefix = `[PaymentLog][${eventType.toUpperCase()}][${status.toUpperCase()}]`;
  if (status === 'error') {
    console.error(`${logPrefix} Order: ${orderNumber || 'N/A'}, Error: ${errorMessage}`, errorStack || '');
  } else {
    console.log(`${logPrefix} Order: ${orderNumber || 'N/A'}, Amount: ₹${amount || 0}, Status: ${status}`);
  }

  try {
    const supabase = createAdminClient();
    
    const logData = {
      event_type: eventType,
      order_number: orderNumber,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      amount: amount ? Number(amount) : null,
      status: status,
      error_message: errorMessage ? String(errorMessage).substring(0, 1000) : null,
      error_stack: errorStack ? String(errorStack).substring(0, 2000) : null,
      customer_info: customerInfo ? (typeof customerInfo === 'object' ? JSON.stringify(customerInfo) : String(customerInfo)) : null,
      raw_payload: rawPayload ? (typeof rawPayload === 'object' ? JSON.stringify(rawPayload) : String(rawPayload)) : null,
      created_at: timestamp
    };

    const { error } = await supabase.from('payment_logs').insert(logData);
    if (error) {
      console.warn('[Payment Logger DB Warning] Could not persist log to payment_logs table:', error.message);
    }
  } catch (err) {
    console.error('[Payment Logger System Exception]:', err.message);
  }
}
