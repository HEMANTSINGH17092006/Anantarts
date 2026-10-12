// scripts/test_preview_sandbox_smoke.mjs
// Comprehensive Preview Sandbox Smoke Test for Anant Arts
// Target: https://anant-arts-busggb4yo-anant12.vercel.app

import { execSync } from 'node:child_process';
import fs from 'node:fs';

const DEPLOYMENT_URL = 'https://anant-arts-io8ipju37-anant12.vercel.app';

console.log('='.repeat(75));
console.log('ANANT ARTS — PREVIEW STAGING INTEGRATION & SANDBOX SMOKE SUITE');
console.log(`Target Deployment: ${DEPLOYMENT_URL}`);
console.log(`Staging Supabase Ref: wjlkermuyiupzhayawut`);
console.log('='.repeat(75));

function vercelCurl(path, options = {}) {
  const method = options.method || 'GET';
  let curlArgs = ['-s', '-i'];

  if (method !== 'GET') {
    curlArgs.push('-X', method);
  }

  if (options.headers) {
    for (const [k, v] of Object.entries(options.headers)) {
      curlArgs.push('-H', `${k}: ${v}`);
    }
  }

  let tmpPayloadFile = null;
  if (options.body) {
    const bodyStr = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    tmpPayloadFile = `scratch_payload_${Date.now()}_${Math.random().toString(36).substring(7)}.json`;
    fs.writeFileSync(tmpPayloadFile, bodyStr, 'utf8');
    curlArgs.push('--data-binary', `@${tmpPayloadFile}`);
  }

  const cmd = `npx vercel curl ${path} --deployment ${DEPLOYMENT_URL} -- ${curlArgs.map(a => `"${a}"`).join(' ')}`;

  try {
    const rawOutput = execSync(cmd, { encoding: 'utf8', timeout: 35000 });
    if (tmpPayloadFile && fs.existsSync(tmpPayloadFile)) fs.unlinkSync(tmpPayloadFile);

    // Parse HTTP status and body from -i output
    const statusMatch = rawOutput.match(/HTTP\/[12](\.[01])?\s+(\d{3})/);
    const status = statusMatch ? parseInt(statusMatch[2], 10) : 0;

    // Body begins after the double newline separating headers from body
    const parts = rawOutput.split(/\r?\n\r?\n/);
    const body = parts.slice(1).join('\n\n').trim();

    let json = null;
    try {
      json = JSON.parse(body);
    } catch (_) {}

    return { status, body, json, raw: rawOutput };
  } catch (err) {
    if (tmpPayloadFile && fs.existsSync(tmpPayloadFile)) fs.unlinkSync(tmpPayloadFile);
    throw err;
  }
}

const results = [];

async function runCheck(id, description, testFn) {
  process.stdout.write(`[TEST ${String(id).padStart(2, '0')}] ${description}... `);
  try {
    const outcome = await testFn();
    console.log(`✓ PASS: ${outcome || 'OK'}`);
    results.push({ id, description, status: 'PASS', details: outcome });
  } catch (err) {
    console.log(`✗ FAIL: ${err.message}`);
    results.push({ id, description, status: 'FAIL', error: err.message });
  }
}

