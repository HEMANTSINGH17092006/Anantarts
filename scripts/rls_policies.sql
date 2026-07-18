-- ============================================================
-- ANANT ARTS — ROW LEVEL SECURITY (RLS) POLICIES
-- Run this script in your Supabase SQL Editor
-- ============================================================
-- This script enables RLS on all tables and defines:
--   - Public READ access for storefront content
--   - Service-role-only WRITE access for mutations
--   - Admin-only access for sensitive tables
-- ============================================================

-- =====================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- =====================================
-- 2. DROP EXISTING POLICIES (Clean Slate)
-- =====================================

DO $$ 
DECLARE
  tbl text;
  pol text;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, tbl);
    END LOOP;
  END LOOP;
END $$;

-- =====================================
-- 3. PUBLIC STOREFRONT: CATEGORIES
-- Anon can read non-hidden categories
-- =====================================

CREATE POLICY "Public can read visible categories"
ON public.categories
FOR SELECT
TO anon, authenticated
USING (is_hidden = 0 OR is_hidden IS NULL);

CREATE POLICY "Service role can manage categories"
ON public.categories
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================
-- 4. PUBLIC STOREFRONT: PRODUCTS
-- Anon can read published products only
-- =====================================

CREATE POLICY "Public can read published products"
ON public.products
FOR SELECT
TO anon, authenticated
USING (is_published = 1);

CREATE POLICY "Service role can manage products"
ON public.products
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================
-- 5. PRODUCT IMAGES
-- =====================================

CREATE POLICY "Public can read product images"
ON public.product_images
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Service role can manage product images"
ON public.product_images
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================
-- 6. BANNERS — public can read active
-- =====================================

CREATE POLICY "Public can read active banners"
ON public.banners
FOR SELECT
TO anon, authenticated
USING (is_active = 1);

CREATE POLICY "Service role can manage banners"
ON public.banners
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================
-- 7. WEBSITE SETTINGS — public read only
-- =====================================

CREATE POLICY "Public can read website settings"
ON public.website_settings
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Service role can manage settings"
ON public.website_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================
-- 8. TESTIMONIALS — public read approved
-- =====================================

CREATE POLICY "Public can read approved testimonials"
ON public.testimonials
FOR SELECT
TO anon, authenticated
USING (is_approved = 1);

CREATE POLICY "Service role can manage testimonials"
ON public.testimonials
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================
-- 9. BLOGS — public read published
-- =====================================

CREATE POLICY "Public can read published blogs"
ON public.blogs
FOR SELECT
TO anon, authenticated
USING (is_published = 1);

CREATE POLICY "Service role can manage blogs"
ON public.blogs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================
-- 10. REVIEWS — public read approved, service role writes
-- =====================================

CREATE POLICY "Public can read approved reviews"
ON public.reviews
FOR SELECT
TO anon, authenticated
USING (is_approved = 1);

-- Allow new review submissions via API route (service role)
CREATE POLICY "Service role can manage reviews"
ON public.reviews
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================
-- 11. FLASH SALES — public read active
-- =====================================

CREATE POLICY "Public can read active flash sales"
ON public.flash_sales
FOR SELECT
TO anon, authenticated
USING (is_active = 1);

CREATE POLICY "Service role can manage flash sales"
ON public.flash_sales
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================
-- 12. COUPONS — service role only
-- =====================================

-- NO public read — coupon validation done server-side via service role
CREATE POLICY "Service role manages coupons"
ON public.coupons
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================
-- 13. ORDERS — service role only
-- =====================================

-- NO anonymous access — order reads must go through server actions
CREATE POLICY "Service role manages orders"
ON public.orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================
-- 14. ORDER ITEMS — service role only
-- =====================================

CREATE POLICY "Service role manages order items"
ON public.order_items
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================
-- 15. USERS — service role only (admin table)
-- =====================================

CREATE POLICY "Service role manages users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================
-- 16. NOTIFICATIONS — service role only
-- =====================================

CREATE POLICY "Service role manages notifications"
ON public.notifications
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================
-- 17. NEWSLETTER SUBSCRIBERS — service role only
-- =====================================

-- Subscription handled via API route (service role)
CREATE POLICY "Service role manages newsletter subscribers"
ON public.newsletter_subscribers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================
-- 18. CONSULTATIONS — service role only
-- =====================================

CREATE POLICY "Service role manages consultations"
ON public.consultations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================
-- 19. AUDIT LOGS — service role only
-- =====================================

CREATE POLICY "Service role manages audit logs"
ON public.audit_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================
-- 20. WHATSAPP LOGS — service role only
-- =====================================

CREATE POLICY "Service role manages whatsapp logs"
ON public.whatsapp_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================
-- VERIFICATION QUERY
-- Run to see all active policies
-- =====================================

SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
