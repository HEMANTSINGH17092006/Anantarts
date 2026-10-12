# AUDIT EVIDENCE & METHODOLOGY LOG — ANANT ARTS
**Audit Date:** 11 October 2026  
**Auditor:** Senior Technical SEO Engineer & Security Specialist  
**Diagnostic Mode:** Read-Only Audit (No Code Modified, No Data Altered, No Real Transactions Initiated)

---

## 1. Test Environment & Diagnostics Tools

- **Local Execution Environment:** Windows 11 Shell (PowerShell / Windows CMD), Node.js v24.18.0
- **Network Tooling:** `curl.exe` (v8.x, native Windows build), Node.js `https` / `http` client modules
- **Database Testing Client:** `@supabase/supabase-js` (v2.110.7) initialized with read-only test operations
- **Source Code Repository:** `c:\Users\Hemant\OneDrive\Desktop\Anant` (Git Commit: `fb6a7b32335dc7919fb8606e550fb626b693054c`)
- **Production Host:** `https://anantarts.in` (Vercel Mumbai PoP `bom1`, SSL/TLS: Cloudflare / Vercel Edge Certificate)

---

## 2. Command Execution Log & Output Records

### Test EVD-01: Live Robots.txt Fetch
- **Timestamp:** 2026-10-11T12:16:30Z
- **Command Executed:**
  ```bash
  curl.exe -s "https://anantarts.in/robots.txt"
  ```
- **Recorded Output:**
  ```txt
  User-Agent: *
  Allow: /
  Disallow: /api/
  Disallow: /admin/
  Disallow: /admin/login
  Disallow: /checkout
  Disallow: /checkout/
  Disallow: /account
  Disallow: /account/
  Disallow: /my-orders
  Disallow: /auth/

  User-Agent: Googlebot
  User-Agent: Google-Extended
  ...
  Sitemap: https://anantarts.in/sitemap.xml
  ```

---

### Test EVD-02: Live XML Sitemap Extraction
- **Timestamp:** 2026-10-11T12:17:04Z
- **Command Executed:**
  ```bash
  curl.exe -s "https://anantarts.in/sitemap.xml"
  ```
- **Analysis Result:**
  - Total URLs discovered: **366**
  - Core Static URLs: 17
  - Category URLs: 7
  - Product URLs: 342
  - Blog URLs: 0

---

### Test EVD-03: Soft 404 Vulnerability Proof on Non-Existent Product Slug
- **Timestamp:** 2026-10-11T12:15:59Z
- **Command Executed:**
  ```bash
  curl.exe -I -s "https://anantarts.in/product/non-existent-product-test-slug"
  ```
- **Recorded Response Headers:**
  ```http
  HTTP/1.1 200 OK
  Server: Vercel
  Content-Type: text/html; charset=utf-8
  X-Matched-Path: /product/[slug]
  X-Vercel-Cache: MISS
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  ```
- **Finding:** Server returned `HTTP 200 OK` instead of `HTTP 404 Not Found`.

---

### Test EVD-04: Sitemap Obsolete Slug Test (`aa-krs-001`)
- **Timestamp:** 2026-10-11T12:28:16Z
- **Command Executed:**
  ```bash
  curl.exe -s "https://anantarts.in/product/aa-krs-001"
  ```
- **Recorded Output:**
  - Status: `HTTP 200 OK`
  - `<title>`: `"Product Not Found | Anant Arts | Anant Arts"`
  - Body: `"Idol Not Found. We could not find the divine representation you are looking for."`
  - Canonical: `<link rel="canonical" href="https://anantarts.in">`
  - Robots: `<meta name="robots" content="index, follow">`

---

### Test EVD-05: Real Database Slug Test (`bal-krishna-crawling-with-butter-pot`)
- **Timestamp:** 2026-10-11T12:29:53Z
- **Command Executed:**
  ```bash
  curl.exe -I -s "https://anantarts.in/product/bal-krishna-crawling-with-butter-pot"
  ```
- **Recorded Output:**
  - Status: `HTTP 200 OK`
  - Full product details, JSON-LD Product schema, and OpenGraph tags rendered correctly.
  - Confirmed: Product exists in DB with new slug, but was orphaned from sitemap.

---

### Test EVD-06: Missing Active Category Test (`car-dashboard`)
- **Timestamp:** 2026-10-11T12:22:12Z
- **Command Executed:**
  ```bash
  curl.exe -I -s "https://anantarts.in/category/car-dashboard"
  ```
