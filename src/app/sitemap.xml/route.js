import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createAdminClient();
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in').replace(/\/$/, '');

  // Fetch published products
  const { data: products = [] } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('is_published', 1);

  // Fetch visible categories
  const { data: categories = [] } = await supabase
    .from('categories')
    .select('slug, updated_at')
    .eq('is_hidden', 0);

  // Fetch published blogs
  const { data: blogs = [] } = await supabase
    .from('blogs')
    .select('slug, publish_date')
    .eq('is_published', 1);

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/shop', priority: '0.9', changefreq: 'daily' },
    { url: '/about', priority: '0.6', changefreq: 'monthly' },
    { url: '/contact', priority: '0.6', changefreq: 'monthly' },
    { url: '/blog', priority: '0.7', changefreq: 'weekly' },
    { url: '/consultation', priority: '0.7', changefreq: 'monthly' },
    { url: '/corporate-gifts', priority: '0.7', changefreq: 'monthly' },
    { url: '/faq', priority: '0.5', changefreq: 'monthly' },
    { url: '/shipping-policy', priority: '0.4', changefreq: 'yearly' },
    { url: '/return-policy', priority: '0.4', changefreq: 'yearly' },
    { url: '/refund-policy', priority: '0.4', changefreq: 'yearly' },
    { url: '/privacy-policy', priority: '0.4', changefreq: 'yearly' },
    { url: '/terms-and-conditions', priority: '0.4', changefreq: 'yearly' },
    { url: '/order-tracking', priority: '0.5', changefreq: 'monthly' },
  ];

  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

  // Static pages
  for (const page of staticPages) {
    xml += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }

  // Product pages
  for (const p of products) {
    const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split('T')[0] : today;
    xml += `
  <url>
    <loc>${baseUrl}/product/${p.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }

  // Category pages (shop filtered by category)
  for (const c of categories) {
    xml += `
  <url>
    <loc>${baseUrl}/shop?category=${c.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
  }

  // Blog pages
  for (const b of blogs) {
    const lastmod = b.publish_date ? new Date(b.publish_date).toISOString().split('T')[0] : today;
    xml += `
  <url>
    <loc>${baseUrl}/blog/${b.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
  }

  xml += `
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
