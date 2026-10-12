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

### 6.1 Server Webhook Implementation & Fail-Closed Guard Analysis
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

### 6.2 Razorpay Dashboard Webhook Endpoint Status
- **Dashboard Access Status**: **UNAVAILABLE TO ASSISTANT**
  - The assistant does not possess credentials, session tokens, or automated access to the merchant Razorpay Dashboard (`https://dashboard.razorpay.com`).
  - Webhook endpoint configuration on the live gateway must be verified directly by the merchant administrator.

### 6.3 Standard Operating Procedure: Live Webhook Secret Retrieval & Configuration
The live webhook signing secret is mathematically distinct from the API Key Secret (`RAZORPAY_KEY_SECRET`). It must be extracted from the webhook endpoint configuration:

1. **Access Gateway**:
   - Log in to [Razorpay Merchant Dashboard](https://dashboard.razorpay.com/).
   - Ensure the mode toggle in the top header is switched to **Live Mode** (NOT Test Mode).
2. **Navigate to Webhooks**:
   - Go to **Settings** (left sidebar gear icon) $\to$ **Webhooks** tab.
3. **Verify or Create Webhook**:
   - **URL**: `https://anantarts.in/api/razorpay/webhook`
   - **Secret**: Enter or retrieve a high-entropy signing secret. (If editing an existing webhook where the secret is masked and unrecorded, generate and save a new secret).
   - **Active Events**: Check the following required events:
     - `payment.authorized`
     - `payment.captured`
     - `payment.failed`
     - `order.paid`
   - Save the webhook configuration.
4. **Configure in Vercel Production**:
   - Using Vercel Dashboard (Project Settings $\to$ Environment Variables) or Vercel CLI:
     ```bash
     npx vercel env add RAZORPAY_WEBHOOK_SECRET production
     ```
   - Paste the exact live webhook secret.
   - Never paste the Preview secret or the API key secret.
5. **Runtime Effect Requirement**:
   - **A new deployment or redeployment of Production is strictly required** for the Next.js production serverless functions to inject and consume `RAZORPAY_WEBHOOK_SECRET`. Existing deployed lambda containers do not inherit runtime variable updates until redeployed.

---

## 7. Mandatory Safety Affirmation

- **Production Deployment**: Zero production deployments were triggered; `vercel --prod` was **NEVER** run.
- **Production Database**: Supabase production project `bpysijuecdmadnqsjsym` was **NEVER** modified, queried for writes, or targeted for migrations.
- **Production Environment Variables**: Zero production environment variables were modified, added, deleted, or overwritten in this step.
- **Live Payments**: Zero live payments or real charges were made; only genuine Razorpay Test Mode credentials were used for sandbox verification.
- **Secrets Protection**: Zero API keys, secrets, or tokens were exposed or committed.
