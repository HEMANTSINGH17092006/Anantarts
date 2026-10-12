import Razorpay from 'razorpay';
import crypto from 'crypto';
import { logPaymentEvent } from '@/lib/payment-logger';

/**
 * Dynamically resolves environment keys with Vercel deployment environment precedence.
 * - In Vercel environments: production mode is true only when VERCEL_ENV === 'production'.
 * - When VERCEL_ENV is absent: falls back to NODE_ENV === 'production'.
 * - Preview deployments accept explicitly configured test credentials.
 * - Production never silently substitutes a hardcoded live key.
 */
export function getRazorpayKeys() {
  const isProd = process.env.VERCEL_ENV
    ? process.env.VERCEL_ENV === 'production'
    : process.env.NODE_ENV === 'production';

  let keyId = '';
  let keySecret = '';

  if (isProd) {
    // PRODUCTION MODE:
    // Only live keys are permitted. Test keys and missing keys must fail closed.
    keyId = process.env.RAZORPAY_LIVE_KEY_ID || process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    keySecret = process.env.RAZORPAY_LIVE_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || '';

    if (keyId.startsWith('rzp_test_')) {
      console.error('[Razorpay Production Security] Test mode key detected in Production environment. Test keys are not permitted in production.');
      keyId = '';
    }
  } else {
    // PREVIEW / NON-PRODUCTION MODE:
    // Only test keys (rzp_test_...) are permitted.
    // Live keys from fallback variables (e.g. RAZORPAY_LIVE_KEY_ID or NEXT_PUBLIC_RAZORPAY_KEY_ID) are strictly prohibited.
    const candidateKeys = [
      process.env.RAZORPAY_TEST_KEY_ID,
      process.env.RAZORPAY_KEY_ID,
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    ].filter(Boolean);

    // Pick the first test key if available
    const testKey = candidateKeys.find(k => k.startsWith('rzp_test_'));
    if (testKey) {
      keyId = testKey;
    } else if (candidateKeys.length > 0) {
      // If candidate keys were provided but NONE are test keys (e.g. only live keys available in Preview)
      console.error('[Razorpay Preview Security] Live key detected in Preview/Development environment. Live keys are strictly prohibited in non-production environments.');
      keyId = '';
    }

    keySecret = process.env.RAZORPAY_TEST_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET || '';
  }

  return {
    keyId,
    keySecret,
    isProd,
    isTestMode: Boolean(keyId && keyId.startsWith('rzp_test_'))
  };
}

/**
 * Validates existence and presence of Razorpay Environment Variables
 */
export function validateCredentials() {
  const { keyId, keySecret, isProd, isTestMode } = getRazorpayKeys();
  const hasKeyId = Boolean(keyId && keyId.trim().length > 0);
  const hasKeySecret = Boolean(keySecret && keySecret.trim().length > 0);

  return {
    valid: hasKeyId && hasKeySecret,
    key_id: keyId,
    has_key_id: hasKeyId,
    has_key_secret: hasKeySecret,
    is_prod: isProd,
    is_test_mode: isTestMode,
    environment: process.env.NODE_ENV || 'development'
  };
}

/**
 * Strict Amount Validation & Conversion to Integer Paise
 */
export function validateAndConvertAmount(amount) {
  if (amount === undefined || amount === null) {
    throw new Error('Payment amount is missing.');
  }

  const numAmount = Number(amount);

  if (!isFinite(numAmount) || isNaN(numAmount)) {
    throw new Error(`Invalid numeric amount received: "${amount}".`);
  }

  if (numAmount <= 0) {
    throw new Error(`Payment amount must be greater than zero. Received: ₹${numAmount}`);
  }

  const amountInPaise = Math.round(numAmount * 100);
  if (amountInPaise <= 0 || isNaN(amountInPaise)) {
    throw new Error('Calculated paise amount is invalid.');
  }

  return {
    amountInRupees: numAmount,
    amountInPaise
  };
}

/**
 * Get configured Razorpay Instance
 */
