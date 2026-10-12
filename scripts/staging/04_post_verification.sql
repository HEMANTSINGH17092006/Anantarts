-- =============================================================================
-- ANANT ARTS — STAGING POST-EXECUTION VERIFICATION SUITE (PostgreSQL)
-- Script: 04_post_verification.sql
-- Description: Verifies table counts, RLS enablement, policy coverage,
--              foreign-key integrity, seed data counts, and anon access guards.
--              Includes verifiable canary rows with full schema compliance
--              and non-destructive setting guards so real staging data is preserved.
-- Target: Staging Supabase Database Only
-- =============================================================================

-- =============================================================================
-- 1. VERIFY TABLE COUNT & TABLE EXISTENCE (Target: Exactly 38 Tables)
-- =============================================================================
SELECT count(*) AS total_tables_in_public 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- (Expected result: 38)

-- List any expected tables that are missing
SELECT expected.table_name AS missing_table
FROM (
  VALUES 
    ('users'), ('categories'), ('products'), ('product_images'), ('coupons'),
    ('orders'), ('order_items'), ('reviews'), ('testimonials'), ('banners'),
    ('website_settings'), ('notifications'), ('blogs'), ('newsletter_subscribers'),
    ('flash_sales'), ('consultations'), ('b2b_enquiries'), ('audit_logs'),
    ('whatsapp_logs'), ('payment_logs'), ('payment_audit'), ('background_jobs'),
    ('inventory_locks'), ('user_addresses'), ('otps'), ('order_tracking_events'),
    ('import_sessions'), ('import_products'), ('marketing_campaigns'),
    ('marketing_templates'), ('campaign_recipients'), ('communication_preferences'),
    ('campaign_events'), ('campaign_logs'), ('customer_segments'),
    ('admins'), ('invoices'), ('notification_logs')
) AS expected(table_name)
LEFT JOIN information_schema.tables actual 
  ON actual.table_schema = 'public' AND actual.table_name = expected.table_name
WHERE actual.table_name IS NULL;
-- (Expected result: 0 rows returned = all 38 tables exist)

-- =============================================================================
-- 2. VERIFY ROW LEVEL SECURITY ENABLEMENT (Target: 38 / 38 Enabled)
-- =============================================================================
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check if any application table is UNPROTECTED (rowsecurity = false)
SELECT count(*) AS unprotected_tables_count
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = false
  AND tablename IN (
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
  );
-- (Expected result: unprotected_tables_count = 0)

-- =============================================================================
-- 3. VERIFY RLS POLICY COVERAGE (Target: 47 Active Policies)
-- =============================================================================
SELECT count(*) AS total_active_app_policies 
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
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
  );
-- (Expected result: 47 policies = 9 storefront public read + 38 service-role)

-- Summary by role and command
SELECT 
  roles,
  cmd,
  count(*) AS policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY roles, cmd
ORDER BY roles, cmd;
-- (Expected: {anon, authenticated} SELECT = 9; {service_role} ALL = 38)

-- =============================================================================
-- 4. VERIFY FOREIGN KEY CONSTRAINTS INTEGRITY
-- =============================================================================
SELECT 
  tc.table_name AS child_table,
  kcu.column_name AS child_column,
  ccu.table_name AS referenced_table,
  ccu.column_name AS referenced_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =============================================================================
-- 5. VERIFY SYNTHETIC SEED DATA COUNTS
-- =============================================================================
SELECT 
  (SELECT count(*) FROM public.categories) AS categories_count,
  (SELECT count(*) FROM public.products) AS products_count,
  (SELECT count(*) FROM public.product_images) AS images_count,
  (SELECT count(*) FROM public.coupons) AS coupons_count,
  (SELECT count(*) FROM public.website_settings) AS settings_count,
  (SELECT count(*) FROM public.orders) AS orders_count,
  (SELECT count(*) FROM public.users) AS users_count;
-- (Expected result: categories=3, products=3, images=3, coupons=2, settings=5, orders=0, users=0)

-- =============================================================================
-- 6. VERIFY ANONYMOUS ROLE ACCESS WITH TRANSACTION-SAFE CANARY PROOF
-- =============================================================================

-- Step 6a: Defensive role initialization & pre-flight safety checks
-- NOTE ON RECOVERY: If execution is interrupted midway while inside a transaction,
-- run: ROLLBACK; RESET ROLE; to clear any active transaction and restore the postgres role.
RESET ROLE;

