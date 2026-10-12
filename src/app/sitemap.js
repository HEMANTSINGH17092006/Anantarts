import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 3600; // Revalidate sitemap hourly

export default async function sitemap() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in').replace(/\/$/, '');
  const supabase = createAdminClient();

  // 1. Core Static Canonical Landing & Informational Pages
  const staticPages = [
    { route: '', priority: 1.0, changeFrequency: 'daily' },
    { route: '/shop', priority: 0.9, changeFrequency: 'daily' },
    { route: '/collections', priority: 0.85, changeFrequency: 'weekly' },
    { route: '/corporate-gifts', priority: 0.85, changeFrequency: 'weekly' },
    { route: '/materials', priority: 0.8, changeFrequency: 'monthly' },
    { route: '/occasions', priority: 0.8, changeFrequency: 'monthly' },
    { route: '/about', priority: 0.7, changeFrequency: 'monthly' },
    { route: '/consultation', priority: 0.75, changeFrequency: 'monthly' },
    { route: '/blog', priority: 0.75, changeFrequency: 'weekly' },
    { route: '/contact', priority: 0.7, changeFrequency: 'monthly' },
    { route: '/faq', priority: 0.7, changeFrequency: 'monthly' },
    { route: '/order-tracking', priority: 0.6, changeFrequency: 'monthly' },
    { route: '/shipping-policy', priority: 0.5, changeFrequency: 'monthly' },
    { route: '/return-policy', priority: 0.5, changeFrequency: 'monthly' },
    { route: '/refund-policy', priority: 0.5, changeFrequency: 'monthly' },
    { route: '/privacy-policy', priority: 0.5, changeFrequency: 'monthly' },
    { route: '/terms-and-conditions', priority: 0.5, changeFrequency: 'monthly' },
  ].map(({ route, priority, changeFrequency }) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  // 2. Active Categories from Database (including car-dashboard)
  let categoryEntries = [];
  try {
    const { data: categories, error: catErr } = await supabase
      .from('categories')
      .select('slug, created_at, is_hidden')
      .or('is_hidden.eq.0,is_hidden.is.null')
      .order('sort_order', { ascending: true, nullsFirst: false });

    if (catErr) {
      console.error('Database categories error in sitemap:', catErr.message);
    } else if (Array.isArray(categories)) {
      categoryEntries = categories
        .filter((c) => c.slug)
        .map((category) => ({
          url: `${baseUrl}/category/${category.slug}`,
          lastModified: category.created_at ? new Date(category.created_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.85,
        }));
    }
  } catch (err) {
    console.error('Error fetching categories for sitemap:', err);
  }

  // 3. Dynamic Published Products from Database (eliminates stale cache and obsolete slugs)
  let productEntries = [];
  try {
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('slug, created_at, is_published')
      .eq('is_published', 1)
      .order('id', { ascending: true });

    if (prodErr) {
      console.error('Database products error in sitemap:', prodErr.message);
    } else if (Array.isArray(products)) {
      productEntries = products
        .filter((p) => p.slug)
        .map((product) => ({
          url: `${baseUrl}/product/${product.slug}`,
          lastModified: product.created_at ? new Date(product.created_at) : new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        }));
    }
  } catch (err) {
    console.error('Error fetching products for sitemap:', err);
  }

  // 4. Dynamic Published Blog Posts
  let blogEntries = [];
  try {
    const { data: blogs, error: blogErr } = await supabase
      .from('blogs')
      .select('slug, created_at, is_published')
      .eq('is_published', 1)
      .order('created_at', { ascending: false });

    if (!blogErr && Array.isArray(blogs)) {
      blogEntries = blogs
        .filter((b) => b.slug)
        .map((blog) => ({
          url: `${baseUrl}/blog/${blog.slug}`,
          lastModified: blog.created_at ? new Date(blog.created_at) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.7,
        }));
    }
  } catch (err) {
    console.error('Error fetching blogs for sitemap:', err);
  }

  return [...staticPages, ...categoryEntries, ...productEntries, ...blogEntries];
}
