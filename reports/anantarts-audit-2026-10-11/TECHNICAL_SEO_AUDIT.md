# TECHNICAL SEO AUDIT — ANANT ARTS
**Audit Date:** 11 October 2026  
**Target Domain:** `https://anantarts.in`  
**Platform:** Next.js 16.2.10 (App Router), React 19.2.4, Supabase (PostgreSQL), Vercel Serverless Hosting  
**Inspector:** Senior Technical SEO & Google Search Indexing Specialist  
**Diagnostic Status:** Safe, Read-Only Audit (Code and Database Untouched)

---

## 1. Executive Summary of Technical SEO Findings

| Audit Dimension | Measured Status | Risk / Issue Count | Severity |
| :--- | :--- | :--- | :--- |
| **Robots.txt Directives** | Valid syntax, correct Sitemap reference, permissive AI/Search rules | 0 Syntax Errors; private routes disallowed | **Low** |
| **Sitemap Discovery & Sync** | 366 URLs in live sitemap XML vs 342 products + 8 categories in DB | 7 obsolete slugs in sitemap; 7 new product slugs orphaned; 1 active category (`car-dashboard`) missing | **Critical** |
| **Soft 404 Error Handling** | Missing/deleted products return `HTTP 200 OK` with canonical to homepage | All 404 product requests return HTTP 200 OK | **Critical** |
| **Canonical URL Consistency** | Product canonicals self-referential; homepage & static pages configured | Soft-404 pages set canonical to `https://anantarts.in`; missing redirect for changed slugs | **High** |
| **Redirect Architecture** | HTTP to HTTPS (308); `https://www.anantarts.in` to non-www (301) | 2-hop redirect chain on `http://www.anantarts.in` | **Medium** |
| **Structured Data (JSON-LD)** | Product, Offer, BreadcrumbList, Organization, WebSite, FAQPage | Raw HTML in product description schema; missing `hasMerchantReturnPolicy`, `shippingDetails` | **High** |
| **Category Pagination** | Category pages render entire catalog in single request (up to 206 products) | 951 KB initial HTML payload on category pages; no `rel="next"` or page parameter | **High** |

---

## 2. Robots.txt Live Audit & Evidence

### 2.1 Live Production Output
**URL Tested:** `https://anantarts.in/robots.txt`  
**HTTP Status:** `200 OK`  
**Content-Type:** `text/plain; charset=utf-8`  
**Source Implementation:** [src/app/robots.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/robots.js)

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
User-Agent: Bingbot
User-Agent: GPTBot
User-Agent: ChatGPT-User
User-Agent: OAI-SearchBot
User-Agent: ClaudeBot
User-Agent: Claude-SearchBot
User-Agent: Claude-User
User-Agent: PerplexityBot
User-Agent: Perplexity-User
User-Agent: Applebot
User-Agent: Amazonbot
User-Agent: cohere-ai
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

Sitemap: https://anantarts.in/sitemap.xml
```

### 2.2 Robots Directives Analysis
1. **Strengths:**
   - Clearly disallows private administrative routes (`/admin/`, `/api/`, `/checkout`, `/account`, `/my-orders`).
   - Correctly references the canonical XML sitemap: `https://anantarts.in/sitemap.xml`.
   - Explicitly welcomes modern AI and search crawlers (Googlebot, Bingbot, GPTBot, ClaudeBot, PerplexityBot, Applebot).