-- Safety Guard 1: Detect if dedicated canary setting key already exists.
-- Abort safely without modifying or deleting data if an unexpected collision exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.website_settings 
    WHERE key = '__rls_canary_secret_staging_guard_v1'
  ) THEN
    RAISE EXCEPTION 'SAFETY ABORT: Setting key "__rls_canary_secret_staging_guard_v1" already exists in public.website_settings. Aborting without modifying data.';
  END IF;

  -- Safety Guard 2: Detect if product ID 99999 is in use by legitimate non-canary data
  IF EXISTS (
    SELECT 1 FROM public.products 
    WHERE id = 99999 
      AND (slug <> 'canary-draft-product-xyz' OR sku <> 'CANARY-SKU-001')
  ) THEN
    RAISE EXCEPTION 'SAFETY ABORT: Product ID 99999 exists and belongs to non-canary data. Aborting.';
  END IF;

  -- Safety Guard 3: Detect if order ID 99999 is in use by legitimate non-canary data
  IF EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = 99999 
      AND (order_number <> 'ORD-CANARY-99999' OR customer_email <> 'canary.test@anantarts-staging.internal')
  ) THEN
    RAISE EXCEPTION 'SAFETY ABORT: Order ID 99999 exists and belongs to non-canary data. Aborting.';
  END IF;
END $$;

-- Clean up ONLY records positively identified as synthetic canaries from an earlier interrupted run
DELETE FROM public.orders 
WHERE id = 99999 
  AND order_number = 'ORD-CANARY-99999' 
  AND customer_email = 'canary.test@anantarts-staging.internal';

DELETE FROM public.product_images 
WHERE product_id = 99999 
  AND image_path = '/uploads/canary-draft-image.png';

DELETE FROM public.products 
WHERE id = 99999 
  AND slug = 'canary-draft-product-xyz' 
  AND sku = 'CANARY-SKU-001';

-- Record execution role before test begins
SELECT current_user AS execution_role_before_test;

-- =============================================================================
-- Step 6b–6f: ATOMIC TRANSACTION BLOCK (Auto-Rollback on Completion or Error)
-- =============================================================================
BEGIN;

-- 1. Insert dedicated canary secret (strictly excluded by RLS allowlist; NEVER touches real settings)
INSERT INTO public.website_settings (key, value) 
VALUES ('__rls_canary_secret_staging_guard_v1', 'CANARY_TEST_SECRET_VALUE_DO_NOT_EXPOSE')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Insert unpublished draft product (must be hidden from anon by published-only policy)
INSERT INTO public.products (id, name, slug, price, stock_quantity, is_published, sku) 
VALUES (99999, 'Canary Draft Product', 'canary-draft-product-xyz', 999, 10, 0, 'CANARY-SKU-001')
ON CONFLICT (id) DO UPDATE SET is_published = 0;

-- 3. Insert an image for the unpublished draft product (must be hidden from anon)
INSERT INTO public.product_images (product_id, image_path, is_primary) 
VALUES (99999, '/uploads/canary-draft-image.png', 1)
ON CONFLICT (product_id, image_path) DO NOTHING;

-- 4. Insert canary order (all 9 required NOT NULL columns populated)
INSERT INTO public.orders (
  id,
  order_number,
  customer_name,
  customer_email,
  customer_phone,
  shipping_address,
  billing_address,
  subtotal,
  total_amount,
  payment_method,
  payment_status,
  order_status
) VALUES (
  99999,
  'ORD-CANARY-99999',
  'Canary Staging Customer',
  'canary.test@anantarts-staging.internal',
  '+919999999999',
  'Canary Verification Suite, Staging Sandbox, Maharashtra - 400001, India',
  'Canary Verification Suite, Staging Sandbox, Maharashtra - 400001, India',
  999.00,
  999.00,
  'direct_upi',
  'Pending',
  'Pending'
) ON CONFLICT (id) DO UPDATE SET 
  order_number = EXCLUDED.order_number,
  customer_name = EXCLUDED.customer_name,
  customer_email = EXCLUDED.customer_email,
  customer_phone = EXCLUDED.customer_phone,
  shipping_address = EXCLUDED.shipping_address,
  billing_address = EXCLUDED.billing_address,
  subtotal = EXCLUDED.subtotal,
  total_amount = EXCLUDED.total_amount,
  payment_method = EXCLUDED.payment_method;

