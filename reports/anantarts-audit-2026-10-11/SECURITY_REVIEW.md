# DEFENSIVE SECURITY & CONFIGURATION REVIEW — ANANT ARTS
**Audit Date:** 11 October 2026  
**Target Domain:** `https://anantarts.in`  
**Platform:** Next.js 16.2.10 (App Router), Supabase (PostgreSQL), Razorpay Gateway, Vercel  
**Reviewer:** Senior Application Security & Cloud Architecture Specialist  
**Diagnostic Protocol:** Defensive, Non-Destructive Code & Public Endpoint Inspection (No active exploitation, secrets unexposed)

---

## 1. Executive Summary of Security Findings

| Vulnerability / Finding | Severity | Category | Status |
| :--- | :--- | :--- | :--- |
| **SEC-01: Razorpay Signature Verification Fallback Bypass** | **Critical (P0)** | Authentication / Payment | Vulnerable |
| **SEC-02: Payment API Status Verification Fallback on `pay_`** | **Critical (P0)** | Payment Integrity | Vulnerable |
| **SEC-03: Order Creation API Trusts Client Price & Total** | **Critical (P0)** | Business Logic / Pricing Flaw | Vulnerable |
| **SEC-04: Webhook Signature Verification Optional / Bypassable** | **High (P1)** | Webhook Security | Vulnerable |
| **SEC-05: Unauthenticated Public Debug Endpoint Exposes System Health** | **High (P1)** | Information Disclosure | Vulnerable (`/api/debug/payment-health`) |
| **SEC-06: Stock Adjustment Race Condition (Non-Atomic Update)** | **Medium (P2)** | Concurrency / Integrity | Vulnerable |
| **SEC-07: Client-Side-Only Auth State in Admin Layout** | **Medium (P2)** | Access Control Architecture | Mitigated by Edge Proxy, but Component Flawed |
| **SEC-08: Supabase Row Level Security (RLS) Enforcement** | **DEFENSIVE PASS** | Data Privacy | Properly blocks public access to `orders` and `users` |
| **SEC-09: Environment Variables & Secrets Leakage in Browser** | **DEFENSIVE PASS** | Credential Security | No server-side secrets prefixed with `NEXT_PUBLIC_` |
| **SEC-10: HTTP Security Headers & Content Security Policy (CSP)** | **DEFENSIVE PASS** | Browser Hardening | HSTS (2 years), X-Frame-Options, X-Content-Type-Options, strict CSP |

---

## 2. In-Depth Security Findings & Technical Evidence

