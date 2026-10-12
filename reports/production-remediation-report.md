# Production & Preview Readiness Verification Report — Anant Arts

**Project**: Anant Arts (`https://anantarts.in`)  
**Branch**: `fix/audit-phase2-prioritized-fixes` (Commit: `838aabf`)  
**Live Preview Deployment**: `https://anant-arts-5tl7lmhms-anant12.vercel.app`  
**Branch Alias**: `https://anant-arts-git-fix-audit-phase2-prioritized-fixes-anant12.vercel.app`  
**Target Staging Supabase Project**: `wjlkermuyiupzhayawut` (100% Isolated)  
**Production Supabase Project**: `bpysijuecdmadnqsjsym` (Untouched & Preserved)  
**Date & Timestamp**: 2026-10-13 00:40 IST  

---

## 1. Razorpay Credential Consumers Audit

A complete audit of every consumer of Razorpay credentials across the codebase was conducted:

| File / Component | Role & Functionality | Credential Consumption | Safety Guards & Behavior |
| :--- | :--- | :--- | :--- |
| [`src/lib/razorpay.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/lib/razorpay.js) | Central Razorpay SDK helper & cryptographic layer | Resolves `keyId` & `keySecret` dynamically based on `VERCEL_ENV` | Non-production strictly requires `rzp_test_...`. Fails closed if live keys detected in Preview. Timing-safe HMAC-SHA256 signature validation. |
| [`src/app/api/razorpay/create-order/route.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/razorpay/create-order/route.js) | Server-side order creation & inventory lock | Calls `createRazorpayOrder()`; returns `order_id` & authoritative `key_id` | Catalog price recalculation; blocks client price manipulation; locks inventory atomically; fails closed if secret missing. |
| [`src/app/api/razorpay/verify-payment/route.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/razorpay/verify-payment/route.js) | Fast-path payment signature verification | Calls `verifySignature()`; verifies HMAC-SHA256 | Rejects invalid signatures (HTTP 400); atomic database update with `payment_status != 'Captured'`; deducts stock exactly once. |
| [`src/app/api/razorpay/webhook/route.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/razorpay/webhook/route.js) | Authoritative webhook processor | Calls `verifyWebhookSignature()`; uses `RAZORPAY_WEBHOOK_SECRET` | Rejects missing/forged signatures (HTTP 401); verifies amount & INR currency; idempotent on repeated delivery; single inventory deduction. |
| [`src/app/api/razorpay/health/route.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/razorpay/health/route.js) | Payment gateway & staging DB health check | Calls `validateCredentials()` & Supabase `website_settings` | Returns health booleans without exposing secret values or key previews. |
| [`src/app/api/payment/debug/route.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/payment/debug/route.js) | Low-level gateway diagnostics | Inspects credential presence | Protected: returns HTTP 401 Unauthorized for unauthenticated requests. |
| [`src/app/api/debug/payment-health/route.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/debug/payment-health/route.js) | Diagnostic health monitoring | Checks key booleans | Protected: returns HTTP 401 Unauthorized for unauthenticated requests. |
| [`src/app/checkout/page.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/checkout/page.js) | Customer checkout interface | Consumes `orderData.key_id` from server response | Client-side guard: explicitly aborts if `rzp_live_*` is received in Preview or Development. |

---

## 2. Preview Environment Risk & Ambiguity Analysis

