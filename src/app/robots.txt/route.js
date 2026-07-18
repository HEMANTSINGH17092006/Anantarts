export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in').replace(/\/$/, '');

  const robotsTxt = `# Anant Arts - Official Robots.txt
# Production domain: ${baseUrl}

User-agent: *
Allow: /

# Block private/admin areas
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/
Disallow: /my-orders/

# Allow Google to index all public content
User-agent: Googlebot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/

# Allow Bingbot
User-agent: Bingbot
Allow: /
Disallow: /admin/
Disallow: /api/

# Crawl-delay for general bots
Crawl-delay: 1

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