### SEC-01: Razorpay Signature Verification Fallback Bypass
- **Severity:** **Critical (P0)**
- **Source File:** [src/lib/razorpay.js:207-223](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/lib/razorpay.js#L207-L223)
- **Code Extract:**
  ```javascript
  export function verifySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    const { keySecret } = getRazorpayKeys();

    if (!keySecret) {
      console.warn('[Razorpay Warning] Signature verification skipped because RAZORPAY_KEY_SECRET is missing.');
      return Boolean(razorpay_order_id && razorpay_payment_id);
    }
    ...
  }
  ```
- **Technical Vulnerability:**
  - If `RAZORPAY_KEY_SECRET` is unset, unparsed, or empty during runtime deployment, `verifySignature` does **not** fail closed.
  - Instead, it returns `Boolean(razorpay_order_id && razorpay_payment_id)`.
  - As a result, any arbitrary string for order ID and payment ID will evaluate to `true`, causing fake payment signatures to be treated as authentically verified.
- **Remediation:**
  - Cryptographic verification must fail closed immediately:
    ```javascript
    if (!keySecret) {
      throw new Error('[Razorpay Security Violation] Cannot verify payment signature: RAZORPAY_KEY_SECRET is missing.');
    }
    ```

---

### SEC-02: Payment API Status Verification Fallback on `pay_`
- **Severity:** **Critical (P0)**
- **Source File:** [src/lib/razorpay.js:235-256](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/lib/razorpay.js#L235-L256)
- **Code Extract:**
  ```javascript
  export async function verifyPaymentViaApi(paymentId) {
    ...
    try {
      const payment = await fetchPaymentDetails(paymentId);
      if (!payment) {
        if (paymentId.startsWith('pay_')) {
          return { verified: true, status: 'captured', isFallback: true, payment: null };
        }
        ...
      }
    } catch (err) {
      if (paymentId.startsWith('pay_')) {
        return { verified: true, status: 'captured', isFallback: true, error: err.message };
      }
      return { verified: false, reason: err.message };
    }
  }
  ```
- **Technical Vulnerability:**
  - When verifying payment via direct Razorpay REST API: if the API returns null or throws a network timeout/exception, the function inspects if `paymentId.startsWith('pay_')`.
  - If it does, it returns `{ verified: true, status: 'captured' }`.
  - An attacker submitting `pay_1234567890` when triggering an API rate-limit or network disruption would be treated as genuinely captured and paid.
- **Remediation:**
  - Never synthesize capture status based on string prefix. If the upstream payment gateway cannot definitively confirm capture, the payment must remain in `Pending` or `Failed Verification`.

---

### SEC-03: Order Creation API Trusts Client Price & Total
- **Severity:** **Critical (P0)**
- **Source File:** [src/app/api/orders/create/route.js:172-235](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/orders/create/route.js#L172-L235)
- **Technical Vulnerability:**
  - `POST /api/orders/create` takes `subtotal`, `items[i].price`, and `total_amount` straight from `req.json()`.
  - The server checks stock quantity in the database, but **never checks product price**.
  - It inserts the client's unvalidated `subtotal` and `total_amount` directly into the `orders` table.
- **Remediation:**
  - Recalculate line-item prices on the server using authoritative database records:
    ```javascript
    let serverSubtotal = 0;
    for (const item of items) {
      const { data: prod } = await supabase.from('products').select('price, discount_price').eq('id', item.product_id).single();
      const authoritativePrice = (prod.discount_price > 0) ? prod.discount_price : prod.price;
      serverSubtotal += authoritativePrice * item.quantity;
      item.price = authoritativePrice;
    }
    ```

---

### SEC-04: Webhook Signature Verification Optional / Bypassable
- **Severity:** **High (P1)**
- **Source File:** [src/app/api/razorpay/webhook/route.js:15-19](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/razorpay/webhook/route.js#L15-L19)
- **Code Extract:**
  ```javascript
  if (webhookSecret && signature) {
    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ message: 'Invalid webhook signature.' }, { status: 400 });
    }
  }
  ```
- **Technical Vulnerability:**
  - The signature verification is wrapped in `if (webhookSecret && signature)`.
  - If an attacker sends a POST request without the `x-razorpay-signature` header, or if `RAZORPAY_WEBHOOK_SECRET` is not populated in the environment, the verification check is bypassed completely.
  - The code proceeds directly to parsing the event and updating the order to "Captured" in the database.
- **Remediation:**
  - Signature validation must be unconditional:
    ```javascript
    if (!webhookSecret || !signature || !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      return NextResponse.json({ message: 'Unauthorized webhook request.' }, { status: 401 });
    }
    ```

---

### SEC-05: Unauthenticated Public Debug Endpoint Exposes System Health
- **Severity:** **High (P1)**
- **Source File:** [src/app/api/debug/payment-health/route.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/debug/payment-health/route.js)
- **Live Test Evidence:**
  - Request to `https://anantarts.in/api/debug/payment-health` returned `HTTP 200 OK` with JSON payload confirming database connection status, table lists (`payment_audit`, `inventory_locks`, `background_jobs`, `orders`), environment flags, and operational warnings.
- **Remediation:**
  - Restrict `/api/debug/*` routes behind admin session authentication, or disable in production via `process.env.NODE_ENV !== 'production'`.

---

### SEC-06: Database Row Level Security (RLS) Defensive Status
- **Status:** **DEFENSIVE PASS (Secure)**
- **Verification Method:** Live read testing with Supabase Public Anon Key simulating an unauthenticated external browser.
- **Observations:**
  - `anonClient.from('orders').select('*')` returned **0 rows** (blocked by RLS, while service-role confirmed 3 orders exist).
  - `anonClient.from('users').select('*')` returned **0 rows** (blocked by RLS, while service-role confirmed 9 customer records exist).
  - Patron Personally Identifiable Information (PII) including phone numbers, emails, and physical delivery addresses cannot be extracted via client-side Supabase queries.

---

### SEC-07: Secrets Leakage & Browser Bundling Check
- **Status:** **DEFENSIVE PASS (Secure)**
- **Code Inspection:**
  - `SUPABASE_SERVICE_ROLE_KEY`: Server-side only (never prefixed with `NEXT_PUBLIC_`).
  - `RAZORPAY_KEY_SECRET`: Server-side only (never prefixed with `NEXT_PUBLIC_`).
  - `JWT_SECRET`: Server-side only.
  - `SMTP_PASS`: Server-side only.
  - Only public identifiers are exposed to the client: `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_META_PIXEL_ID`.

---

### SEC-08: Content Security Policy & Browser Hardening
- **Status:** **DEFENSIVE PASS (Secure)**
- **Live Headers Recorded:**
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (2-year HSTS)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Xss-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(self), interest-cohort=()`
  - Comprehensive Content Security Policy restricting scripts, styles, frames, and connect endpoints to authorized third parties (Razorpay, Google Tag Manager, Microsoft Clarity, Meta Pixel, Supabase Storage).
