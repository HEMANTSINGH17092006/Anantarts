-- =============================================================================
-- ANANT ARTS — STAGING TEST SEED DATA (Synthetic Sandbox Data Only)
-- Script: 03_seed_data.sql
-- Description: Inserts synthetic categories, products, product images, coupons,
--              and website settings. Idempotent and safely rerunnable.
-- Target: Staging Supabase Database Only
-- Safety: Pure synthetic test data; ZERO production customer or transaction data.
-- =============================================================================

-- 1. Categories (3 demo categories)
INSERT INTO public.categories (name, slug, sort_order, type, is_featured) VALUES
('Spiritual Idols', 'spiritual-idols', 1, 'deity', 1),
('Car Dashboard', 'car-dashboard', 2, 'deity', 1),
('Home Décor', 'home-decor', 3, 'decor', 1)
ON CONFLICT (slug) DO NOTHING;

-- 2. Dummy Products (3 demo products linked via dynamic subquery)
INSERT INTO public.products (name, slug, description, short_description, category_id, price, discount_price, stock_quantity, is_published, sku) VALUES
('Test Bal Krishna Idol', 'test-bal-krishna-idol', 'Sandbox product for preview checkout testing', 'Handcrafted Bal Krishna Idol', (SELECT id FROM public.categories WHERE slug = 'spiritual-idols'), 299, 199, 50, 1, 'TEST-SKU-001'),
('Test Elephant Showpiece', 'test-elephant-showpiece', 'Sandbox product for preview checkout testing', 'Decorative Brass Finish Elephant', (SELECT id FROM public.categories WHERE slug = 'home-decor'), 499, 399, 50, 1, 'TEST-SKU-002'),
('Test Car Dashboard Idol', 'test-car-dashboard-idol', 'Sandbox product for preview checkout testing', 'Miniature Dashboard Ganesha Idol', (SELECT id FROM public.categories WHERE slug = 'car-dashboard'), 199, 149, 50, 1, 'TEST-SKU-003')
ON CONFLICT (slug) DO NOTHING;

-- 3. Product Images (Idempotent insert linked via product slug)
INSERT INTO public.product_images (product_id, image_path, is_primary)
SELECT p.id, x.image_path, x.is_primary
FROM (
  VALUES
    ('test-bal-krishna-idol', '/uploads/category-spiritual-collection.png', 1),
    ('test-elephant-showpiece', '/uploads/category-home-decor.png', 1),
    ('test-car-dashboard-idol', '/uploads/category-car-accessories.png', 1)
) AS x(product_slug, image_path, is_primary)
JOIN public.products p ON p.slug = x.product_slug
ON CONFLICT (product_id, image_path) DO NOTHING;

-- 4. Test Coupons (Verified Types: 'percentage' and 'flat')
INSERT INTO public.coupons (code, discount_type, discount_value, min_order_amount, is_active) VALUES
('TEST10', 'percentage', 10, 100, 1),
('FLAT50', 'flat', 50, 500, 1)
ON CONFLICT (code) DO NOTHING;

-- 5. Storefront Settings (Upsert for consistency)
INSERT INTO public.website_settings (key, value) VALUES
('upi_qr_enabled', 'true'),
('upi_id', 'staging-merchant@upi'),
('upi_display_name', 'Anant Arts Staging Store'),
('shipping_flat_rate', '0'),
('free_shipping_threshold', '499')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
