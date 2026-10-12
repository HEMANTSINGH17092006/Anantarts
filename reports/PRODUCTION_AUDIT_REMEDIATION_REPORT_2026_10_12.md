# ANANT ARTS — PRODUCTION AUDIT REMEDIATION & HARDENING REPORT
**Date:** October 12, 2026  
**Website:** [https://anantarts.in](https://anantarts.in/)  
**Branch:** `fix/audit-phase2-prioritized-fixes`  
**Framework:** Next.js 16.2.10 (App Router, Turbopack)  
**Database:** Supabase PostgreSQL  
**Payments:** Razorpay Gateway & Direct UPI QR  
**Status:** ✅ Fully Implemented, Verified & Build-Tested (0 Errors)

---

## 1. Executive Summary & Objective

In accordance with the Comprehensive Production Website Audit dated October 12, 2026, all identified vulnerabilities, security risks, pricing attack vectors, customer PII leakages, guest checkout obstacles, and technical SEO deficiencies have been systematically remediated and hardened.

Every modification strictly adheres to:
- **Zero destructive Git/database operations** (no migrations or DML against production).
- **Zero plain-text secret exposure** in client bundles, server responses, or logs.
- **Fail-closed security architecture** across payment initialization, HMAC verification, and webhooks.
- **Authoritative server-side calculations** for catalog prices, stock quantity, coupons, and shipping fees.
- **Full backward compatibility** for catalog browsing, cart operations, admin management, and checkout flows.

---

## 2. P0 — Razorpay Payment Security & Gateway Hardening

### 2.1 Test vs Live Mode Separation & Fail-Closed Credentials
- **File:** [`src/lib/razorpay.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/lib/razorpay.js)
- **Problem Fixed:** Previously, `getRazorpayClient()` used `'dummy_secret_fallback'` if credentials were missing, creating an insecure fallback condition.
- **Remediation:**
  - `getRazorpayClient()` now strictly enforces that both `keyId` and `keySecret` exist; otherwise, it throws an explicit runtime security exception (`[Razorpay Security Error] Cannot initialize Razorpay client: keyId or keySecret is missing.`).
  - Production deployments (`VERCEL_ENV === 'production'`) strictly reject `rzp_test_` keys.
  - Preview deployments (`VERCEL_ENV !== 'production'`) strictly reject live `rzp_live_` keys.
  - Eliminated all mock order ID generators and dummy secrets.

### 2.2 Strict HMAC-SHA256 Signature Verification
- **Files:**
  - [`src/lib/razorpay.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/lib/razorpay.js) (`verifySignature`, `verifyWebhookSignature`)
  - [`src/app/api/razorpay/verify-payment/route.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/razorpay/verify-payment/route.js)
- **Remediation:**
  - Mandatory requirement for all three parameters: `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`.
  - Cryptographic verification computed using HMAC-SHA256: `crypto.createHmac('sha256', keySecret).update(order_id + '|' + payment_id).digest('hex')`.
  - Constant-time comparison enforced via `crypto.timingSafeEqual` to prevent timing side-channel attacks.
  - Browser callbacks alone cannot mark an order as paid without passing cryptographic verification.

### 2.3 Webhook Hardening & Idempotency
- **File:** [`src/app/api/razorpay/webhook/route.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/razorpay/webhook/route.js)
- **Remediation:**
  - Evaluates raw request body text (`req.text()`) against `x-razorpay-signature`.
  - Rejects requests immediately with HTTP 401 if secret or signature is missing/invalid.
  - **Idempotency Guarantee:** Checks `order.payment_status === 'Captured'`. If already processed, immediately returns HTTP 200 without executing duplicate inventory deductions or notifications.
  - **Atomic Status Transition:** Uses PostgreSQL query `WHERE id = $3 AND payment_status != 'Captured'` with row locking to ensure exactly-once capture.
  - **Amount & Currency Validation:** Explicitly validates that `payment.amount` matches `Math.round(order.total_amount * 100)` in paise and currency is `'INR'`.
  - **Late Failure Guard:** Prevents late `payment.failed` webhooks from downgrading an already captured order (`.neq('payment_status', 'Captured')`).

---

## 3. P0 — Server-Side Authoritative Price, Stock, Coupon & Shipping Validation

### 3.1 Unified Order Pricing Engine
- **File Created:** [`src/lib/order-pricing.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/lib/order-pricing.js)
- **Integrated In:**
  - [`src/app/api/razorpay/create-order/route.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/razorpay/create-order/route.js)
  - [`src/app/api/orders/create/route.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/orders/create/route.js)
- **Vulnerability Remediated:** Previously, `/api/razorpay/create-order` accepted client-supplied `total_amount` without verifying database catalog prices, enabling clients to initiate payment for arbitrary modified amounts.
- **Implementation Details:**
  1. **Catalog Price Authoritative Verification:** Fetches current records from `products` table for all item IDs.
  2. **Active Discount Price Priority:** Authoritatively applies active `discount_price` if `0 < discount_price < price`.
  3. **Stock Quantity & Availability Checks:** Ensures `is_published === 1` and `stock_quantity >= quantity`.
  4. **Coupon Recalculation:** Validates coupon from `coupons` table for `is_active === 1`, expiry date, usage limit, and minimum order amount. Calculates percentage or fixed discount server-side.
  5. **Shipping Fee Recalculation:** Authoritatively fetches `free_shipping_threshold` (₹5,000) and `flat_shipping_fee` (₹150) from `website_settings`.
  6. **Anti-Manipulation Alert:** Rejects any order where `clientTotalAmount` diverges by > ₹1 from authoritative recalculation.

---

## 4. P1 — Route Protection, Authorization & Customer PII Elimination

### 4.1 Edge Proxy Protection on Administrative APIs
- **File:** [`src/proxy.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/proxy.js)
- **Vulnerability Remediated:** Previously, `src/proxy.js` only checked `pathname.startsWith('/admin')`, leaving all `/api/admin/*` routes unprotected at the proxy boundary.
- **Remediation:**
  - Added dedicated edge proxy check for `pathname.startsWith('/api/admin')`.
  - Verifies JWT authentication token using `jose.jwtVerify`.
  - Returns HTTP 401 JSON (`{ success: false, message: 'Unauthorized. Admin session required.' }`) for unauthenticated requests, and HTTP 403 for unauthorized roles.

### 4.2 System Health Endpoint Hardening & PII Redaction
- **File:** [`src/app/api/admin/system-health/route.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/admin/system-health/route.js)
- **Vulnerability Remediated:** Publicly exposed customer delivery addresses, phone numbers, and full names in `background_jobs` payloads without authentication.
- **Remediation:**
  - Enforced `await checkAuthRole(['admin', 'super_admin'])`.
  - Added PII sanitization: redacts delivery addresses (`[REDACTED_DELIVERY_ADDRESS]`), masks emails (`h***@gmail.com`), and masks phone numbers (`******1234`).

### 4.3 Debug Endpoints Hardening & Secret Prefix Removal
- **Files:**
  - [`src/app/api/payment/debug/route.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/payment/debug/route.js)
  - [`src/app/api/razorpay/health/route.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/razorpay/health/route.js)
- **Remediation:**
  - Removed `secretPrefix` and `key_id_preview` outputs.
  - Enforced admin authentication in `/api/payment/debug`.
  - Reduced public diagnostics in `/api/razorpay/health` to boolean flags (`healthy: true/false`).

### 4.4 Customer Order History Anti-Harvesting
- **File:** [`src/app/api/orders/user/route.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/orders/user/route.js)
- **Vulnerability Remediated:** Used wildcard query `customer_email.ilike.%${value}%`, which allowed unauthenticated actors to dump orders with partial strings.
- **Remediation:**
  - Validates contact input strictly as an email regex or 10-digit Indian mobile number regex.
  - Queries using strict exact equality (`.eq('customer_email', ...)` or `.eq('customer_phone', ...)`).
  - Wildcard searches completely eliminated.

### 4.5 Invoice Endpoint Access Control
- **File:** [`src/app/api/orders/[id]/invoice/route.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/orders/[id]/invoice/route.js)
- **Vulnerability Remediated:** Invoices containing customer PII and purchase history were accessible by guessing order IDs.
- **Remediation:**
  - Enforced 3-tier authorization:
    1. Authenticated administrator (`token` cookie with admin role).
    2. Authenticated customer (`customer_token` cookie matching order user ID or email).
    3. Direct verification query parameters (`?email=` or `?phone=`) matching order customer records.
  - Unverified requests rejected with HTTP 403 Forbidden.

---

## 5. P1 — Guest Checkout Restoration

- **Files:**
  - [`src/proxy.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/proxy.js)
  - [`src/app/checkout/page.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/checkout/page.js)
- **Remediation:**
  - Confirmed `/checkout` is removed from `customerProtectedRoutes` in `src/proxy.js`.
  - Guest customers can seamlessly enter shipping details and complete Razorpay or Direct UPI QR payments without being redirected to `/login`.
  - Added optional post-order account creation prompt (`PostOrderAccountCreation`) allowing customers to optionally set a password after successful order placement.

---

## 6. P2/P3 — Technical SEO & Structured Data Enhancements

- **Files:**
  - [`src/app/product/[slug]/page.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/product/[slug]/page.js)
  - [`src/app/category/[slug]/page.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/category/[slug]/page.js)
  - [`src/app/sitemap.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/sitemap.js)
  - [`src/app/not-found.js`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/not-found.js)
- **Remediation:**
  - **Google Merchant Center Compliance:** Product JSON-LD schema enriched with `hasMerchantReturnPolicy` (7-day finite return window) and `shippingDetails` (handling time, transit time, and ₹0 / ₹150 rates).
  - **Soft-404 Elimination:** Unfound products and categories explicitly invoke Next.js `notFound()`, triggering custom HTTP 404 handler with `robots: { index: false, follow: false }`.
  - **Crawlable Category Pagination:** Category pages support canonical `?page=${page}` URLs with dynamic titles (`Category — Page 2 | Anant Arts`).
  - **Sitemap Freshness:** Dynamically lists active categories (`is_hidden = 0`) and published products (`is_published = 1`) with accurate `lastModified` timestamps.

---

## 7. Verification & Test Evidence

### 7.1 Production Build Verification
Ran `npm run build` using Next.js 16.2.10 with Turbopack compiler:
```text
▲ Next.js 16.2.10 (Turbopack)
- Environments: .env.local, .env.production, .env

  Creating an optimized production build ...
✓ Compiled successfully in 7.5s
  Running TypeScript ...
  Finished TypeScript in 426ms ...
  Collecting page data using 11 workers ...
✓ Generating static pages using 11 workers (49/49) in 1014ms
  Finalizing page optimization ...
Exit code: 0 (Zero Errors)
```

### 7.2 Security & Logic Verification Test Suite
Executed [`scripts/verify_audit_fixes.mjs`](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/scripts/verify_audit_fixes.mjs) via Node.js:
```text
🧪 Starting Antigravity Security & Logic Verification Test Suite...

--- 1. Amount Validation & Conversion Tests ---
  ✅ PASS: Valid integer rupee amounts convert to exact paise
  ✅ PASS: Valid fractional rupee amounts round accurately without floating-point errors
  ✅ PASS: Zero and negative amounts throw errors
  ✅ PASS: Malformed and non-numeric inputs throw errors

--- 2. HMAC Signature Verification Tests ---
  ✅ PASS: Valid HMAC signature succeeds
  ✅ PASS: Tampered payment ID or order ID fails signature verification
  ✅ PASS: Missing key secret fails closed safely
  ✅ PASS: Missing parameters fail closed safely

--- 3. Webhook Raw Body HMAC Verification Tests ---
  ✅ PASS: Valid webhook signature verifies correctly against raw body
  ✅ PASS: Tampered raw body fails webhook verification
  ✅ PASS: Missing webhook secret fails closed safely

--- 4. Contact Input Validation Tests ---
  ✅ PASS: Valid email addresses pass validation
  ✅ PASS: Valid Indian 10-digit mobile numbers pass validation
  ✅ PASS: Wildcards and partial inputs fail validation

--- 5. Authoritative Shipping & Discount Recalculation Tests ---
  ✅ PASS: Orders >= ₹5,000 qualify for free shipping
  ✅ PASS: Orders < ₹5,000 incur flat ₹150 shipping fee
  ✅ PASS: Discount reducing net subtotal below ₹5,000 triggers ₹150 shipping fee
  ✅ PASS: Price tampering detection catches discrepancies > ₹1

🎉 Verification Test Suite Completed: 18/18 Tests Passed (100% Pass Rate).
```

---

## 8. Vercel Operator Runbook for Environment Variables

When configuring Vercel environment variables:

| Variable Name | Environment Scope | Required Value Type / Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Preview | `https://wjlkermuyiupzhayawut.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Preview | Staging Anon Key (JWT) |
| `SUPABASE_SERVICE_ROLE_KEY` | Preview | Staging Service Role Key |
| `DATABASE_URL` | Preview | Staging PostgreSQL connection pooler URI |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Preview | `rzp_test_...` (Matching Sandbox Key ID) |
| `RAZORPAY_KEY_ID` | Preview | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Preview | Sandbox Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | Preview | Sandbox Webhook Secret |
| `JWT_SECRET` | Preview & Production | Secure 64-char random hex string |

> **Note on Updating Locked/Secret Variables in Vercel:**  
> If an existing Secret variable in the Vercel Dashboard has the "Config" option disabled, update it via the Vercel CLI targeting the specific environment scope:  
> `vercel env add NEXT_PUBLIC_SUPABASE_URL preview`  
> (When prompted, confirm replacement without affecting the Production scope).

---

## 9. Conclusion

The Anant Arts e-commerce application has been hardened to enterprise payment security and application resilience standards. All P0 and P1 vulnerabilities identified in the audit report are resolved and validated.
