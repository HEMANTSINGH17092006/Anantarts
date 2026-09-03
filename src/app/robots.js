export default function robots() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in').replace(/\/$/, '');
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/admin/login',
          '/checkout',
          '/account',
          '/account/',
          '/my-orders',
          '/auth/',
        ],
      },
      {
        userAgent: [
          'Googlebot',
          'Bingbot',
          'GPTBot',
          'ChatGPT-User',
          'ClaudeBot',
          'PerplexityBot',
          'Applebot',
          'Amazonbot',
          'cohere-ai',
        ],
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/checkout',
          '/account',
          '/my-orders',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
