-- =============================================================================
-- ANANT ARTS — STAGING RECOVERY: CLEANUP FAILED CANARY ARTIFACTS
-- Script: 05_recover_failed_canaries.sql
-- Target: Staging Supabase Database (Project Ref: wjlkermuyiupzhayawut)
-- Safety: NEVER execute against Production (Project Ref: bpysijuecdmadnqsjsym)
-- Purpose: Safely delete orphaned canary records left by the aborted run of
--          04_post_verification.sql. Does NOT delete or alter legitimate settings.
-- =============================================================================

-- =============================================================================
-- 1. STAGING PROJECT VERIFICATION WARNING & SAFETY GUARD
-- =============================================================================
-- WARNING: This script is intended strictly for the isolated staging database.
-- DO NOT execute this script against the live production database (bpysijuecdmadnqsjsym).
DO $$
BEGIN
  RAISE NOTICE 'Executing recovery cleanup on target database. Verify you are connected to STAGING (wjlkermuyiupzhayawut).';
END $$;

-- Ensure privileged execution role (revert any lingering 'anon' session)
RESET ROLE;

-- =============================================================================
-- 2. PRIOR STATE INSPECTION (Non-Exposing Diagnostic Check)
-- =============================================================================
-- Inspect whether the synthetic canary key exists and whether it contains the
-- test dummy string or a pre-existing custom value (without exposing secrets).
SELECT 
  key AS setting_key,
  CASE 
    WHEN value = 'CANARY_TEST_SECRET_VALUE_DO_NOT_EXPOSE' THEN 'CANARY_TEST_VALUE_DETECTED'
    ELSE 'CUSTOM_OR_PREEXISTING_VALUE_PRESERVED'
  END AS setting_status
FROM public.website_settings 
WHERE key = '__rls_canary_secret_staging_guard_v1';

-- =============================================================================
-- 3. TARGETED CANARY DELETION (Exact Canary Identifiers Only)
-- =============================================================================
-- Deletes ONLY records matching the exact canary IDs and unique attributes
-- created during the failed verification execution attempt.
-- Foreign-key deletion order: child (product_images) before parent (products).
-- Will NEVER match or delete real customer orders, products, images, or settings.

-- 3a. Delete canary order (matching BOTH ID 99999 AND order_number 'ORD-CANARY-99999')
DELETE FROM public.orders 
WHERE id = 99999 
  AND order_number = 'ORD-CANARY-99999';

-- 3b. Delete canary draft image (matching BOTH product_id 99999 AND exact image path)
DELETE FROM public.product_images 
WHERE product_id = 99999 
  AND image_path = '/uploads/canary-draft-image.png';

-- 3c. Delete canary draft product (matching BOTH ID 99999 AND exact slug)
DELETE FROM public.products 
WHERE id = 99999 
  AND slug = 'canary-draft-product-xyz';

-- 3d. Clean up synthetic canary setting ONLY IF it matches the exact test value
-- If this key contains any other value, it is preserved completely.
-- Real application keys (like razorpay_key_secret) are NEVER deleted.
DELETE FROM public.website_settings 
WHERE key = '__rls_canary_secret_staging_guard_v1'
  AND value = 'CANARY_TEST_SECRET_VALUE_DO_NOT_EXPOSE';

-- =============================================================================
-- 4. POST-CLEANUP VERIFICATION QUERY (Read-Only Confirmation Counts)
-- =============================================================================
-- Confirms that all canary entities are completely removed from the catalog.
-- Returns purely integer counts (zero secret exposure). Expected: all counts = 0.
SELECT 
  (SELECT count(*) FROM public.orders WHERE id = 99999 AND order_number = 'ORD-CANARY-99999') AS remaining_canary_orders,
  (SELECT count(*) FROM public.product_images WHERE product_id = 99999 AND image_path = '/uploads/canary-draft-image.png') AS remaining_canary_images,
  (SELECT count(*) FROM public.products WHERE id = 99999 AND slug = 'canary-draft-product-xyz') AS remaining_canary_products,
  (SELECT count(*) FROM public.website_settings WHERE key = '__rls_canary_secret_staging_guard_v1' AND value = 'CANARY_TEST_SECRET_VALUE_DO_NOT_EXPOSE') AS remaining_canary_settings;