-- Step 6c: FAIL-FAST ASSERTION — Verify all 4 canary records physically exist in tables under privileged role
DO $$
DECLARE
  v_secret_count int;
  v_draft_count int;
  v_image_count int;
  v_order_count int;
BEGIN
  SELECT count(*) INTO v_secret_count FROM public.website_settings WHERE key = '__rls_canary_secret_staging_guard_v1';
  SELECT count(*) INTO v_draft_count FROM public.products WHERE id = 99999;
  SELECT count(*) INTO v_image_count FROM public.product_images WHERE product_id = 99999;
  SELECT count(*) INTO v_order_count FROM public.orders WHERE id = 99999;

  IF v_secret_count <> 1 OR v_draft_count <> 1 OR v_image_count <> 1 OR v_order_count <> 1 THEN
    RAISE EXCEPTION 'ASSERTION FAILED [Privileged Canaries]: Expected all 4 canary records to exist. Found secrets=%, products=%, images=%, orders=%',
      v_secret_count, v_draft_count, v_image_count, v_order_count;
  END IF;
END $$;

-- Visual Confirmation Query (Privileged role)
SELECT 
  (SELECT count(*) FROM public.website_settings WHERE key = '__rls_canary_secret_staging_guard_v1') AS canary_secret_exists_in_table,
  (SELECT count(*) FROM public.products WHERE id = 99999) AS canary_draft_exists_in_table,
  (SELECT count(*) FROM public.product_images WHERE product_id = 99999) AS canary_image_exists_in_table,
  (SELECT count(*) FROM public.orders WHERE id = 99999) AS canary_order_exists_in_table;

-- Step 6d: Switch locally to anonymous role (transaction-scoped only)
SET LOCAL ROLE anon;

-- FAIL-FAST ASSERTION — Enforce anonymous role access constraints & verify zero leaks
DO $$
DECLARE
  v_role text := current_user;
  v_leaked_secrets int;
  v_leaked_images int;
  v_leaked_orders int;
  v_visible_categories int;
  v_visible_products int;
  v_sensitive_records int;
BEGIN
  -- 1. Assert role switched to anon
  IF v_role <> 'anon' THEN
    RAISE EXCEPTION 'ASSERTION FAILED: Active role is "%", expected "anon"', v_role;
  END IF;

  -- 2. Storefront visibility assertions
  SELECT count(*) INTO v_visible_categories FROM public.categories;
  IF v_visible_categories <> 3 THEN
    RAISE EXCEPTION 'ASSERTION FAILED [Storefront]: Expected 3 public categories, found %', v_visible_categories;
  END IF;

  SELECT count(*) INTO v_visible_products FROM public.products;
  IF v_visible_products <> 3 THEN
    RAISE EXCEPTION 'ASSERTION FAILED [Storefront]: Expected 3 public products, found %', v_visible_products;
  END IF;

  -- 3. Canary leak assertions
  SELECT count(*) INTO v_leaked_secrets FROM public.website_settings WHERE key = '__rls_canary_secret_staging_guard_v1';
  IF v_leaked_secrets <> 0 THEN
    RAISE EXCEPTION 'SECURITY ASSERTION FAILED [RLS Leak]: Canary secret is visible to anon (count = %)', v_leaked_secrets;
  END IF;

  SELECT count(*) INTO v_leaked_images FROM public.product_images WHERE product_id = 99999;
  IF v_leaked_images <> 0 THEN
    RAISE EXCEPTION 'SECURITY ASSERTION FAILED [RLS Leak]: Draft product image is visible to anon (count = %)', v_leaked_images;
  END IF;

  SELECT count(*) INTO v_leaked_orders FROM public.orders WHERE id = 99999;
  IF v_leaked_orders <> 0 THEN
    RAISE EXCEPTION 'SECURITY ASSERTION FAILED [RLS Leak]: Canary order is visible to anon (count = %)', v_leaked_orders;
  END IF;

  -- 4. Sensitive table leakage assertions
  SELECT (
    (SELECT count(*) FROM public.users) +
    (SELECT count(*) FROM public.otps) +
    (SELECT count(*) FROM public.admins) +
    (SELECT count(*) FROM public.payment_logs) +
    (SELECT count(*) FROM public.inventory_locks)
  ) INTO v_sensitive_records;

  IF v_sensitive_records <> 0 THEN
    RAISE EXCEPTION 'SECURITY ASSERTION FAILED [Sensitive Tables]: % sensitive records visible to anon', v_sensitive_records;
  END IF;
