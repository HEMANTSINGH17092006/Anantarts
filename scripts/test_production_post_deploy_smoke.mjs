import https from 'https';

const BASE_URL = 'https://anantarts.in';

async function fetchUrl(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000
    };

    const req = https.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${urlPath}`));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function runSmokeTests() {
  console.log('================================================================');
  console.log('ANANT ARTS — POST-DEPLOYMENT PRODUCTION SMOKE VERIFICATION');
  console.log(`Target: ${BASE_URL}`);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. GET /api/health
  try {
    const res = await fetchUrl('/api/health');
    console.log(`[CHECK 1] GET /api/health -> Status: ${res.status}`);
    const json = JSON.parse(res.body);
    if (res.status === 200 && json.status === 'healthy') {
      console.log(`  ✓ PASS: Health endpoint is healthy. Database: ${json.database || 'connected'}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: Health check unexpected response:`, json);
      failed++;
    }
  } catch (err) {
    console.error(`  ✗ FAIL: Error checking /api/health: ${err.message}`);
    failed++;
  }

  // 2. GET /robots.txt
  try {
    const res = await fetchUrl('/robots.txt');
    console.log(`\n[CHECK 2] GET /robots.txt -> Status: ${res.status}`);
    if (res.status === 200 && res.body.includes('User-agent: *') && res.body.includes('sitemap.xml')) {
      console.log(`  ✓ PASS: robots.txt is valid, allows crawling and references sitemap.`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: robots.txt response invalid:`, res.body.slice(0, 200));
      failed++;
    }
  } catch (err) {
    console.error(`  ✗ FAIL: Error checking /robots.txt: ${err.message}`);
    failed++;
  }

  // 3. GET /sitemap.xml
  try {
    const res = await fetchUrl('/sitemap.xml');
    console.log(`\n[CHECK 3] GET /sitemap.xml -> Status: ${res.status}`);
    if (res.status === 200 && (res.body.includes('<?xml') || res.body.includes('<urlset'))) {
      console.log(`  ✓ PASS: sitemap.xml is valid XML (length: ${res.body.length} bytes).`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: sitemap.xml response invalid:`, res.body.slice(0, 200));
      failed++;
    }
  } catch (err) {
    console.error(`  ✗ FAIL: Error checking /sitemap.xml: ${err.message}`);
    failed++;
  }

  // 4. Guest checkout accessibility: GET /checkout
  try {
    const res = await fetchUrl('/checkout');
    console.log(`\n[CHECK 4] GET /checkout -> Status: ${res.status}`);
    // Should NOT redirect to /login or /admin/login
    const location = res.headers.location;
    if (res.status === 200 && (!location || !location.includes('login'))) {
      console.log(`  ✓ PASS: Guest checkout page renders directly without unwanted login redirect.`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: /checkout redirected or returned non-200. Status: ${res.status}, Location: ${location}`);
      failed++;
    }
  } catch (err) {
    console.error(`  ✗ FAIL: Error checking /checkout: ${err.message}`);
    failed++;
  }

  // 5. Category page: GET /category/divine-idols
  try {
    const res = await fetchUrl('/category/divine-idols');
    console.log(`\n[CHECK 5] GET /category/divine-idols -> Status: ${res.status}`);
    if (res.status === 200) {
      console.log(`  ✓ PASS: Category page loads cleanly with HTTP 200.`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: /category/divine-idols status: ${res.status}`);
      failed++;
    }
  } catch (err) {
    console.error(`  ✗ FAIL: Error checking category page: ${err.message}`);
    failed++;
  }

  // 6. Shop page: GET /shop
  try {
    const res = await fetchUrl('/shop');
    console.log(`\n[CHECK 6] GET /shop -> Status: ${res.status}`);
    if (res.status === 200) {
      console.log(`  ✓ PASS: Shop page loads cleanly with HTTP 200.`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: /shop status: ${res.status}`);
      failed++;
    }
  } catch (err) {
    console.error(`  ✗ FAIL: Error checking shop page: ${err.message}`);
    failed++;
  }

  // 7. Diagnostic security guards (unauthenticated access rejected)
  try {
    const resHealth = await fetchUrl('/api/debug/payment-health');
    const resDebug = await fetchUrl('/api/payment/debug');
    const resAdmin = await fetchUrl('/api/admin/system-health');
    console.log(`\n[CHECK 7] Diagnostic route authentication enforcement:`);
    console.log(`  /api/debug/payment-health -> Status: ${resHealth.status}`);
    console.log(`  /api/payment/debug        -> Status: ${resDebug.status}`);
    console.log(`  /api/admin/system-health  -> Status: ${resAdmin.status}`);

    if (resHealth.status === 401 && resDebug.status === 401 && resAdmin.status === 401) {
      console.log(`  ✓ PASS: All diagnostic endpoints strictly reject unauthenticated requests with HTTP 401.`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: One or more diagnostic endpoints leaked without auth.`);
      failed++;
    }
  } catch (err) {
    console.error(`  ✗ FAIL: Error checking diagnostic routes: ${err.message}`);
    failed++;
  }

  // 8. Razorpay public route & webhook guard
  try {
    const resWebhookMissing = await fetchUrl('/api/razorpay/webhook', { method: 'POST', body: '{}' });
    const resVerifyTampered = await fetchUrl('/api/razorpay/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ razorpay_order_id: 'order_123', razorpay_payment_id: 'pay_123', razorpay_signature: 'fake' })
    });
    console.log(`\n[CHECK 8] Gateway security guards:`);
    console.log(`  /api/razorpay/webhook (missing signature) -> Status: ${resWebhookMissing.status}`);
    console.log(`  /api/razorpay/verify-payment (forged sig) -> Status: ${resVerifyTampered.status}`);

    if (resWebhookMissing.status === 401 && resVerifyTampered.status === 400) {
      console.log(`  ✓ PASS: Webhook rejects missing signature (401), verification rejects forged HMAC (400).`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: Gateway guards unexpected response.`);
      failed++;
    }
  } catch (err) {
    console.error(`  ✗ FAIL: Error checking gateway routes: ${err.message}`);
    failed++;
  }

  // 9. Payment health (safe status)
  try {
    const resRazorpayHealth = await fetchUrl('/api/razorpay/health');
    console.log(`\n[CHECK 9] GET /api/razorpay/health -> Status: ${resRazorpayHealth.status}`);
    const json = JSON.parse(resRazorpayHealth.body);
    if (resRazorpayHealth.status === 200 && json.status === 'healthy' && json.has_key_id === true) {
      console.log(`  ✓ PASS: Live Razorpay public health check confirms healthy status and key configuration.`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: /api/razorpay/health response:`, json);
      failed++;
    }
  } catch (err) {
    console.error(`  ✗ FAIL: Error checking /api/razorpay/health: ${err.message}`);
    failed++;
  }

  // 10. Security headers on live domain
  try {
    const res = await fetchUrl('/');
    const headers = res.headers;
    const hasNosniff = headers['x-content-type-options'] === 'nosniff';
    const hasFrameOptions = headers['x-frame-options'] === 'SAMEORIGIN';
    console.log(`\n[CHECK 10] Security Headers on https://anantarts.in:`);
    console.log(`  x-content-type-options: ${headers['x-content-type-options']}`);
    console.log(`  x-frame-options:        ${headers['x-frame-options']}`);
    if (hasNosniff && hasFrameOptions) {
      console.log(`  ✓ PASS: Production security headers are active on https://anantarts.in.`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: Security headers missing or unexpected.`);
      failed++;
    }
  } catch (err) {
    console.error(`  ✗ FAIL: Error checking security headers: ${err.message}`);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`PRODUCTION SMOKE TEST RESULTS: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} CHECKS`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

runSmokeTests().catch(err => {
  console.error('Fatal smoke test runner error:', err);
  process.exit(1);
});
