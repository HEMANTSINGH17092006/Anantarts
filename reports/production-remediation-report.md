# Production & Preview Readiness Verification Report — Anant Arts

**Project**: Anant Arts (`https://anantarts.in`)  
**Branch**: `fix/audit-phase2-prioritized-fixes`  
**Latest Preview Deployment**: `https://anant-arts-io8ipju37-anant12.vercel.app`  
**Target Staging Supabase Project**: `wjlkermuyiupzhayawut` (100% Isolated)  
**Production Supabase Project**: `bpysijuecdmadnqsjsym` (Untouched & Preserved)  
**Date & Timestamp**: 2026-10-13 01:05 IST  

---

## 1. Executive Summary & Verification Matrix

All tasks outlined in the verification roadmap have been executed following strict non-destructive safety protocols. The staging environment has been completely isolated, Razorpay Test Mode credentials have been paired and verified against live Razorpay APIs, a genuine sandbox checkout lifecycle was executed end-to-end, and all regression suites passed 100%.

| Phase / Scope | Test / Verification Focus | Checks | Status | Evidence / Notes |
| :--- | :--- | :---: | :---: | :--- |
| **Sandbox Order Creation** | Real Razorpay order via Preview `/api/razorpay/create-order` | 1 / 1 | **PASS** | Generated Razorpay Order `order_Tn73AftkCa6RnC` (₹349) using Test Key `rzp_test_...` |
| **Inventory Locking** | Temporary pre-order inventory lock on Staging DB | 1 / 1 | **PASS** | Staging Order ID `1` created with `payment_status = 'Pending'`; lock placed on product `1` |
| **Signature Fraud Rejection** | Fast-path `/api/razorpay/verify-payment` tampered signature | 1 / 1 | **PASS** | HTTP 400 Bad Request: `"Cryptographic signature verification failed."` |
| **Sandbox Payment Capture** | Fast-path `/api/razorpay/verify-payment` authentic HMAC | 1 / 1 | **PASS** | HTTP 200: `payment_status` transitioned to `'Captured'`, `order_status` to `'Processing'` |
| **Inventory Deduction** | Atomic stock decrement on staging catalog | 1 / 1 | **PASS** | Product `1` stock decremented exactly once from `50` -> `49`; inventory lock released |
| **Webhook Idempotency** | Duplicate `payment.captured` webhook delivery | 1 / 1 | **PASS** | Acknowledged cleanly; stock remained immutable at `49` (zero duplicate deduction) |
| **Failure Immutability** | Late `payment.failed` event on captured order | 1 / 1 | **PASS** | Order remained immutable in `'Captured'` status |
| **Security Unit Suite** | Security & Auth Regression ([`scripts/verify_audit_fixes.mjs`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/scripts/verify_audit_fixes.mjs)) | 18 / 18 | **PASS** | Edge proxy `/api/admin/*`, timing-safe signatures, PII masking, soft-404 |
| **Comprehensive Suite** | Architecture Hardening ([`scripts/test_complete_audit_verification.mjs`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/scripts/test_complete_audit_verification.mjs)) | 20 / 20 | **PASS** | Database transactions, coupon math, catalog pricing engine, CSP headers |
| **Live Preview Smoke Suite** | Live HTTPS Smoke ([`scripts/test_preview_sandbox_smoke.mjs`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/scripts/test_preview_sandbox_smoke.mjs)) | 17 / 17 | **PASS** | Guest checkout at `/checkout` open without redirect; diagnostic 401 guards verified |
| **Local Production Build** | Next.js 16.2.10 Turbopack Build (`npm run build`) | 49 / 49 | **PASS** | Compiled successfully in 6.8s; all static prerenders and dynamic routes verified |

---

## 2. Razorpay Credential Resolution & Fail-Closed Hardening (Task 1 & 2)

