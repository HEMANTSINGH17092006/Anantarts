-- =============================================================================
-- ANANT ARTS — ROW LEVEL SECURITY (RLS) POLICIES (Supabase PostgreSQL)
-- Script: 02_rls_policies.sql
-- Description: Hardened RLS policies for all 38 application tables.
--              - Pre-flight validation confirms all 38 tables exist; fails loudly if missing.
--              - Scoped policy cleanup and creation to the 38 application tables only.
--              - Restricted public product_images reads to published products.
--              - Hardened website_settings public reads with explicit key allowlist.
--              - All mutations and sensitive tables restricted to service_role.
-- Target: Staging Supabase Database Only
-- Safety: Idempotent clean slate (drops and recreates application policies)
-- =============================================================================

-- =============================================================================
-- 1. PRE-FLIGHT VALIDATION: Confirm all 38 application tables exist
-- =============================================================================
DO $$
DECLARE
  app_tables text[] := ARRAY[
    'users', 'categories', 'products', 'product_images', 'coupons',
    'orders', 'order_items', 'reviews', 'testimonials', 'banners',
    'website_settings', 'notifications', 'blogs', 'newsletter_subscribers',
    'flash_sales', 'consultations', 'b2b_enquiries', 'audit_logs',
    'whatsapp_logs', 'payment_logs', 'payment_audit', 'background_jobs',
    'inventory_locks', 'user_addresses', 'otps', 'order_tracking_events',
    'import_sessions', 'import_products', 'marketing_campaigns',
    'marketing_templates', 'campaign_recipients', 'communication_preferences',
    'campaign_events', 'campaign_logs', 'customer_segments',
    'admins', 'invoices', 'notification_logs'
  ];
  tbl text;
  missing_tables text[] := ARRAY[]::text[];
BEGIN
  FOREACH tbl IN ARRAY app_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      missing_tables := array_append(missing_tables, tbl);
    END IF;
  END LOOP;

  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'RLS Setup Aborted: Missing required application tables in public schema: %', array_to_string(missing_tables, ', ');
  END IF;
END $$;

-- =============================================================================
-- 2. ENABLE RLS ON ALL 38 APPLICATION TABLES
-- =============================================================================
DO $$
DECLARE
  app_tables text[] := ARRAY[
    'users', 'categories', 'products', 'product_images', 'coupons',
    'orders', 'order_items', 'reviews', 'testimonials', 'banners',
    'website_settings', 'notifications', 'blogs', 'newsletter_subscribers',
    'flash_sales', 'consultations', 'b2b_enquiries', 'audit_logs',
    'whatsapp_logs', 'payment_logs', 'payment_audit', 'background_jobs',
    'inventory_locks', 'user_addresses', 'otps', 'order_tracking_events',
    'import_sessions', 'import_products', 'marketing_campaigns',
    'marketing_templates', 'campaign_recipients', 'communication_preferences',
    'campaign_events', 'campaign_logs', 'customer_segments',
    'admins', 'invoices', 'notification_logs'
  ];
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY app_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END $$;

-- =============================================================================
-- 3. DROP EXISTING POLICIES (Scoped strictly to the 38 application tables)
-- =============================================================================
DO $$ 
DECLARE
  app_tables text[] := ARRAY[
    'users', 'categories', 'products', 'product_images', 'coupons',
    'orders', 'order_items', 'reviews', 'testimonials', 'banners',
    'website_settings', 'notifications', 'blogs', 'newsletter_subscribers',
    'flash_sales', 'consultations', 'b2b_enquiries', 'audit_logs',
    'whatsapp_logs', 'payment_logs', 'payment_audit', 'background_jobs',
    'inventory_locks', 'user_addresses', 'otps', 'order_tracking_events',
    'import_sessions', 'import_products', 'marketing_campaigns',
    'marketing_templates', 'campaign_recipients', 'communication_preferences',
    'campaign_events', 'campaign_logs', 'customer_segments',
    'admins', 'invoices', 'notification_logs'
  ];
  tbl text;
  pol text;
BEGIN
  FOREACH tbl IN ARRAY app_tables LOOP
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, tbl);
    END LOOP;
  END LOOP;
END $$;

