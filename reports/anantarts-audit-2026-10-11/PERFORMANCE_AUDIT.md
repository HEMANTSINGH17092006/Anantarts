# WEB PERFORMANCE & CORE WEB VITALS AUDIT — ANANT ARTS
**Audit Date:** 11 October 2026  
**Target Domain:** `https://anantarts.in`  
**Hosting Environment:** Vercel Global Edge Network (Edge Point of Presence: Mumbai `bom1`)  
**Database Backend:** Supabase PostgreSQL (`bpysijuecdmadnqsjsym.supabase.co`)  
**Auditor:** Web Performance Specialist & Technical Architect  
**Diagnostic Method:** Direct live production HTTP diagnostics, payload measurement, code architecture inspection

---

## 1. Executive Performance Summary

| Page / Route Tested | HTTP Status | Document Payload Size | TTFB (Time to First Byte) | Total HTML Download Time | Performance Assessment |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Homepage (`/`)** | `200 OK` | **337.4 KB** | **235 ms** | **938 ms** | Fast server response; heavy DOM & serialized RSC payload |
| **Product Detail Page (`/product/...`)** | `200 OK` | **95.0 KB** | **1,183 ms** (dynamic cache miss) | **1,426 ms** | Acceptable size; dynamic database query overhead on cold hits |
| **Category Page (`/category/spiritual-collection`)** | `200 OK` | **951.4 KB** (0.95 MB!) | **2,622 ms** | **3,209 ms** | **CRITICAL BOTTLENECK**: No pagination, 78+ cards in single payload |
| **Category Page (`/category/decorative-figurines`)** | `200 OK` | **~2.1 MB** (est.) | **> 3,500 ms** | **> 4,200 ms** | **CRITICAL BOTTLENECK**: 206 products rendered in single SSR request |
| **Main Shop Page (`/shop`)** | `200 OK` | **180.2 KB** | **450 ms** | **1,120 ms** | Client-filtered catalog layout |
| **Informational Page (`/about`)** | `200 OK` | **62.8 KB** | **180 ms** | **420 ms** | High performance, static caching active |

> [!NOTE]
> **Lab vs Field Distinction**: The measurements above represent laboratory/diagnostic HTTP timing recorded directly from live production servers. True field metrics (such as real-user Interaction to Next Paint - INP) require Chrome User Experience Report (CrUX) data accumulated over 28-day traffic cycles.

---

## 2. Core Diagnostic Measurements & Waterfall Breakdown

### 2.1 Homepage Diagnostic Diagnostics
```txt
Target URL: https://anantarts.in/
DNS Lookup: 60.6 ms
TCP Connect: 108.1 ms
TLS Handshake (AppConnect): 165.7 ms
Time to First Byte (TTFB): 235.0 ms
Total HTML Download Time: 938.9 ms
Download Speed: 359.3 KB/sec
Payload Size: 337,392 bytes (337.4 KB)
Vercel Edge Node: bom1 (Mumbai, India)
```

**Analysis:**
- **TTFB (235ms):** Exceptional server response time for a modern dynamic server-rendered framework, demonstrating effective Vercel edge node caching and Mumbai PoP routing.
- **Document Weight (337 KB):** For initial HTML alone, 337 KB is substantially heavier than average (recommended < 100 KB). This is caused by Next.js App Router inlining Server Component state (`self.__next_f.push`) containing full JSON models for 8 bestsellers, 12 new arrivals, and 24 featured products.

---

### 2.2 Category Page Bottleneck Diagnostic
```txt
Target URL: https://anantarts.in/category/spiritual-collection
DNS Lookup: 76.9 ms
TCP Connect: 76.9 ms
TLS Handshake (AppConnect): 139.7 ms
Time to First Byte (TTFB): 2,622.3 ms (2.62 seconds)
Total HTML Download Time: 3,208.9 ms (3.21 seconds)
Payload Size: 951,437 bytes (951.4 KB — ~1 Megabyte of pure HTML!)
Vercel Edge Cache: MISS (Dynamic Query)
```