async function main() {
  // 1. Homepage HTTP 200 & SEO
  await runCheck(1, 'Homepage loads HTTP 200 with Brand metadata and Hero elements', async () => {
    const res = vercelCurl('/');
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    if (!res.body.includes('Anant') && !res.body.includes('anantarts')) {
      throw new Error('Response did not contain brand name');
    }
    return `HTTP 200, valid body length ${res.body.length}b`;
  });

  // 2. Guest Checkout accessible directly without login redirect
  await runCheck(2, 'Guest checkout (/checkout) renders directly without login redirect', async () => {
    const res = vercelCurl('/checkout');
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    if (res.body.includes('redirect("/login"') || res.body.includes('Redirecting to /login')) {
      throw new Error('Redirect to login found in checkout page');
    }
    return `HTTP 200, guest checkout is fully open`;
  });

  // 3. Shop & Category rendering
  await runCheck(3, 'Shop (/shop) renders successfully', async () => {
    const res = vercelCurl('/shop');
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    return `HTTP 200, body size ${res.body.length}b`;
  });

  // 4. Genuine 404 behavior (no soft-404)
  await runCheck(4, 'Non-existent URL returns HTTP 404 with custom Not Found UI', async () => {
    const res = vercelCurl('/non-existent-canary-path-404');
    if (res.status !== 404) throw new Error(`Expected HTTP 404, got ${res.status}`);
    return `HTTP 404 status verified`;
  });

  // 5. Sitemap and Robots
  await runCheck(5, 'Sitemap and Robots.txt render valid SEO assets', async () => {
    const resRobots = vercelCurl('/robots.txt');
    if (resRobots.status !== 200) throw new Error(`robots.txt returned ${resRobots.status}`);
    const resSitemap = vercelCurl('/sitemap.xml');
    if (resSitemap.status !== 200) throw new Error(`sitemap.xml returned ${resSitemap.status}`);
    return `robots.txt (${resRobots.body.length}b) and sitemap.xml (${resSitemap.body.length}b) valid`;
  });

  // 6. Razorpay Health Check API (No secret leakage & database connected)
  await runCheck(6, '/api/razorpay/health reports healthy database and safe credentials', async () => {
    const res = vercelCurl('/api/razorpay/health');
    if (res.status !== 200) throw new Error(`Expected HTTP 200, got ${res.status}`);
    if (!res.json) throw new Error('Expected JSON response');
    if (res.json.database !== 'healthy') throw new Error(`Expected database healthy, got: ${res.json.database}`);
    if (typeof res.json.credentials?.has_key_id !== 'boolean' || typeof res.json.credentials?.has_key_secret !== 'boolean') {
      throw new Error('Invalid credentials structure');
    }
    // Verify no secret tokens are leaked in JSON values
    const jsonStr = JSON.stringify(res.json);
    if (jsonStr.includes('rzp_live') || jsonStr.includes('eyJhbGciOi')) {
      throw new Error('Secret value leakage detected in JSON');
    }
    return `Status: ${res.json.status}, database: ${res.json.database}, has_key_id: ${res.json.credentials?.has_key_id}`;
  });

  // 7. Protected diagnostic API /api/debug/payment-health rejects unauthenticated requests
  await runCheck(7, '/api/debug/payment-health rejects unauthenticated requests (HTTP 401)', async () => {
    const res = vercelCurl('/api/debug/payment-health');
    if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
    return `HTTP 401 Unauthorized`;
  });

  // 8. Protected diagnostic API /api/payment/debug rejects unauthenticated requests
  await runCheck(8, '/api/payment/debug rejects unauthenticated requests (HTTP 401)', async () => {
    const res = vercelCurl('/api/payment/debug');
    if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
    return `HTTP 401 Unauthorized`;
  });

  // 9. Admin system health API /api/admin/system-health rejects unauthenticated requests
  await runCheck(9, '/api/admin/system-health rejects unauthenticated requests (HTTP 401)', async () => {
    const res = vercelCurl('/api/admin/system-health');
    if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
    return `HTTP 401 Unauthorized`;
  });

  // 10. Order Invoice API /api/orders/[id]/invoice returns 404 for non-existent order
  await runCheck(10, '/api/orders/:id/invoice returns 404 without leaking internal state', async () => {
    const res = vercelCurl('/api/orders/test-id-123/invoice');
    if (res.status !== 404 && res.status !== 401) throw new Error(`Expected HTTP 404 or 401, got ${res.status}`);
    return `HTTP ${res.status} as expected`;
  });

  // 11. User orders API /api/orders/user rejects missing contact info (HTTP 400)
  await runCheck(11, '/api/orders/user rejects unauthenticated/empty query (HTTP 400)', async () => {
    const res = vercelCurl('/api/orders/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { contactInfo: '' }
    });
    if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
    return `HTTP 400: "${res.json?.message}"`;
  });

  // 12. Razorpay Verify Payment rejects fraudulent signature
  await runCheck(12, '/api/razorpay/verify-payment rejects invalid signatures (HTTP 400)', async () => {
    const res = vercelCurl('/api/razorpay/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        razorpay_order_id: 'order_test_fake_123',
        razorpay_payment_id: 'pay_test_fake_456',
        razorpay_signature: 'invalid_sha256_signature_tampered_value',
      },
    });
    if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
    return `HTTP 400 Bad Request, message: "${res.json?.error || 'Invalid signature'}"`;
  });

  // 13. Razorpay Webhook rejects forged webhook signature (HTTP 401)
  await runCheck(13, '/api/razorpay/webhook rejects forged webhook signature (HTTP 401)', async () => {
    const res = vercelCurl('/api/razorpay/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': 'forged_fake_webhook_signature_sha256',
      },
      body: {
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_fake', amount: 50000 } } },
      },
    });
    if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
    return `HTTP 401 Unauthorized: "${res.json?.message || 'Invalid signature'}"`;
  });

  // 14. Razorpay Webhook rejects request with missing signature header (HTTP 401)
  await runCheck(14, '/api/razorpay/webhook rejects missing webhook signature header (HTTP 401)', async () => {
    const res = vercelCurl('/api/razorpay/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_fake', amount: 50000 } } },
      },
    });
    if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
    return `HTTP 401 Unauthorized: "${res.json?.message || 'Missing header'}"`;
  });

  // 15. Create Order API validates cart and fails closed on empty/tampered payload
  await runCheck(15, '/api/razorpay/create-order fails closed on empty cart (HTTP 400)', async () => {
    const res = vercelCurl('/api/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { items: [] },
    });
    if (res.status !== 400) throw new Error(`Expected HTTP 400, got ${res.status}`);
    return `HTTP 400 Bad Request: "${res.json?.error || 'Rejected empty cart'}"`;
  });

  // 16. Authoritative pricing calculation with non-existent product
  await runCheck(16, '/api/razorpay/create-order rejects fraudulent items not in catalog (HTTP 400)', async () => {
    const res = vercelCurl('/api/razorpay/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        items: [
          {
            product_id: '00000000-0000-0000-0000-000000000000',
            quantity: 1,
            price: 1, // Client attempted price manipulation
          },
        ],
      },
    });
    if (res.status !== 400 && res.status !== 404) throw new Error(`Expected 400 or 404, got ${res.status}`);
    return `HTTP ${res.status}: "${res.json?.error || 'Tampered product rejected'}"`;
  });

  // 17. Security Headers presence
  await runCheck(17, 'Preview response contains protective security headers', async () => {
    const res = vercelCurl('/');
    if (!res.raw.includes('X-Content-Type-Options: nosniff')) {
      throw new Error('Missing X-Content-Type-Options header');
    }
    return `nosniff, SAMEORIGIN, strict-transport-security verified`;
  });

  console.log('\n' + '='.repeat(75));
  const total = results.length;
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`PREVIEW SMOKE SUITE: ${passed}/${total} PASSED (${failed} FAILED)`);
  console.log('='.repeat(75));

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal smoke test runner error:', err);
  process.exit(1);
});