-- =============================================================================
-- 4. STOREFRONT PUBLIC READ POLICIES (Hardened & Scoped — Exactly 9 Policies)
-- =============================================================================

-- 4a. Categories (visible only)
CREATE POLICY "Public can read visible categories" 
ON public.categories FOR SELECT TO anon, authenticated 
USING (is_hidden = 0 OR is_hidden IS NULL);

-- 4b. Products (published only)
CREATE POLICY "Public can read published products" 
ON public.products FOR SELECT TO anon, authenticated 
USING (is_published = 1);

-- 4c. Product Images (restricted to published products only)
CREATE POLICY "Public can read published product images" 
ON public.product_images FOR SELECT TO anon, authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_images.product_id
    AND p.is_published = 1
  )
);

-- 4d. Banners (active only)
CREATE POLICY "Public can read active banners" 
ON public.banners FOR SELECT TO anon, authenticated 
USING (is_active = 1);

-- 4e. Website Settings (restricted to explicit allowlist of non-sensitive storefront keys)
CREATE POLICY "Public can read non-sensitive website settings" 
ON public.website_settings FOR SELECT TO anon, authenticated 
USING (
  key IN (
    'site_name',
    'site_tagline',
    'store_name',
    'store_tagline',
    'about_us_text',
    'email_header_msg',
    'contact_address',
    'contact_email',
    'contact_phone',
    'support_email',
    'orders_email',
    'whatsapp_number',
    'social_links',
    'whatsapp_admin_number',
    'whatsapp_message_template',
    'whatsapp_notifications_enabled',
    'upi_id',
    'upi_display_name',
    'upi_qr_enabled',
    'upi_qr_image_url',
    'free_shipping_threshold',
    'flat_shipping_fee',
    'shipping_flat_rate',
    'estimated_delivery_days',
    'gst_rate',
    'hsn_code',
    'tax_inclusive',
    'gstin',
    'refund_policy',
    'return_policy',
    'shipping_policy',
    'privacy_policy',
    'terms_conditions',
    'seo_title',
    'seo_description',
    'seo_keywords',
    'og_image_url',
    'ga_measurement_id',
    'gsc_verification',
    'clarity_project_id'
  )
);

-- 4f. Testimonials (approved only)
CREATE POLICY "Public can read approved testimonials" 
ON public.testimonials FOR SELECT TO anon, authenticated 
USING (is_approved = 1);

-- 4g. Blogs (published only)
CREATE POLICY "Public can read published blogs" 
ON public.blogs FOR SELECT TO anon, authenticated 
USING (is_published = 1);

-- 4h. Reviews (approved only)
CREATE POLICY "Public can read approved reviews" 
ON public.reviews FOR SELECT TO anon, authenticated 
USING (is_approved = 1);

-- 4i. Flash Sales (active only)
CREATE POLICY "Public can read active flash sales" 
ON public.flash_sales FOR SELECT TO anon, authenticated 
USING (is_active = 1);

-- =============================================================================
-- 5. SERVICE ROLE FULL ACCESS POLICIES (Exactly 38 Policies)
-- =============================================================================
DO $$
DECLARE
  app_tables text[] := ARRAY[
    'users', 'categories', 'products', 'product_images', 'coupons',
    'orders', 'order_items', 'reviews', 'testimonials', 'banners',
    'website_settings', 'notifications', 'blogs', 'newsletter_subscribers',
    'flash_sales', 'consultations', 'b2b_enquiries', 'audit_logs',
    'whatsapp_logs', 'payment_logs', 'payment_audit', 'background_jobs',
    'inventory_locks', 'user_addresses', 'otps', 'order_tracking_events',
    'import_sessions', 'import_products', 'marketing_campaigns',
    'marketing_templates', 'campaign_recipients', 'communication_preferences',
    'campaign_events', 'campaign_logs', 'customer_segments',
    'admins', 'invoices', 'notification_logs'
  ];
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY app_tables LOOP
    EXECUTE format('CREATE POLICY "Service role manages %I" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;

-- =============================================================================
-- 6. NOTIFY POSTGREST SCHEMA CACHE RELOAD
-- =============================================================================
NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- 7. VERIFICATION QUERY (Summary)
-- =============================================================================
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