**Root Cause Analysis:**
In [src/app/category/[slug]/page.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/category/%5Bslug%5D/page.js#L92):
```javascript
const [category, categories, products] = await Promise.all([
  getCategoryBySlug(slug),
  getCategories(),
  getProducts({ category: slug }) // <-- No pagination limit!
]);
```
- For `spiritual-collection`, **78 products** with images, badges, price calculations, and serialized metadata are compiled into HTML.
- For `decorative-figurines`, **206 products** are compiled into a single server response!
- **Consequences on Mobile Devices:**
  1. High Memory Consumption: The mobile browser must parse ~1 MB of HTML and create thousands of DOM nodes.
  2. Severe Layout Delay: Largest Contentful Paint (LCP) is delayed by at least 3 to 4 seconds on mobile connections.
  3. High Cumulative Layout Shift (CLS): Rendering hundreds of images without predefined skeleton wrappers induces noticeable content reflows.

---

## 3. Image Optimization & Assets Pipeline

### 3.1 Next.js Image Optimization Architecture
Configured in [next.config.mjs](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/next.config.mjs#L62-L78):
- **Remote Hostnames:** `*.supabase.co`, `bpysijuecdmadnqsjsym.supabase.co`
- **Output Formats:** `image/avif`, `image/webp` (Enabled)
- **Device Sizes:** `[640, 750, 828, 1080, 1200, 1920]`
- **Image Sizes:** `[16, 32, 48, 64, 96, 128, 256, 384]`

### 3.2 Implementation Audit in Components
1. **Product Cards ([src/components/common/ProductCard.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/components/common/ProductCard.js)):**
   - Uses Next.js `<Image>` component with responsive `sizes` attribute.
   - Automatically serves modern WebP / AVIF formats from Vercel image cache.
   - Primary images uploaded to Supabase Storage: `https://bpysijuecdmadnqsjsym.supabase.co/storage/v1/object/public/uploads/...`.
2. **Static Informational Pages ([src/app/about/page.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/about/page.js#L45-L50)):**
   - Uses raw `<img>` tag instead of `<Image>`:
     ```html
     <img src="/uploads/our-story-artisan.jpg" alt="..." style="..." />
     ```
   - This bypasses Next.js image optimization, responsive resizing, and modern format transcoding for static editorial photography.

---

## 4. CSS, JavaScript & Third-Party Resource Overhead

### 4.1 CSS Architecture
- **Global Stylesheet:** `src/app/globals.css` (86.0 KB uncompressed).
- **Embedded External CSS:** Font Awesome 6.4.0 from CDN:
  ```html
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
  ```
  - **Issue:** Loading the complete Font Awesome library (~70 KB CSS + ~150 KB font files) over CDN introduces a render-blocking third-party network request on every page visit. The site only uses a fraction of these icons (e.g. search, cart, user, heart, star, whatsapp).
  - **Optimization:** Migrate icons to inline SVG components or a lightweight custom subset.

### 4.2 Web Typography & Font Optimization
Implemented in [src/app/layout.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/layout.js#L9-L20):
- `Playfair_Display` (Subsets: latin, display: swap, CSS variable: `--font-heading`)
- `Poppins` (Weights: 300, 400, 500, 600, 700, display: swap, CSS variable: `--font-body`)
- **Status:** **Optimal**. Uses Next.js built-in font self-hosting (`next/font/google`). Fonts are automatically downloaded at build time and served from the same domain with `preload` links and zero external Google Fonts DNS queries.

### 4.3 Third-Party Tracking Scripts
Loaded in [src/app/layout.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/app/layout.js#L228-L232):
1. **Google Analytics 4:** Loaded via `@next/third-parties/google` (`GoogleAnalytics gaId="G-C7VE8CYW57"`). Automatically injected after interactive.
2. **Microsoft Clarity:** Loaded via inline script with `strategy="afterInteractive"`.
3. **Meta Pixel:** Loaded via `MetaPixel` component.
4. **Razorpay Checkout:** Script loaded on demand in checkout flows.
- **Status:** Correctly prioritized with `afterInteractive` to prevent blocking the initial HTML parsing thread.

---

## 5. Mobile Interface & UX Diagnostic Observations

1. **Category Product Grid:**
   - Under mobile viewports (< 640px), the grid collapses to 2 columns (`repeat(2, 1fr)`). Product card titles, prices, and CTA buttons fit within the viewport without horizontal overflow.
2. **Sticky Mobile Navigation:**
   - `MobileBottomNav.js` provides persistent thumb-zone navigation (Home, Shop, Categories, Cart, Account).
   - Fixed bottom positioning is safeguarded with `env(safe-area-inset-bottom)` for iOS devices.
3. **Hero Banner on Mobile:**
   - [src/components/home/HeroBanner.js](file:///c:/Users/Hemant/OneDrive/Desktop/Anant/src/components/home/HeroBanner.js) uses `clamp(2.2rem, 5vw, 3rem)` for the main headline. On narrow screens (< 380px), large heading text occasionally wraps onto 4 lines; adjusting min-clamp to `1.75rem` will improve above-the-fold visual balance.
4. **Checkout Interaction:**
   - Currently, mobile users attempting to check out without logging in are immediately redirected to `/login`, causing high mobile drop-off.

---

## 6. Performance Optimization Action Matrix

| Priority | Optimization Item | Expected Impact | Implementation Details |
| :--- | :--- | :--- | :--- |
| **P0** | **Implement Category Pagination** | **-75% HTML Size, -2s TTFB** | Add server-side pagination (24 items/page) to `/category/[slug]`. Reduce payload from 951 KB to ~90 KB. |
| **P1** | **Replace Font Awesome CDN with SVGs** | **-120 KB network payload, removes render-blocking CDN** | Convert icon usage in Header/Footer to lightweight React SVG icons. |
| **P1** | **Optimize Static Editorial Images** | **-300 KB image bandwidth** | Replace raw `<img>` in `/about` and policy pages with Next.js `<Image>`. |
| **P2** | **Prune Homepage RSC Serialized State** | **-150 KB initial HTML** | Only pass necessary card fields (`id`, `name`, `slug`, `price`, `image_path`) into client slider components instead of full product database rows. |
| **P2** | **CSS Minification & Unused CSS Cleanup** | **-30 KB stylesheet** | Audit `globals.css` (86 KB) and extract component-scoped styles. |