### Existing Preview Environment State
Inspection of Vercel project `anant12/anant-arts` reveals:
- `RAZORPAY_KEY_ID` (Preview scope): Has prefix `rzp_live...` (Live Production Key ID)
- `RAZORPAY_KEY_SECRET` (Preview scope): Configured with live secret
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` (Preview scope): Configured with live key ID
- `RAZORPAY_TEST_KEY_ID`: **Missing**
- `RAZORPAY_TEST_KEY_SECRET`: **Missing**

### Risks Identified
1. **Accidental Live Charge Risk**: **Mitigated**. Handled by application defense-in-depth:
   - Server-side ([`src/lib/razorpay.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/lib/razorpay.js#L46)): `getRazorpayKeys()` zeroes out `keyId = ''` when only live keys are found in non-production.
   - Client-side ([`src/app/checkout/page.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/checkout/page.js#L614)): Checks `!isProductionDeployment && razorpayKey.startsWith('rzp_live_')` and halts checkout with an explicit security error.
2. **Key/Secret Mismatch Risk**: If `RAZORPAY_TEST_KEY_ID` was added alone without `RAZORPAY_TEST_KEY_SECRET`, the SDK would attempt to pair the test key with the live `RAZORPAY_KEY_SECRET`, causing signature verification failures and gateway communication errors. Test keys and secrets **must always be updated as an atomic pair**.
3. **Audit Ambiguity**: The presence of live credential values in Preview scope creates human confusion during pre-launch security reviews.

### Action Policy
- Per instructions: **Do not delete or overwrite existing Preview variables without explicit user authorization.**

---

## 3. Safe Preview-Only Configuration Plan

When Test Mode credentials are provided, apply them using one of the following safe paths targeting **strictly Preview scope**:

### Option A: Update Existing Preview Variables (Cleanest)
Update the Preview scope variables so all non-production references point cleanly to Sandbox:
```bash
# Preview scope only - non-destructive to Production
vercel env update RAZORPAY_KEY_ID preview --value "rzp_test_..." -y
vercel env update RAZORPAY_KEY_SECRET preview --value "<test_secret>" -y
vercel env update NEXT_PUBLIC_RAZORPAY_KEY_ID preview --value "rzp_test_..." -y
vercel env update RAZORPAY_WEBHOOK_SECRET preview --value "<test_webhook_secret>" -y
```

### Option B: Add Dedicated Test Variables
Add explicit test variables that take precedence in [`src/lib/razorpay.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/lib/razorpay.js#L35):
```bash
vercel env add RAZORPAY_TEST_KEY_ID preview
vercel env add RAZORPAY_TEST_KEY_SECRET preview
```

---

## 4. Current Status: BLOCKED on Test Mode Credentials

> [!IMPORTANT]
> **Task 6 (Interactive Sandbox Checkout): BLOCKED**
> Valid Razorpay Test Mode credentials (`rzp_test_*` and Test Secret) are currently missing from the Preview environment. In accordance with safety rules:
> - Interactive sandbox order creation is **BLOCKED**.
> - Real payments / live charges are strictly forbidden.
> - No fake or simulated transactions have been generated.
> - As soon as credentials are provided, sandbox order creation, payment confirmation, webhook delivery, and inventory deduction will be verified on staging.

---

## 5. Verification Matrix (55/55 PASS)

All non-dependent checks across unit, regression, and live preview smoke suites continue to pass at 100%:

| Test Suite | Path | Checks | Result | Notes |
| :--- | :--- | :---: | :---: | :--- |
| **Security Unit Suite** | [`scripts/verify_audit_fixes.mjs`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/scripts/verify_audit_fixes.mjs) | 18 / 18 | **PASS** | Timing-safe signatures, price recalculation, contact sanitization |
| **Comprehensive Regression** | [`scripts/test_complete_audit_verification.mjs`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/scripts/test_complete_audit_verification.mjs) | 20 / 20 | **PASS** | Edge proxy `/api/admin/*`, webhook idempotency, duplicate protection |
| **Live Preview Smoke Suite** | [`scripts/test_preview_sandbox_smoke.mjs`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/scripts/test_preview_sandbox_smoke.mjs) | 17 / 17 | **PASS** | Live HTTPS requests to preview deployment and staging Supabase |
| **Overall Total** | — | **55 / 55** | **100% PASS** | Zero regressions detected |
| **Interactive Sandbox Checkout** | Razorpay Test Mode Gateway | — | **BLOCKED** | Blocked awaiting Test Mode credentials |

---

## 6. Staging Infrastructure Isolation Confirmation

- **Database Reference**: Linked to `wjlkermuyiupzhayawut`.
- **Database Status**: `ACTIVE_HEALTHY` (PostgreSQL 17.11).
- **Table Count**: Exactly 38 application tables provisioned.
- **Data State**: Only synthetic staging seed data present (3 products, 3 categories, 2 test coupons, 5 settings). Zero production orders or customer PII.
- **Production Isolation**: Zero queries, writes, or schema modifications executed against production project `bpysijuecdmadnqsjsym`.
