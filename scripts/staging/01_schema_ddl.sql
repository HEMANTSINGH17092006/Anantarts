-- =============================================================================
-- ANANT ARTS — STAGING ENVIRONMENT SCHEMA DDL (PostgreSQL / Supabase)
-- Script: 01_schema_ddl.sql
-- Description: Complete 38-table DDL with constraints, foreign keys and indexes.
-- Target: Staging Supabase Database Only
-- Safety: Idempotent (CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS)
-- =============================================================================

-- 1. Users (Storefront Customers & Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT,
  role TEXT DEFAULT 'customer',
  email_verified INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_path TEXT,
  is_hidden INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  type TEXT DEFAULT 'deity',
  parent_id INTEGER,
  banner_path TEXT,
  description TEXT,
  is_featured INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Products
CREATE TABLE IF NOT EXISTS public.products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
  price REAL NOT NULL,
  discount_price REAL,
  sku TEXT UNIQUE,
  material TEXT,
  dimensions TEXT,
  weight REAL,
  stock_quantity INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 1,
  tags TEXT,
  deity_category TEXT,
  is_bestseller INTEGER DEFAULT 0,
  is_new_arrival INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  video_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  finish_type TEXT,
  customization_option TEXT,
  bulk_pricing TEXT,
  variants TEXT,
  related_products TEXT,
  occasion TEXT,
  festival TEXT,
  gift_type TEXT,
  color TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Product Images (with unique constraint for idempotent seeds)
CREATE TABLE IF NOT EXISTS public.product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  is_primary INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_product_image UNIQUE (product_id, image_path)
);

-- 5. Coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK(discount_type IN ('percentage', 'flat')),
  discount_value REAL NOT NULL,
  min_order_amount REAL DEFAULT 0,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  usage_limit INTEGER,
  times_used INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  billing_address TEXT NOT NULL,
  coupon_id INTEGER REFERENCES public.coupons(id) ON DELETE SET NULL,
  discount_amount REAL DEFAULT 0,
  shipping_charge REAL DEFAULT 0,
  subtotal REAL NOT NULL,
  total_amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'Pending',
  order_status TEXT DEFAULT 'Pending',
  notes TEXT,
  tracking_number TEXT,
  courier_name TEXT,
  estimated_delivery TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  captured_at TIMESTAMP,
  refund_status TEXT DEFAULT 'none',
  refund_id TEXT,
  payment_logs TEXT,
  cancelled_at TIMESTAMP,
  cancelled_by TEXT,
  cancellation_reason TEXT,
  shipping_date TEXT,
  courier_website TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL,
  total_price REAL NOT NULL
);

