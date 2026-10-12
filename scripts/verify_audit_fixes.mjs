import crypto from 'crypto';
import assert from 'assert';

console.log('🧪 Starting Antigravity Security & Logic Verification Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

// ============================================================================
// 1. Amount Validation & Conversion Tests
// ============================================================================
function validateAndConvertAmount(amount) {
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
  return { amountInRupees: numAmount, amountInPaise };
}

console.log('--- 1. Amount Validation & Conversion Tests ---');

test('Valid integer rupee amounts convert to exact paise', () => {
  const result = validateAndConvertAmount(1500);
  assert.strictEqual(result.amountInRupees, 1500);
  assert.strictEqual(result.amountInPaise, 150000);
});

test('Valid fractional rupee amounts round accurately without floating-point errors', () => {
  const result = validateAndConvertAmount('2499.50');
  assert.strictEqual(result.amountInRupees, 2499.5);
  assert.strictEqual(result.amountInPaise, 249950);
});

test('Zero and negative amounts throw errors', () => {
  assert.throws(() => validateAndConvertAmount(0), /greater than zero/);
  assert.throws(() => validateAndConvertAmount(-100), /greater than zero/);
});

test('Malformed and non-numeric inputs throw errors', () => {
  assert.throws(() => validateAndConvertAmount('abc'), /Invalid numeric amount/);
  assert.throws(() => validateAndConvertAmount(null), /missing/);
  assert.throws(() => validateAndConvertAmount(undefined), /missing/);
});

// ============================================================================
// 2. Razorpay HMAC SHA256 Signature Verification Tests
// ============================================================================
function verifySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }, keySecret) {
  if (!keySecret) return false;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return false;

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

console.log('\n--- 2. HMAC Signature Verification Tests ---');

const testSecret = 'secret_test_key_xyz123';
const orderId = 'order_DA1234567890';
const paymentId = 'pay_BC0987654321';
const validSig = crypto
  .createHmac('sha256', testSecret)
  .update(`${orderId}|${paymentId}`)
  .digest('hex');

test('Valid HMAC signature succeeds', () => {
  assert.strictEqual(verifySignature({
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: validSig
  }, testSecret), true);
});

test('Tampered payment ID or order ID fails signature verification', () => {
  assert.strictEqual(verifySignature({
    razorpay_order_id: 'order_TAMPERED',
    razorpay_payment_id: paymentId,
    razorpay_signature: validSig
  }, testSecret), false);

  assert.strictEqual(verifySignature({
    razorpay_order_id: orderId,
    razorpay_payment_id: 'pay_TAMPERED',
    razorpay_signature: validSig
  }, testSecret), false);
});

test('Missing key secret fails closed safely', () => {
  assert.strictEqual(verifySignature({
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: validSig
  }, ''), false);
});

test('Missing parameters fail closed safely', () => {
  assert.strictEqual(verifySignature({
    razorpay_order_id: '',
    razorpay_payment_id: paymentId,
    razorpay_signature: validSig
  }, testSecret), false);

  assert.strictEqual(verifySignature({
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: ''
  }, testSecret), false);
});

// ============================================================================
// 3. Webhook Raw Body HMAC Signature Verification Tests
// ============================================================================
function verifyWebhookSignature(bodyString, signature, webhookSecret) {
  if (!webhookSecret || !signature || !bodyString) return false;
  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
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

console.log('\n--- 3. Webhook Raw Body HMAC Verification Tests ---');

const webhookSecret = 'whsec_test_random_abc_789';
const webhookPayload = JSON.stringify({
  event: 'payment.captured',
  payload: {
    payment: {
      entity: {
        id: 'pay_998877',
        order_id: 'order_112233',
        amount: 500000,
        currency: 'INR',
        status: 'captured'
      }
    }
  }
});
const validWebhookSig = crypto
  .createHmac('sha256', webhookSecret)
  .update(webhookPayload)
  .digest('hex');

test('Valid webhook signature verifies correctly against raw body', () => {
  assert.strictEqual(verifyWebhookSignature(webhookPayload, validWebhookSig, webhookSecret), true);
});

test('Tampered raw body fails webhook verification', () => {
  const tamperedPayload = webhookPayload.replace('500000', '100');
  assert.strictEqual(verifyWebhookSignature(tamperedPayload, validWebhookSig, webhookSecret), false);
});

test('Missing webhook secret fails closed safely', () => {
  assert.strictEqual(verifyWebhookSignature(webhookPayload, validWebhookSig, null), false);
});

// ============================================================================
// 4. Contact Input Validation Tests (Anti-Harvesting / Exact Match)
// ============================================================================
console.log('\n--- 4. Contact Input Validation Tests ---');

function validateContactInput(input) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneDigits = (input || '').replace(/\D/g, '');
  const cleanPhone = phoneDigits.length === 12 && phoneDigits.startsWith('91')
    ? phoneDigits.slice(2)
    : phoneDigits;

  const isEmail = emailRegex.test(input);
  const isPhone = /^[6-9]\d{9}$/.test(cleanPhone);
  return { isEmail, isPhone, isValid: isEmail || isPhone, cleanPhone };
}

test('Valid email addresses pass validation', () => {
  assert.strictEqual(validateContactInput('customer@example.com').isValid, true);
  assert.strictEqual(validateContactInput('customer@example.com').isEmail, true);
});

test('Valid Indian 10-digit mobile numbers pass validation', () => {
  assert.strictEqual(validateContactInput('9876543210').isValid, true);
  assert.strictEqual(validateContactInput('+91 9876543210').isValid, true);
  assert.strictEqual(validateContactInput('+91 9876543210').cleanPhone, '9876543210');
});

test('Wildcards and partial inputs fail validation', () => {
  assert.strictEqual(validateContactInput('@').isValid, false);
  assert.strictEqual(validateContactInput('a').isValid, false);
  assert.strictEqual(validateContactInput('%admin%').isValid, false);
  assert.strictEqual(validateContactInput('12345').isValid, false);
});

// ============================================================================
// 5. Authoritative Shipping & Discount Recalculation Tests
// ============================================================================
console.log('\n--- 5. Authoritative Shipping & Discount Recalculation Tests ---');

function calculateTotals(subtotal, discount, threshold = 5000, flatFee = 150) {
  const netSubtotal = subtotal - discount;
  const shipping = netSubtotal >= threshold ? 0 : flatFee;
  const total = Math.round((subtotal - discount + shipping) * 100) / 100;
  return { netSubtotal, shipping, total };
}

test('Orders >= ₹5,000 qualify for free shipping', () => {
  const calc = calculateTotals(5200, 0);
  assert.strictEqual(calc.shipping, 0);
  assert.strictEqual(calc.total, 5200);
});

test('Orders < ₹5,000 incur flat ₹150 shipping fee', () => {
  const calc = calculateTotals(2400, 0);
  assert.strictEqual(calc.shipping, 150);
  assert.strictEqual(calc.total, 2550);
});

test('Discount reducing net subtotal below ₹5,000 triggers ₹150 shipping fee', () => {
  const calc = calculateTotals(5200, 500); // Net: 4700 < 5000
  assert.strictEqual(calc.shipping, 150);
  assert.strictEqual(calc.total, 4850);
});

test('Price tampering detection catches discrepancies > ₹1', () => {
  const authoritativeTotal = 4850;
  const clientTotal = 1; // Attacker changed total to ₹1
  const isTampered = Math.abs(clientTotal - authoritativeTotal) > 1;
  assert.strictEqual(isTampered, true);
});

console.log(`\n🎉 Verification Test Suite Completed: ${passedTests}/${totalTests} Tests Passed.\n`);
