import { getProducts, getBlogs } from '@/lib/db-helpers';

export const revalidate = 3600; // Revalidate sitemap hourly

export default async function sitemap() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in').replace(/\/$/, '');

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

  // 2. Dynamic Published Product Pages
  let productEntries = [];
  try {
    const products = await getProducts({ all: false });
    if (Array.isArray(products)) {
      productEntries = products
        .filter((p) => p.slug && p.is_published !== 0)
        .map((product) => ({
          url: `${baseUrl}/product/${product.slug}`,
          lastModified: product.updated_at ? new Date(product.updated_at) : (product.created_at ? new Date(product.created_at) : new Date()),
          changeFrequency: 'weekly',
          priority: 0.8,
        }));
    }
  } catch (err) {
    console.error('Error fetching products for sitemap:', err);
  }

  // 3. Dynamic Published Blog Posts
  let blogEntries = [];
  try {
    const blogs = await getBlogs(true);
    if (Array.isArray(blogs)) {
      blogEntries = blogs
        .filter((b) => b.slug && b.is_published === 1)
        .map((blog) => ({
          url: `${baseUrl}/blog/${blog.slug}`,
          lastModified: blog.updated_at ? new Date(blog.updated_at) : (blog.created_at ? new Date(blog.created_at) : new Date()),
          changeFrequency: 'monthly',
          priority: 0.7,
        }));
    }
  } catch (err) {
    console.error('Error fetching blogs for sitemap:', err);
  }

  return [...staticPages, ...productEntries, ...blogEntries];
}