-- 8. Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Testimonials
CREATE TABLE IF NOT EXISTS public.testimonials (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  comment TEXT NOT NULL,
  rating INTEGER DEFAULT 5,
  avatar_path TEXT,
  is_approved INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Banners
CREATE TABLE IF NOT EXISTS public.banners (
  id SERIAL PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  image_path TEXT NOT NULL,
  video_url TEXT,
  cta_link TEXT,
  cta_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1
);

-- 11. Website Settings
CREATE TABLE IF NOT EXISTS public.website_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- 12. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  type TEXT,
  link TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Blogs
CREATE TABLE IF NOT EXISTS public.blogs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  short_desc TEXT,
  featured_image TEXT,
  category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
  publish_date TIMESTAMP,
  is_published INTEGER DEFAULT 1,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Newsletter Subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Flash Sales
CREATE TABLE IF NOT EXISTS public.flash_sales (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  discount_percentage REAL DEFAULT 0,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Consultations
CREATE TABLE IF NOT EXISTS public.consultations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  city TEXT,
  deity_interest TEXT,
  dimensions TEXT,
  preferred_date TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. B2B Enquiries
CREATE TABLE IF NOT EXISTS public.b2b_enquiries (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company TEXT,
  quantity INTEGER,
  product_interest TEXT,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id SERIAL PRIMARY KEY,
  admin_email TEXT,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. WhatsApp Logs
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
  id SERIAL PRIMARY KEY,
  order_number TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 20. Payment Logs
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  order_number TEXT,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  amount REAL,
  status TEXT NOT NULL,
  error_message TEXT,
  error_stack TEXT,
  customer_info TEXT,
  raw_payload TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 21. Payment Audit
CREATE TABLE IF NOT EXISTS public.payment_audit (
  id SERIAL PRIMARY KEY,
  payment_id TEXT,
  order_id TEXT,
  status TEXT,
  error TEXT,
  step_failed TEXT,
  payload TEXT,
  recovered INTEGER DEFAULT 0,
  recovery_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 22. Background Jobs
CREATE TABLE IF NOT EXISTS public.background_jobs (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  payload TEXT,
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  run_after TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 23. Inventory Locks
CREATE TABLE IF NOT EXISTS public.inventory_locks (
  id SERIAL PRIMARY KEY,
  order_number TEXT NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 24. User Addresses
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 25. OTPs
CREATE TABLE IF NOT EXISTS public.otps (
  id SERIAL PRIMARY KEY,
  identifier TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 26. Order Tracking Events
CREATE TABLE IF NOT EXISTS public.order_tracking_events (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by_admin TEXT,
  courier_name TEXT,
  tracking_number TEXT,
  estimated_delivery TEXT,
  updated_by_admin TEXT,
  courier_website TEXT,
  shipping_date TEXT
);

-- 27. Import Sessions
CREATE TABLE IF NOT EXISTS public.import_sessions (
  id SERIAL PRIMARY KEY,
  admin_email TEXT,
  csv_file_path TEXT,
  csv_hash TEXT,
  report_file_path TEXT,
  inventory_mode TEXT DEFAULT 'skip',
  is_dry_run INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  total_rows INTEGER DEFAULT 0,
  processed_rows INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  missing_images_count INTEGER DEFAULT 0,
  duplicate_count INTEGER DEFAULT 0,
  batch_size INTEGER DEFAULT 50,
  duration_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 28. Import Products
CREATE TABLE IF NOT EXISTS public.import_products (
  id SERIAL PRIMARY KEY,
  import_session_id INTEGER REFERENCES public.import_sessions(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
  action_type TEXT,
  snapshot_file_path TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 29. Marketing Campaigns
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'email',
  subject TEXT,
  preview_text TEXT,
  content_html TEXT,
  content_text TEXT,
  template_id INTEGER,
  segment_config TEXT,
  status TEXT DEFAULT 'draft',
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_by TEXT,
  settings TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 30. Marketing Templates
CREATE TABLE IF NOT EXISTS public.marketing_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'email',
  category TEXT DEFAULT 'general',
  subject TEXT,
  preview_text TEXT,
  body_html TEXT,
  body_text TEXT,
  thumbnail_url TEXT,
  is_system INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 31. Campaign Recipients
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  customer_id INTEGER,
  recipient_email TEXT,
  recipient_phone TEXT,
  recipient_name TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  tracking_token TEXT UNIQUE,
  metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 32. Communication Preferences
CREATE TABLE IF NOT EXISTS public.communication_preferences (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  phone TEXT,
  email_marketing_opt_in INTEGER DEFAULT 1,
  whatsapp_marketing_opt_in INTEGER DEFAULT 1,
  unsubscribed_at TIMESTAMP,
  unsubscribe_reason TEXT,
  source TEXT DEFAULT 'system',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 33. Campaign Events
CREATE TABLE IF NOT EXISTS public.campaign_events (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  recipient_id INTEGER REFERENCES public.campaign_recipients(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 34. Campaign Logs
CREATE TABLE IF NOT EXISTS public.campaign_logs (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  level TEXT DEFAULT 'info',
  message TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 35. Customer Segments
CREATE TABLE IF NOT EXISTS public.customer_segments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  filter_criteria TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 36. Admins (Auxiliary table for Admin Dashboard auth in src/app/actions.js)
CREATE TABLE IF NOT EXISTS public.admins (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 37. Invoices (Auxiliary table for order cleanup in src/app/api/admin/orders/delete)
CREATE TABLE IF NOT EXISTS public.invoices (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE,
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 38. Notification Logs (Auxiliary table for dispatch audit in src/lib/admin-email.js)
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id SERIAL PRIMARY KEY,
  event_type TEXT,
  recipient TEXT,
  status TEXT,
  error_message TEXT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- PERFORMANCE & INTEGRITY INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_product_images_prod ON public.product_images (product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_prod_path ON public.product_images (product_id, image_path);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items (product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON public.orders (razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;

-- Marketing Indexes
CREATE INDEX IF NOT EXISTS idx_camp_recipients_campaign ON public.campaign_recipients (campaign_id);
CREATE INDEX IF NOT EXISTS idx_camp_recipients_status ON public.campaign_recipients (status);
CREATE INDEX IF NOT EXISTS idx_camp_recipients_token ON public.campaign_recipients (tracking_token);
CREATE INDEX IF NOT EXISTS idx_comm_pref_email ON public.communication_preferences (email);
CREATE INDEX IF NOT EXISTS idx_camp_events_campaign ON public.campaign_events (campaign_id);
CREATE INDEX IF NOT EXISTS idx_camp_logs_campaign ON public.campaign_logs (campaign_id);