END $$;

-- Visual Confirmation Queries (Anon role)
SELECT current_user AS active_test_role; -- MUST return 'anon'

-- Test A: Storefront queries MUST succeed for allowlisted data
SELECT count(*) AS public_categories_visible FROM public.categories; -- Expected: 3
SELECT count(*) AS public_products_visible FROM public.products; -- Expected: 3 (published only; draft 99999 is hidden)
SELECT count(*) AS public_settings_visible FROM public.website_settings; -- Expected: allowlisted keys only (5 seeded keys)

-- Test B: RLS Filter Proof — Canary secret is physically in table, but anon receives 0 rows
SELECT count(*) AS leaked_canary_secrets_count 
FROM public.website_settings 
WHERE key = '__rls_canary_secret_staging_guard_v1';
-- (Expected: 0 rows. PROVES RLS allowlist filters out secret even when row physically exists)

-- Test C: RLS Filter Proof — Unpublished product image is physically in table, but anon receives 0 rows
SELECT count(*) AS leaked_draft_images_count
FROM public.product_images
WHERE product_id = 99999;
-- (Expected: 0 rows. PROVES RLS policy restricts images to published products only)

-- Test D: RLS Protection Proof — Sensitive table has physical row 99999, but anon receives 0 rows
SELECT count(*) AS leaked_orders_count 
FROM public.orders 
WHERE id = 99999;
-- (Expected: 0 rows. PROVES anon cannot read orders even when orders table is populated)

-- Test E: General Sensitive / Internal Tables must return 0 rows under anon
SELECT count(*) AS users_visible_to_anon FROM public.users;                     -- Expected: 0
SELECT count(*) AS otps_visible_to_anon FROM public.otps;                       -- Expected: 0
SELECT count(*) AS admins_visible_to_anon FROM public.admins;                   -- Expected: 0
SELECT count(*) AS payment_logs_visible_to_anon FROM public.payment_logs;       -- Expected: 0
SELECT count(*) AS inventory_locks_visible_to_anon FROM public.inventory_locks; -- Expected: 0

-- Step 6e: Explicitly reset role within transaction
RESET ROLE;

-- Step 6f: Rollback transaction (removes all canaries and guarantees role restoration)
ROLLBACK;

-- =============================================================================
-- Step 6g: POST-ROLLBACK CONFIRMATION & ASSERTION (Runs outside transaction)
-- =============================================================================
RESET ROLE;

DO $$
DECLARE
  v_role text := current_user;
  v_rem_secrets int;
  v_rem_products int;
  v_rem_images int;
  v_rem_orders int;
BEGIN
  IF v_role <> 'postgres' THEN
    RAISE EXCEPTION 'ASSERTION FAILED [Post-Rollback]: Expected restored role "postgres", got "%"', v_role;
  END IF;

  SELECT count(*) INTO v_rem_secrets FROM public.website_settings WHERE key = '__rls_canary_secret_staging_guard_v1';
  SELECT count(*) INTO v_rem_products FROM public.products WHERE id = 99999;
  SELECT count(*) INTO v_rem_images FROM public.product_images WHERE product_id = 99999;
  SELECT count(*) INTO v_rem_orders FROM public.orders WHERE id = 99999;

  IF v_rem_secrets <> 0 OR v_rem_products <> 0 OR v_rem_images <> 0 OR v_rem_orders <> 0 THEN
    RAISE EXCEPTION 'CLEANUP ASSERTION FAILED: Lingering canary data detected post-rollback (secrets=%, products=%, images=%, orders=%)',
      v_rem_secrets, v_rem_products, v_rem_images, v_rem_orders;
  END IF;
END $$;

SELECT current_user AS final_execution_role; -- MUST match initial privileged role (e.g., 'postgres')

SELECT 
  (SELECT count(*) FROM public.website_settings WHERE key = '__rls_canary_secret_staging_guard_v1') AS remaining_canary_secrets,
  (SELECT count(*) FROM public.products WHERE id = 99999) AS remaining_canary_products,
  (SELECT count(*) FROM public.product_images WHERE product_id = 99999) AS remaining_canary_images,
  (SELECT count(*) FROM public.orders WHERE id = 99999) AS remaining_canary_orders;
-- (Expected result: all counts MUST be 0. Confirms complete rollback of canary data)

-- =============================================================================
-- END OF VERIFICATION SUITE
-- =============================================================================