export function getRazorpayClient() {
  const { keyId, keySecret } = getRazorpayKeys();
  if (!keyId || !keySecret) {
    throw new Error('[Razorpay Security Error] Cannot initialize Razorpay client: keyId or keySecret is missing.');
  }
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Creates official Razorpay order with auto-capture & fallback execution
 */
export async function createRazorpayOrder({ amount, currency = 'INR', receipt, notes = {}, customerInfo = {} }) {
  const creds = validateCredentials();
  const { keyId, keySecret } = getRazorpayKeys();
  
  console.log(`[Razorpay Order Init Request] Receipt: ${receipt}, Amount: ₹${amount}, Mode: ${creds.is_test_mode ? 'TEST' : 'LIVE'}`);

  // 1. Strict Amount Validation & Conversion
  const { amountInRupees, amountInPaise } = validateAndConvertAmount(amount);

  // If KEY_SECRET is not set in environment, fail closed with explicit security error
  if (!creds.has_key_secret) {
    const errorMsg = '[Razorpay Security Error] RAZORPAY_KEY_SECRET is not configured on the server. Refusing to create unverified order.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const options = {
    amount: amountInPaise,
    currency,
    receipt,
    notes,
    payment_capture: 1, // AUTO CAPTURE PAYMENT ON SUCCESSFUL AUTHORIZATION
  };

  const razorpay = getRazorpayClient();
  const maxAttempts = 3;
  let lastError = null;

  await logPaymentEvent({
    eventType: 'payment_attempt',
    orderNumber: receipt,
    amount: amountInRupees,
    status: 'info',
    customerInfo,
    rawPayload: { amountInPaise, currency, receipt }
  });

  // 2. Retry Loop (3 attempts)
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[Razorpay Order Creation] Attempt ${attempt}/${maxAttempts} for Receipt: ${receipt}, Amount: ₹${amountInRupees}...`);

      const order = await razorpay.orders.create(options);
      console.log(`[Razorpay Order Success] Order ID: ${order.id}, Status: ${order.status}, Amount: ₹${amountInRupees}`);

      await logPaymentEvent({
        eventType: 'order_creation',
        orderNumber: receipt,
        razorpayOrderId: order.id,
        amount: amountInRupees,
        status: 'success',
        customerInfo,
        rawPayload: order
      });

      return { success: true, order, key_id: keyId };
    } catch (err) {
      lastError = err;
      const errorMsg = err.error?.description || err.message || 'Razorpay Order API Error';
      console.error(`[Razorpay Attempt ${attempt}/${maxAttempts} Failed]:`, errorMsg, err);

      await logPaymentEvent({
        eventType: 'order_failure',
        orderNumber: receipt,
        amount: amountInRupees,
        status: 'warning',
        errorMessage: `Attempt ${attempt} failed: ${errorMsg}`,
        errorStack: err.stack,
        customerInfo
      });

      if (attempt < maxAttempts) {
        const backoffMs = attempt * 500;
        await new Promise((res) => setTimeout(res, backoffMs));
      }
    }
  }

  // If Razorpay API order endpoint fails after 3 retries, throw an explicit error!
  const finalErrorMsg = `[Razorpay Critical Error] Failed to create order after ${maxAttempts} attempts. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment variables.`;
  console.error(finalErrorMsg);
  
  throw new Error('Failed to initialize payment gateway order. Please check your network connection or choose Direct UPI QR.');
}

/**
 * Verifies Razorpay payment HMAC SHA256 signature
 */
export function verifySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const { keySecret } = getRazorpayKeys();

  if (!keySecret) {
    console.error('[Razorpay Security Error] Signature verification rejected: RAZORPAY_KEY_SECRET is missing from environment.');
    return false;
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    console.error('[Razorpay Security Error] Signature verification rejected: Missing required verification parameters.');
    return false;
  }

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  try {
    const a = Buffer.from(generatedSignature, 'utf8');
    const b = Buffer.from(razorpay_signature, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    return generatedSignature === razorpay_signature;
  }
}

/**
 * Direct REST API Layer 2 Verification:
 * Fetches payment details from Razorpay API to confirm payment ID is valid and status is captured/authorized/paid
 */
export async function verifyPaymentViaApi(paymentId) {
  if (!paymentId) return { verified: false, reason: 'Missing Payment ID' };

  try {
    const payment = await fetchPaymentDetails(paymentId);
    if (!payment) {
      return { verified: false, reason: 'Razorpay API returned null or credentials unconfigured for payment ID' };
    }

    const validStatuses = ['captured', 'authorized', 'paid'];
    const isVerified = validStatuses.includes(payment.status);

    return {
      verified: isVerified,
      status: payment.status,
      payment,
      reason: isVerified ? 'Verified via Razorpay API' : `Invalid status: ${payment.status}`
    };
  } catch (err) {
    console.error(`[Razorpay API Verification Exception ${paymentId}]:`, err.message);
    return { verified: false, reason: `Gateway verification failed: ${err.message}` };
  }
}

/**
 * Explicitly captures an authorized payment via Razorpay REST API
 */
export async function capturePayment(paymentId, amount, currency = 'INR') {
  const { keySecret } = getRazorpayKeys();

  if (!keySecret) {
    console.error('[Razorpay Security Error] Cannot capture payment without RAZORPAY_KEY_SECRET.');
    return { success: false, error: 'RAZORPAY_KEY_SECRET is not configured' };
  }

  try {
    const { amountInRupees, amountInPaise } = validateAndConvertAmount(amount);
    console.log(`[Razorpay] Explicitly capturing payment ${paymentId} for ₹${amountInRupees}...`);
    
    const razorpay = getRazorpayClient();
    const captureRes = await razorpay.payments.capture(paymentId, amountInPaise, currency);
    console.log(`[Razorpay] Payment ${paymentId} capture response status: ${captureRes.status}`);

    await logPaymentEvent({
      eventType: 'webhook_event',
      razorpayPaymentId: paymentId,
      amount: amountInRupees,
      status: 'success',
      rawPayload: captureRes
    });

    return { success: true, data: captureRes };
  } catch (err) {
    console.error(`[Razorpay Capture Error for ${paymentId}]:`, err);
    
    await logPaymentEvent({
      eventType: 'capture_failure',
      razorpayPaymentId: paymentId,
      amount: Number(amount) || null,
      status: 'error',
      errorMessage: err.message || err.error?.description,
      errorStack: err.stack
    });

    if (err && err.error && err.error.description && err.error.description.includes('already been captured')) {
      return { success: true, alreadyCaptured: true };
    }
    return { success: false, error: err.message || err };
  }
}

/**
 * Fetches current payment details from Razorpay
 */
export async function fetchPaymentDetails(paymentId) {
  const { keySecret } = getRazorpayKeys();
  if (!keySecret) {
    return null;
  }
  try {
    const razorpay = getRazorpayClient();
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (err) {
    console.error(`[Razorpay Fetch Payment Error ${paymentId}]:`, err);
    return null;
  }
}

/**
 * Verifies Webhook Signature header (x-razorpay-signature)
 */
export function verifyWebhookSignature(bodyString, signature, webhookSecret) {
  const secret = webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature || !bodyString) return false;

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(bodyString)
      .digest('hex');

    const a = Buffer.from(expectedSignature, 'utf8');
    const b = Buffer.from(signature, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (err) {
    return false;
  }
}

/**
 * Refunds a captured payment
 */
export async function refundPayment(paymentId, amount = null, notes = {}) {
  const { keySecret } = getRazorpayKeys();
  if (!keySecret) {
    throw new Error('RAZORPAY_KEY_SECRET is required to process refunds.');
  }

  try {
    const razorpay = getRazorpayClient();
    const options = { notes };
    if (amount) {
      const { amountInPaise } = validateAndConvertAmount(amount);
      options.amount = amountInPaise;
    }
    const refund = await razorpay.payments.refund(paymentId, options);
    console.log(`[Razorpay Refund] Successfully processed refund ${refund.id} for payment ${paymentId}`);
    return { success: true, refund };
  } catch (err) {
    console.error(`[Razorpay Refund Error for ${paymentId}]:`, err);
    return { success: false, message: err.message || 'Refund failed' };
  }
}
