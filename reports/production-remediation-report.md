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
| `RAZORPAY_WEBHOOK_SECRET` | Production | **PRESENT** | Configured as Sensitive in Vercel Production scope. Matching live webhook signing secret for Razorpay Webhook `Tn7KcyOx2cB9dV`. |

---

## 6. Production Webhook Configuration & Pre-Launch Verification

### 6.1 Status Matrix

| Check / Action Item | Status | Verified Evidence & Details |
| :--- | :---: | :--- |
| **Razorpay Dashboard Live Webhook** | **CONFIGURED** | Webhook exists at `https://anantarts.in/api/razorpay/webhook` (Dashboard ID: `Tn7KcyOx2cB9dV`) with required events (`payment.authorized`, `payment.captured`, `payment.failed`, `order.paid`). |
| **Vercel Production Webhook Secret** | **PASS** | `RAZORPAY_WEBHOOK_SECRET` is **configured** in Vercel Production scope as Sensitive/Encrypted. Zero secrets printed, exposed, or committed. |
| **Webhook Security & Code Audit** | **PASS** | [`src/app/api/razorpay/webhook/route.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/razorpay/webhook/route.js) and [`src/lib/razorpay.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/lib/razorpay.js) verified. Evaluates `process.env.RAZORPAY_WEBHOOK_SECRET` first (database cannot override), fails closed on missing secret (HTTP 500), enforces timing-safe HMAC-SHA256 signature verification (HTTP 401), idempotent captures, and non-regressive payment states. |
| **Security Unit Suite** | **PASS (18/18)** | [`scripts/verify_audit_fixes.mjs`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/scripts/verify_audit_fixes.mjs) passed 100%. |
| **Architecture Verification Suite** | **PASS (20/20)** | [`scripts/test_complete_audit_verification.mjs`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/scripts/test_complete_audit_verification.mjs) passed 100%. |
| **Live Preview Smoke Suite** | **PASS (17/17)** | [`scripts/test_preview_sandbox_smoke.mjs`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/scripts/test_preview_sandbox_smoke.mjs) passed 100% against active Preview deployment. |
| **Production Turbopack Build** | **PASS (49/49)** | `npm run build` compiled 49 routes cleanly in 7.7s; TypeScript verified (0 errors). |
| **Staging DB Isolation** | **PASS** | Preview continues to use staging Supabase `wjlkermuyiupzhayawut`. |
| **Production DB Integrity** | **PASS** | Production Supabase `bpysijuecdmadnqsjsym` remains 100% untouched. |
| **Production Deployment Guard** | **PASS** | Zero deployments triggered; `vercel --prod` was never executed; no branch merged into `main`. |

### 6.2 Webhook Security Audit Summary
- **Fail-Closed on Missing Secret**: If `process.env.RAZORPAY_WEBHOOK_SECRET` is missing, the endpoint aborts immediately with HTTP 500.
- **Timing-Safe Signature Rejection**: Signatures are evaluated using HMAC-SHA256 and compared via `crypto.timingSafeEqual`. Tampered signatures return HTTP 401.
- **Precedence Over DB Fallback**: `process.env.RAZORPAY_WEBHOOK_SECRET` is checked first. Because it is now configured in Vercel, the database table `website_settings` is never queried, preventing any stale or unauthorized database setting from overriding the production secret.
- **Idempotent Inventory Deduction**: Status transitions check `payment_status != 'Captured'` inside transactions. Duplicate webhooks acknowledge cleanly without deducting inventory twice.
- **State Regression Guard**: Late `payment.failed` events query `.neq('payment_status', 'Captured')`, ensuring captured orders never regress to failed.
- **Authoritative Validation**: Validates `payment.amount` against expected order paise and asserts currency is `INR`.

### 6.3 Deployment Prerequisite Notice
> **Important Runtime Note**: In Vercel, serverless lambdas bundle environment variables during deployment initialization. While `RAZORPAY_WEBHOOK_SECRET` is now securely stored in Vercel Production configuration, **it will become active in running production serverless functions upon the next deployment/redeployment**. Merging `fix/audit-phase2-prioritized-fixes` into `main` will trigger this release.

---

## 7. Mandatory Safety Affirmation

- **Production Deployment**: Zero production deployments were triggered; `vercel --prod` was **NEVER** run.
- **Production Database**: Supabase production project `bpysijuecdmadnqsjsym` was **NEVER** modified, queried for writes, or targeted for migrations.
- **Production Environment Variables**: Only `RAZORPAY_WEBHOOK_SECRET` was added to Production scope as Sensitive; zero existing production variables were modified, deleted, or overwritten.
- **Live Payments**: Zero live payments or real charges were made; only genuine Razorpay Test Mode credentials were used for sandbox verification.
- **Secrets Protection**: Zero API keys, secrets, or tokens were exposed, printed, or committed.
