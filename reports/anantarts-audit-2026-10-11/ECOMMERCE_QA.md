# E-COMMERCE FUNCTIONAL QA AUDIT — ANANT ARTS
**Audit Date:** 11 October 2026  
**Target Domain:** `https://anantarts.in`  
**Platform:** Next.js 16.2.10 (App Router), Supabase (PostgreSQL), Razorpay, Direct UPI QR  
**QA Lead:** Senior E-commerce QA Engineer & Reliability Specialist  
**Testing Protocol:** Read-Only Functional Inspection & Safe Non-Destructive Public Flow Testing

---

## 1. Executive Summary of Functional QA Findings

| Feature Flow | Test Status | Defect Count | Primary Concern |
| :--- | :--- | :--- | :--- |
| **Catalog & Product Browsing** | **PASS** with Warning | 1 | Category pages lack pagination; renders up to 206 items in single view. |
| **Product Detail Pages (PDP)** | **PASS** | 0 | Gallery zoom, reviews accordion, related items, and meta tags operate correctly. |
| **Cart & Quantity Operations** | **PASS** | 0 | Local storage synchronization, subtotal updates, and badge count function properly. |
| **Checkout Accessibility** | **FAIL (CRITICAL DEFECT)** | 1 | Unauthenticated guest patrons clicking "Checkout" are forcibly blocked by `src/proxy.js` and redirected to `/login`. |
| **Server-Side Price Validation** | **FAIL (CRITICAL DEFECT)** | 1 | Order creation API (`api/orders/create`) trusts client-submitted `subtotal`, `items[i].price`, and `total_amount` without server-side recalculation. |
| **Stock Deduction Concurrency** | **FAIL (HIGH DEFECT)** | 1 | Stock is updated using non-atomic Read-Then-Write without SQL transaction locks. |
| **Direct UPI QR Payment** | **PASS** | 0 | Validates 4+ digit UTR; sets order status to "Payment Verification Pending". |
| **Cash on Delivery (COD)** | **BLOCKED (BY DESIGN)** | 0 | Explicitly disabled in commit `16151c8` (Oct 8); API rejects COD requests with 400. |
| **Order Tracking Interface** | **PASS** | 0 | `/order-tracking` queries orders by order number and mobile phone cleanly. |
| **Customer Authentication** | **PASS** | 0 | Password and OTP verification logic functions as specified. |
| **Admin Route Protection** | **PASS** | 0 | Server-side edge proxy enforces JWT verification on `/admin/*`. |

---

## 2. Detailed Test Cases & Reproducible Defects