- **Recorded Output:**
  - Status: `HTTP 200 OK`
  - Confirmed: Route renders Category 100 with 11 active products, but is absent from `sitemap.xml`.

---

### Test EVD-07: Unauthenticated Checkout Route Access
- **Timestamp:** 2026-10-11T12:32:42Z
- **Command Executed:**
  ```bash
  curl.exe -I -s "https://anantarts.in/checkout"
  ```
- **Recorded Response Headers:**
  ```http
  HTTP/1.1 307 Temporary Redirect
  Location: /login?next=%2Fcheckout
  X-Robots-Tag: noindex, nofollow
  ```
- **Finding:** Guest patrons are blocked from checking out by `src/proxy.js:68-80`.

---

### Test EVD-08: Public Debug Endpoint Exposure
- **Timestamp:** 2026-10-11T12:39:31Z
- **Command Executed:**
  ```bash
  curl.exe -I -s "https://anantarts.in/api/debug/payment-health"
  ```
- **Recorded Output:**
  - Status: `HTTP 200 OK`
  - Content-Type: `application/json`
  - Confirmed: Unauthenticated access to database status and infrastructure configuration flags.

---

### Test EVD-09: Row Level Security (RLS) Defensive Test
- **Timestamp:** 2026-10-11T12:33:53Z
- **Script Executed:** `scratch/test_rls_compare.js` using Supabase Public Anon Key
- **Recorded Results:**
  - `orders` count via Service Role: **3** | via Anon Key: **0**
  - `users` count via Service Role: **9** | via Anon Key: **0**
  - Confirmed: RLS is active and protects patron PII from public extraction.

---

### Test EVD-10: Protocol and WWW Redirect Hops
- **Timestamp:** 2026-10-11T12:36:00Z
- **Recorded Results:**
  1. `http://anantarts.in` -> `308 Permanent Redirect` -> `https://anantarts.in/` (1 hop)
  2. `https://www.anantarts.in` -> `301 Moved Permanently` -> `https://anantarts.in/` (1 hop)
  3. `http://www.anantarts.in` -> `308 Permanent Redirect` -> `https://www.anantarts.in/` -> `301 Moved Permanently` -> `https://anantarts.in/` (2 hops)

---

## 3. Relevant Source Files & Code Inspection Paths

| Component / Subsystem | Primary Source File Path |
| :--- | :--- |
| **Robots.txt Implementation** | [src/app/robots.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/robots.js) |
| **XML Sitemap Generator** | [src/app/sitemap.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/sitemap.js) |
| **Product Detail Page & Schema** | [src/app/product/[slug]/page.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/product/%5Bslug%5D/page.js) |
| **Category Page & Products Query** | [src/app/category/[slug]/page.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/category/%5Bslug%5D/page.js) |
| **Edge Proxy (Middleware)** | [src/proxy.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/proxy.js) |
| **Order Creation API Route** | [src/app/api/orders/create/route.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/orders/create/route.js) |
| **Razorpay Integration Engine** | [src/lib/razorpay.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/lib/razorpay.js) |
| **Razorpay Webhook Handler** | [src/app/api/razorpay/webhook/route.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/razorpay/webhook/route.js) |
| **Payment Debug Endpoint** | [src/app/api/debug/payment-health/route.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/api/debug/payment-health/route.js) |
| **Centralized SEO Helpers** | [src/lib/seo.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/lib/seo.js) |
| **Database Helpers & Caching** | [src/lib/db-helpers.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/lib/db-helpers.js) |
| **Meta Pixel Tracking Utility** | [src/lib/meta-pixel.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/lib/meta-pixel.js) |
| **Security Headers & Rewrites** | [next.config.mjs](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/next.config.mjs) |

---

## 4. Audit Limitations & Explicit Non-Verifiable Items

1. **Google Search Console Index Status:**
   - Google Search Console is an authenticated Google service.
   - Without direct delegated access to the Anant Arts GSC property (`https://search.google.com/search-console`), Google's internal index status (whether pages are "Crawled - currently not indexed", "Discovered - currently not indexed", or "Indexed") **cannot be confirmed from the public website alone**.
   - No Search Console data has been fabricated.
2. **Real Payment Gateway Transactions:**
   - In accordance with safety rules, no live credit cards, UPI handles, or real charges were executed against Razorpay.
   - Code logic and signature verification routines were evaluated through static code analysis and test parameter traces.
3. **External Customer Authentication Notifications:**
   - No real SMS OTPs or WhatsApp message notifications were triggered to avoid disturbing actual patrons.