2. **Observations & Improvements:**
   - Redundancy: The list of disallowed routes is duplicated identically between `User-Agent: *` and the bot-specific block. While valid, search engines parse `User-Agent: *` unless a specific bot match overrides it.
   - `/auth/` is disallowed, but customer login (`/login`) and register (`/register`) are not explicitly disallowed in `robots.txt` (though protected with `X-Robots-Tag: noindex, nofollow` in [next.config.mjs](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/next.config.mjs#L88-L106)).

---

## 3. Sitemap Audit & Catalogue Discrepancy Investigation

### 3.1 Live Sitemap Composition
**URL Tested:** `https://anantarts.in/sitemap.xml`  
**Total URLs in Live XML:** **366**
- **Static Core Pages:** 17 URLs
  - `https://anantarts.in` (Priority 1.0)
  - `https://anantarts.in/shop` (Priority 0.9)
  - `https://anantarts.in/collections` (Priority 0.85)
  - `https://anantarts.in/corporate-gifts` (Priority 0.85)
  - `https://anantarts.in/materials` (Priority 0.8)
  - `https://anantarts.in/occasions` (Priority 0.8)
  - `https://anantarts.in/about` (Priority 0.7)
  - `https://anantarts.in/consultation` (Priority 0.75)
  - `https://anantarts.in/blog` (Priority 0.75)
  - `https://anantarts.in/contact` (Priority 0.7)
  - `https://anantarts.in/faq` (Priority 0.7)
  - `https://anantarts.in/order-tracking` (Priority 0.6)
  - `https://anantarts.in/shipping-policy` (Priority 0.5)
  - `https://anantarts.in/return-policy` (Priority 0.5)
  - `https://anantarts.in/refund-policy` (Priority 0.5)
  - `https://anantarts.in/privacy-policy` (Priority 0.5)
  - `https://anantarts.in/terms-and-conditions` (Priority 0.5)
- **Category URLs in Sitemap:** **7 URLs**
  - `https://anantarts.in/category/spiritual-collection`
  - `https://anantarts.in/category/home-decor`
  - `https://anantarts.in/category/decorative-figurines`
  - `https://anantarts.in/category/corporate-gifts`
  - `https://anantarts.in/category/customized-gifts`
  - `https://anantarts.in/category/festival-collection`
  - `https://anantarts.in/category/wooden-handicrafts`
- **Product URLs in Sitemap:** **342 URLs**
- **Blog Post URLs in Sitemap:** **0 URLs** (No published blogs in DB)

### 3.2 Root Cause of the Discrepancy (100 URLs vs 321 vs 342)
The business previously reported seeing crawl reports with approximately 100 sitemap URLs (including 76 product URLs) and 10 crawled pages returning HTTP 200.
**Evidence Discovered:**
1. **Catalog Chronology:**
   - 21 seed products were created in July/August 2026 (`2026-07-21` and `2026-08-02`).
   - On **8 October 2026 at 23:23 UTC** (Git commit `52b4211515e6e3193513b59ccc5ecb7dc5a28f22`), a bulk import of **321 products** was executed via `scripts/import_excel_catalog.js`.
   - Total published products in Supabase: **21 + 321 = 342 products**.
2. **Crawl Lag vs Google Index Status:**
   - The crawl report showing ~76 product URLs reflects a previous state before the 321 products were processed by Googlebot. Google does not crawl hundreds of newly submitted e-commerce URLs simultaneously; it queues them over several weeks based on host crawl budget.
   - A 200 HTTP response during a crawl only confirms that the page is reachable, **not** that Google has added it to its Search index.

### 3.3 Critical Findings: 7 Broken Slugs in Sitemap & 7 Orphaned Products
When comparing the 342 product URLs in `https://anantarts.in/sitemap.xml` directly against the database `products` table, **7 URLs do not match current database slugs**:

| Sitemap URL (Returning Soft 404) | Expected Database Slug | Product ID & Name | SKU | Severity |
| :--- | :--- | :--- | :--- | :--- |
| `https://anantarts.in/product/aa-krs-001` | `bal-krishna-crawling-with-butter-pot` | ID 40: Bal Krishna Crawling with Butter Pot | AA-KRS-001 | **Critical** |
| `https://anantarts.in/product/aa-rkc-004` | `radha-krishna-dancing` | ID 59: Radha Krishna Dancing | AA-RKC-004 | **Critical** |
| `https://anantarts.in/product/aa-gan-004` | `ganesha-reclining` | ID 57: Ganesha Reclining | AA-GAN-004 | **Critical** |
| `https://anantarts.in/product/aa-han-002` | `hanuman-orange-gold-on-gada` | ID 52: Hanuman Orange Gold on Gada | AA-HAN-002 | **Critical** |
| `https://anantarts.in/product/aa-gan-002` | `ganesha-sitting-shree-ganeshaya-namah-base` | ID 46: Ganesha Sitting - Shree Ganeshaya Namah Base | AA-GAN-002 | **Critical** |
| `https://anantarts.in/product/aa-tbj-001` | `tirupati-balaji-standing` | ID 44: Tirupati Balaji Standing | AA-TBJ-001 | **Critical** |
| `https://anantarts.in/product/aa-gan-001` | `ganesha-sitting-white-gold` | ID 43: Ganesha Sitting - White Gold | AA-GAN-001 | **Critical** |

**What occurs when a crawler hits these 7 URLs:**
1. The server responds with **`HTTP 200 OK`**.
2. The page renders `"Idol Not Found"`.
3. The `<title>` renders `"Product Not Found | Anant Arts | Anant Arts"`.
4. The `<link rel="canonical">` points to the homepage `https://anantarts.in`.
5. The robots tag directive specifies `index, follow`.
6. Google Search Console marks this as a **Soft 404** or **Duplicate without user-selected canonical**, degrading the domain's indexing quality score.
7. The 7 real published products (`/product/bal-krishna-crawling-with-butter-pot`, etc.) are completely absent from the XML sitemap.

### 3.4 Missing Active Category: `car-dashboard`
- **Database Status:** Category ID 100 (`Car Dashboard`, slug: `car-dashboard`, `is_hidden: 0`, `is_featured: 1`) contains **11 active products**.
- **Live URL Status:** `https://anantarts.in/category/car-dashboard` returns `HTTP 200 OK`.
- **Sitemap Status:** **MISSING** from `https://anantarts.in/sitemap.xml`.
- **Root Cause:** In [src/lib/db-helpers.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/lib/db-helpers.js#L56-L72), `getCategories` is wrapped in `unstable_cache` with tag `['categories']`. When Category 100 was created on 9 October 2026, the Next.js Data Cache in production was not revalidated. As a result, the sitemap generator served the stale 7-category cache.

---

## 4. Soft-404 Defect Analysis & Exact Source Code Location

### 4.1 Identified Vulnerability
In Next.js App Router, when a dynamic route does not call `notFound()` from `next/navigation`, Next.js defaults to returning `HTTP 200 OK`.

### 4.2 Exact Source Code
File: [src/app/product/[slug]/page.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/product/%5Bslug%5D/page.js#L18-L30) and [page.js lines 101-112](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/product/%5Bslug%5D/page.js#L101-L112)

```javascript
// generateMetadata:
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const product = await getProductBySlug(resolvedParams.slug);
  if (!product) {
    return {
      title: 'Product Not Found | Anant Arts',
      description: 'The requested idol could not be found.',
    }; // <-- Missing robots: { index: false } or notFound()
  }
...
}

// ProductDetailPage:
export default async function ProductDetailPage({ params }) {
  ...
  if (!product) {
    return (
      <div style={{ background: 'var(--bg-cream)', padding: '5rem 0', textAlign: 'center' }}>
        <h2>Idol Not Found</h2>
        ...
      </div>
    ); // <-- Returns JSX without calling notFound(), causing HTTP 200 OK!
  }
```

### 4.3 Expected Standard
When `product` is `null`:
1. `notFound()` from `next/navigation` must be invoked in `ProductDetailPage`.
2. Next.js immediately renders `not-found.js` and emits an RFC-compliant `HTTP 404 Not Found` response header.
3. This prevents soft-404 indexation by Googlebot.

---

## 5. Canonical URLs & Redirect Directives

### 5.1 Protocol & Subdomain Directives
1. **HTTP to HTTPS:**
   - Request to `http://anantarts.in` returns `308 Permanent Redirect` with `Location: https://anantarts.in/`. (Correct).
2. **WWW Canonicalization:**
   - Request to `https://www.anantarts.in` returns `301 Moved Permanently` with `Location: https://anantarts.in/`. (Correct).
   - Request to `http://www.anantarts.in` returns `308` to `https://www.anantarts.in/`, which then returns `301` to `https://anantarts.in/`. (2-hop redirect chain).
3. **Trailing Slash Consistency:**
   - Requests to `https://anantarts.in/shop/` resolve without trailing slash (`https://anantarts.in/shop`). Vercel `cleanUrls: true` enforces clean extensionless and trailing-slash consistent routing.

### 5.2 X-Robots-Tag Headers
Configured in [next.config.mjs](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/next.config.mjs#L87-L106):
```javascript
{
  source: '/(admin|account|checkout|my-orders|api|auth|login|register)/:path*',
  headers: [
    { key: 'X-Robots-Tag', value: 'noindex, nofollow' }
  ]
}
```
**Verification Evidence:**
- `curl -I https://anantarts.in/checkout` -> `X-Robots-Tag: noindex, nofollow` confirmed present.
- `curl -I https://anantarts.in/admin/login` -> `X-Robots-Tag: noindex, nofollow` confirmed present.
- Storefront pages (`/`, `/shop`, `/category/*`, `/product/*`) do NOT send `X-Robots-Tag` and default to `index, follow`. (Correct).

---

## 6. Structured Data & Rich Results Audit

### 6.1 Schemas Detected in Production
- **Homepage:** `Organization`, `WebSite` with `SearchAction` (`/shop?search={search_term_string}`).
- **Product Detail Pages:** `Product`, `Offer`, `BreadcrumbList`, `Organization`, `WebSite`.
- **Category Pages:** `BreadcrumbList`, `CollectionPage`.
- **Collections Overview:** `BreadcrumbList`, `CollectionPage`.
- **FAQ Page:** `FAQPage` (7 questions and answers).
- **Policy Pages:** `BreadcrumbList`.

### 6.2 Product Schema Validation Breakdown
Target: [src/app/product/[slug]/page.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/product/%5Bslug%5D/page.js#L145-L173)

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Black & Gold Lord Ganesha Idol",
  "description": "<p>Enhance your home...</p>",
  "sku": "AA-GAN-003",
  "brand": { "@type": "Brand", "name": "Anant Arts" },
  "image": "https://bpysijuecdmadnqsjsym.supabase.co/...",
  "url": "https://anantarts.in/product/black-gold-lord-ganesha-idol",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "INR",
    "price": 1499,
    "priceValidUntil": "2026-11-10",
    "availability": "https://schema.org/InStock",
    "seller": { "@type": "Organization", "name": "Anant Arts", "url": "https://anantarts.in" }
  }
}
```

### 6.3 Schema Inconsistencies & Recommendations
1. **Raw HTML in `description`:**
   - In `productSchema`, `product.description` is injected raw without stripping HTML tags. Schema.org and Google Search guidelines require text descriptions without HTML formatting tags.
2. **Missing Google Merchant Center & Rich Results Fields:**
   - `hasMerchantReturnPolicy`: Google Search Console generates non-critical issues if absent. Can reference `https://anantarts.in/return-policy`.
   - `shippingDetails`: Absence triggers merchant listing warnings. Can reference standard pan-India delivery details.
   - `itemCondition`: Should be specified as `https://schema.org/NewCondition`.
3. **Genuine Reviews & AggregateRating:**
   - The codebase correctly checks `if (avgRating && reviews?.length > 0)` before emitting `aggregateRating`. Because there are 0 reviews in the database, fake review ratings are **not** emitted. This is compliant with Google's deceptive reviews policies.

---

## 7. Technical SEO Issue Register & Action Matrix

| Issue ID | Affected URL / Pattern | Severity | Source Location | Recommended Remediation |
| :--- | :--- | :--- | :--- | :--- |
| **SEO-01** | `https://anantarts.in/product/non-existent-*` | **Critical** | `src/app/product/[slug]/page.js:101` | Call `notFound()` from `next/navigation` when product is null to return HTTP 404 instead of HTTP 200. |
| **SEO-02** | 7 Obsolete Slugs in `sitemap.xml` (`aa-krs-001`, `aa-rkc-004`, etc.) | **Critical** | `src/app/sitemap.js`, Supabase DB | Add permanent 301 redirects in `next.config.mjs` from old SKU slugs to descriptive slugs, and purge sitemap cache. |
| **SEO-03** | `https://anantarts.in/category/car-dashboard` | **High** | `src/lib/db-helpers.js:56`, `src/app/sitemap.js` | Revalidate `categories` cache tag in Next.js Data Cache so `car-dashboard` is emitted in `sitemap.xml`. |
| **SEO-04** | All `/category/[slug]` pages | **High** | `src/app/category/[slug]/page.js:92` | Implement pagination (e.g. 24 products per page) to eliminate 951 KB initial HTML payloads. |
| **SEO-05** | `http://www.anantarts.in` | **Medium** | Vercel DNS / Redirect config | Consolidate `http://www.*` redirect directly to `https://anantarts.in/` to remove 2-hop redirect chain. |
| **SEO-06** | Product Schema `description` | **Medium** | `src/app/product/[slug]/page.js:149` | Strip HTML tags before passing `description` into `productSchema`. |
| **SEO-07** | Product Schema Merchant fields | **Low** | `src/app/product/[slug]/page.js:154` | Add `hasMerchantReturnPolicy`, `shippingDetails`, and `itemCondition: "https://schema.org/NewCondition"`. |