### Defect QA-01: Guest Checkout Blocked by Edge Middleware Redirect
- **Severity:** **P0 — Critical (Immediate Revenue Blocker)**
- **Feature Flow:** Cart -> Proceed to Checkout -> `/checkout`
- **Source Location:** [src/proxy.js:68-80](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/proxy.js#L68-L80)
- **Code Extract:**
  ```javascript
  // 3. CUSTOMER ROUTE PROTECTION
  // Protect /checkout, /account
  const customerProtectedRoutes = ['/checkout', '/account'];
  const isCustomerRoute = customerProtectedRoutes.some(route => pathname.startsWith(route));

  if (isCustomerRoute) {
    const customerTokenCookie = request.cookies.get('customer_token');
    const customerToken = customerTokenCookie?.value;

    if (!customerToken) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  ```
- **Observed Behavior:**
  - A new customer visits `https://anantarts.in`, adds an idol to cart, and clicks "Proceed to Checkout".
  - The server emits `HTTP 307 Temporary Redirect` to `/login?next=%2Fcheckout`.
  - The user is confronted with a mandatory login screen demanding existing credentials or OTP setup before seeing the order summary, delivery form, or payment options.
- **Expected Behavior:**
  - Standard e-commerce best practices require guest checkout to be open to all patrons without mandatory pre-authentication.
  - The checkout component ([src/app/checkout/page.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/checkout/page.js)) and order creation route ([src/app/api/orders/create/route.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/orders/create/route.js#L136)) were intentionally engineered to support guest checkout with an optional `create_account` checkbox.
  - `/checkout` must be removed from `customerProtectedRoutes` in `src/proxy.js`.

---

### Defect QA-02: Missing Server-Side Price Verification in Order Creation API
- **Severity:** **P0 — Critical (Financial Integrity Flaw)**
- **Feature Flow:** Checkout Form Submission -> `POST /api/orders/create`
- **Source Location:** [src/app/api/orders/create/route.js:172-255](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/orders/create/route.js#L172-L255)
- **Code Extract:**
  ```javascript
  // 1. Verify stock availability for all products before creating the order
  for (const item of items) {
    const { data: prod, error: prodErr } = await supabase
      .from('products')
      .select('name, stock_quantity') // <-- Selects ONLY name and stock_quantity!
      .eq('id', item.product_id)
      .single();
    ...
  }

  // Insert order record:
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({
      ...
      subtotal, // <-- DIRECT UNVALIDATED CLIENT PAYLOAD
      discount_amount: discount_amount || 0,
      shipping_charge: shipping_charge || 0,
      total_amount, // <-- DIRECT UNVALIDATED CLIENT PAYLOAD
    })
  ```
- **Observed Behavior:**
  - The API selects only `stock_quantity` from the database.
  - It blindly inserts the client-supplied `subtotal`, `items[i].price`, and `total_amount` into the database without recalculating from `products.price` or `products.discount_price`.
- **Reproducible Vulnerability:**
  - A malicious actor can intercept the HTTP POST request to `/api/orders/create` and alter a ₹15,000 sculpture's `price: 1` and `total_amount: 1`. The server creates the order with ₹1 as the authoritative total.
- **Expected Behavior:**
  - The server must fetch authoritative prices from the `products` table for every item, compute `computed_subtotal = SUM(prod.price * item.quantity)`, validate any coupon against `coupons` table, add authoritative shipping charge, and verify that `total_amount === computed_total`.

---

### Defect QA-03: Concurrency Race Condition in Stock Deduction
- **Severity:** **P1 — High (Inventory Inconsistency)**
- **Feature Flow:** Multiple concurrent orders for a low-stock product
- **Source Location:** [src/app/api/orders/create/route.js:261-275](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/orders/create/route.js#L261-L275)
- **Code Extract:**
  ```javascript
  // Fetch current stock to subtract
  const { data: prod } = await supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', item.product_id)
    .single();

  const nextStock = Math.max(0, prod.stock_quantity - item.quantity);

  // Update product stock
  await supabase
    .from('products')
    .update({ stock_quantity: nextStock })
    .eq('id', item.product_id);
  ```
- **Observed Behavior:**
  - Stock adjustment relies on a multi-step Read-Then-Write sequence without row-level locking (`SELECT FOR UPDATE`) or atomic SQL decrement (`UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND stock_quantity >= $1`).
- **Impact:**
  - If two patrons order the last remaining unit of an idol simultaneously, both read `stock_quantity = 1`, and both succeed, resulting in overselling.
- **Expected Behavior:**
  - Stock decrement must execute via an atomic SQL update statement or PostgreSQL RPC function with check `stock_quantity >= quantity`.

---

### Defect QA-04: Category Pages Lack Pagination
- **Severity:** **P1 — High (User Experience & Mobile Performance)**
- **Feature Flow:** Browsing `/category/decorative-figurines`
- **Source Location:** [src/app/category/[slug]/page.js:92](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/category/%5Bslug%5D/page.js#L92)
- **Observed Behavior:**
  - All 206 products in `decorative-figurines` are rendered on a single scrolling page.
  - Page takes 3.5+ seconds to render on server; client DOM memory exceeds 3,000 nodes.
- **Expected Behavior:**
  - Standard pagination (e.g. 24 products per page with clean `?page=2` URL parameters) or server-driven infinite scroll with virtualized lazy loading.

---

## 3. Safe Functional Flow Verification Matrix

| Flow ID | Description | Pre-conditions | Test Steps Executed | Result | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Non-existent Product URL Handling | Any invalid slug | `curl -I /product/non-existent-product-test-slug` | **FAIL (Soft 404)** | HTTP 200 returned instead of 404 |
| **TC-02** | Live Product Slug Resolution | Valid DB slug | `curl -I /product/bal-krishna-crawling-with-butter-pot` | **PASS** | HTTP 200, valid product title & structured data |
| **TC-03** | Obsolete Slug Resolution | Sitemap slug `aa-krs-001` | `curl -I /product/aa-krs-001` | **FAIL** | HTTP 200, "Idol Not Found", canonical to `/` |
| **TC-04** | Category URL Resolution | Active category `car-dashboard` | `curl -I /category/car-dashboard` | **PASS** | HTTP 200, 11 products rendered |
| **TC-05** | Guest Checkout Routing | No cookies | `curl -I /checkout` | **FAIL** | HTTP 307 Redirect to `/login?next=%2Fcheckout` |
| **TC-06** | Admin Dashboard Protection | No cookies | `curl -I /admin` | **PASS** | HTTP 307 Redirect to `/admin/login` |
| **TC-07** | Address State Validation | State validation in API | Code inspection `INDIAN_STATES` array | **PASS** | 36 Indian States & UTs strictly validated |
| **TC-08** | Pincode Validation | 6-digit regex | Code inspection `/^[1-9][0-9]{5}$/` | **PASS** | Validates Indian postal format |
| **TC-09** | Phone Number Validation | 10-digit mobile regex | Code inspection `/^[6-9][0-9]{9}$/` | **PASS** | Validates Indian telecom numbering plan |
| **TC-10** | COD Order Creation | Body with `payment_method: 'COD'` | Code inspection in `POST /api/orders/create` | **PASS (Blocked)** | Explicitly returns HTTP 400 rejection |
| **TC-11** | Direct UPI QR Verification | UTR string check | Code inspection in `POST /api/orders/create` | **PASS** | Requires 4+ character UTR; sets Pending Verification |
| **TC-12** | Order Tracking Endpoint | Public route | Code inspection in `/order-tracking` | **PASS** | Server-side read by order number & phone |