### Hardened Logic in `src/lib/razorpay.js`
In [`src/lib/razorpay.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/lib/razorpay.js#L41-L55), the non-production resolution logic was hardened to strictly prevent pairing test keys with unverified fallback or live secrets:
1. When a test key (`rzp_test_*`) is selected, `getRazorpayKeys()` strictly requires `process.env.RAZORPAY_TEST_KEY_SECRET`.
2. If `RAZORPAY_TEST_KEY_SECRET` is missing, it refuses to fall back to an unverified or live `RAZORPAY_KEY_SECRET` and fails closed (`keyId = ''; keySecret = '';`).
3. In production mode, any `rzp_test_*` key is strictly rejected.
4. No API secrets were printed, logged, or committed to repository files.

---

## 3. Preview Environment Configuration (Task 3 & 4)

The test mode credentials were configured safely targeting **strictly the Preview environment scope**:

| Variable Name | Environment Scope | Status | Notes |
| :--- | :--- | :---: | :--- |
| `RAZORPAY_TEST_KEY_ID` | Preview | **CONFIGURED** | Test mode key ID starting with `rzp_test_...` |
| `RAZORPAY_TEST_KEY_SECRET` | Preview | **CONFIGURED** | Test mode secret paired with test key ID |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Preview | **UPDATED** | Points to test key ID in Preview scope |
| `RAZORPAY_KEY_ID` | Preview | **UPDATED** | Points to test key ID in Preview scope |
| `RAZORPAY_KEY_SECRET` | Preview | **UPDATED** | Points to test key secret in Preview scope |
| `NEXT_PUBLIC_SUPABASE_URL` | Preview | **CONFIRMED** | Points strictly to staging: `https://wjlkermuyiupzhayawut.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Preview | **CONFIRMED** | Linked to staging project `wjlkermuyiupzhayawut` |
| `SUPABASE_SERVICE_ROLE_KEY` | Preview | **CONFIRMED** | Linked to staging project `wjlkermuyiupzhayawut` |

---

## 4. Live Razorpay Sandbox Checkout Lifecycle Evidence (Task 5)

A genuine sandbox checkout lifecycle was executed against Preview deployment `https://anant-arts-io8ipju37-anant12.vercel.app` and linked staging database `wjlkermuyiupzhayawut`:

```
================================================================================
ANANT ARTS — RAZORPAY TEST MODE SANDBOX CHECKOUT VERIFICATION
Preview Deployment: https://anant-arts-io8ipju37-anant12.vercel.app
Staging Project Ref: wjlkermuyiupzhayawut
================================================================================
[STEP 1] Fetch initial stock of staging product 1... 
  ✓ PASS: Product "Test Bal Krishna Idol" current stock = 50
[STEP 2] Initialize real Razorpay sandbox order via /api/razorpay/create-order... 
  ✓ PASS: Created Razorpay Order: order_Tn73AftkCa6RnC, Key: rzp_test_..., Amount: ₹349
[STEP 3] Verify order record and inventory lock in staging database... 
  ✓ PASS: Staging Order ID 1 is Pending with inventory locked for product 1
[STEP 4] Reject tampered payment signature via /api/razorpay/verify-payment... 
  ✓ PASS: HTTP 400 rejected: "Cryptographic signature verification failed."
[STEP 5] Verify authentic signature and complete payment via fast-path... 
  ✓ PASS: HTTP 200, status marked "Captured"
[STEP 6] Confirm staging DB order is Captured and stock deducted exactly once... 
  ✓ PASS: Stock deducted from 50 -> 49 (exactly once); lock released
[STEP 7] Verify duplicate webhook delivery does not deduct stock twice... 
  ✓ PASS: Stock remains exactly 49 (no duplicate deduction)
[STEP 8] Verify late payment.failed event cannot overwrite captured order... 
  ✓ PASS: Order remains immutable in "Captured" state
```

---

## 5. Production Environment Variables Audit (Task 7)

Every production environment variable on Vercel project `anant12/anant-arts` was audited by presence and status only (no values revealed):

| Variable Name | Environment | Status | Configuration Assessment |
| :--- | :--- | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production | **PRESENT** | Configured (Points to production `bpysijuecdmadnqsjsym`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production | **PRESENT** | Configured |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | **PRESENT** | Configured |
| `DATABASE_URL` | Production | **PRESENT** | Configured (Direct connection pooler) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Production | **PRESENT** | Configured |
| `RAZORPAY_KEY_ID` | Production | **PRESENT** | Configured |
| `RAZORPAY_KEY_SECRET` | Production | **PRESENT** | Configured |
| `NEXT_PUBLIC_SITE_URL` | Production | **PRESENT** | Configured (`https://anantarts.in`) |
| `JWT_SECRET` | Production | **PRESENT** | Configured |
| `SMTP_HOST` | Production | **PRESENT** | Configured |
| `SMTP_PORT` | Production | **PRESENT** | Configured |
| `SMTP_USER` | Production | **PRESENT** | Configured |
| `SMTP_PASS` | Production | **PRESENT** | Configured |
| `SMTP_FROM` | Production | **PRESENT** | Configured |
| `SMTP_REPLY_TO` | Production | **PRESENT** | Configured |
| `RAZORPAY_WEBHOOK_SECRET` | Production | **BLOCKED (ACTION REQUIRED)** | Absent from Vercel Production scope. Missing secret prevents production serverless functions from verifying inbound live Razorpay webhook signatures. |

---

## 6. Production Pre-Release Audit: Razorpay Live Webhook Configuration

### 6.1 Status Matrix

| Check / Action Item | Status | Verified Finding / Action Required |
| :--- | :---: | :--- |
| **Razorpay Dashboard Access** | **BLOCKED (UNAVAILABLE)** | Interactive browser automation cannot access the dashboard due to environment driver restrictions and requirement for merchant 2FA credentials. Dashboard must be accessed directly by the merchant. |
| **Live Webhook Endpoint Creation** | **BLOCKED (PENDING OPERATOR)** | **Not created yet.** Webhook pointing to `https://anantarts.in/api/razorpay/webhook` must be manually created in Live Mode on Razorpay Dashboard. |
| **Live Webhook Signing Secret** | **PENDING OPERATOR** | Secret must be generated/copied during webhook creation in the Razorpay Dashboard. Not available in code, Git, or logs. |
| **Vercel Production Variable** | **BLOCKED (PENDING SECRET)** | `RAZORPAY_WEBHOOK_SECRET` is **not configured** in Production scope. Will be added once the live secret is securely available. |
| **Webhook Code & Security Audit** | **PASS** | [`src/app/api/razorpay/webhook/route.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/razorpay/webhook/route.js) and [`src/lib/razorpay.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/lib/razorpay.js) strictly fail closed on missing secret (HTTP 500), enforce HMAC-SHA256 timing-safe signatures (HTTP 401), and give `process.env` absolute priority over DB settings. |
| **Production Deployment Safeguard** | **PASS** | Zero deployments triggered; `vercel --prod` was never executed; zero live payments attempted. |

### 6.2 Code & Security Audit Details
- **Target Variable**: `RAZORPAY_WEBHOOK_SECRET`
- **Route**: [`src/app/api/razorpay/webhook/route.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/razorpay/webhook/route.js)
- **Signature Engine**: [`src/lib/razorpay.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/lib/razorpay.js#L350-L365) (`verifyWebhookSignature` via HMAC-SHA256 and `crypto.timingSafeEqual`)
- **Verified Behavior When Missing**:
  1. The webhook handler reads `process.env.RAZORPAY_WEBHOOK_SECRET`.
  2. If missing, it queries `website_settings` table for `razorpay_webhook_secret`.
  3. If still unresolved, it **fails closed** immediately:
     - Emits `[Razorpay Webhook Security Error] RAZORPAY_WEBHOOK_SECRET is not configured.`
     - Returns HTTP 500: `{"success": false, "message": "Webhook secret is not configured on the server."}`.
  4. At no point are unauthenticated payloads parsed, processed, or credited.
  5. If an invalid signature is received, it returns HTTP 401: `{"success": false, "message": "Invalid webhook signature."}`.
  6. Cryptographic signature verification is unconditional; no bypass or weak fallback exists.
  7. **Precedence Protection**: `process.env.RAZORPAY_WEBHOOK_SECRET` is evaluated first. Once configured in Vercel, it short-circuits the check and completely prevents any stale value in `website_settings` from being read or overriding the production secret.

### 6.3 Tooling & Dashboard Verification Outcome
- **Browser Subagent Navigation**: Attempted automated navigation to `https://dashboard.razorpay.com`. The environment's Playwright driver could not be initialized (404 on driver binary download), and merchant dashboards require interactive 2FA/OTP login.
- **Outcome**: The assistant cannot directly create or verify webhooks in the Razorpay Dashboard. The live webhook was **NOT** created.

### 6.4 Operator Action Required to Complete Webhook Configuration
The merchant administrator must complete the following manual steps:

1. **Step 1: Log In to Razorpay Dashboard**:
   - Navigate to [https://dashboard.razorpay.com](https://dashboard.razorpay.com) and complete merchant login.
   - Verify that the toggle in the top header is set to **Live Mode** (NOT Test Mode).
2. **Step 2: Add Webhook**:
   - Go to **Settings** (left sidebar gear icon) $\to$ **Webhooks** tab.
   - Click **+ Add New Webhook**.
   - **Webhook URL**: `https://anantarts.in/api/razorpay/webhook`
   - **Secret**: Enter a strong, random, high-entropy secret string (this is the webhook signing secret, separate from `RAZORPAY_KEY_SECRET`).
   - **Alert Email**: Enter administrator alert email.
   - **Active Events**: Select:
     - `payment.authorized`
     - `payment.captured`
     - `payment.failed`
     - `order.paid`
   - Click **Create Webhook**.
   - Securely copy the entered secret.
3. **Step 3: Add to Vercel Production Scope**:
   - In Vercel Project Dashboard (`anant12/anant-arts`) $\to$ **Settings** $\to$ **Environment Variables**:
     - Key: `RAZORPAY_WEBHOOK_SECRET`
     - Value: `<paste the secret from Step 2>`
     - Scope: Check **Production** ONLY.
   - Alternatively run:
     ```bash
     npx vercel env add RAZORPAY_WEBHOOK_SECRET production
     ```
4. **Step 4: Redeploy Production**:
   - Next.js serverless functions require a redeployment to pick up newly added environment variables.
   - Merge `fix/audit-phase2-prioritized-fixes` into `main`, which will trigger the production build and deployment with all audit fixes and the live webhook secret active.

---

## 7. Mandatory Safety Affirmation

- **Production Deployment**: Zero production deployments were triggered; `vercel --prod` was **NEVER** run.
- **Production Database**: Supabase production project `bpysijuecdmadnqsjsym` was **NEVER** modified, queried for writes, or targeted for migrations.
- **Production Environment Variables**: Zero production environment variables were modified, added, deleted, or overwritten in this step.
- **Live Payments**: Zero live payments or real charges were made; only genuine Razorpay Test Mode credentials were used for sandbox verification.
- **Secrets Protection**: Zero API keys, secrets, or tokens were exposed or committed.
