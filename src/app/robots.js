export default function robots() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in').replace(/\/$/, '');

  const privateDisallows = [
    '/api/',
    '/admin/',
    '/admin/login',
    '/checkout',
    '/checkout/',
    '/account',
    '/account/',
    '/my-orders',
    '/auth/',
  ];

  const searchAndAiBots = [
    'Googlebot',
    'Google-Extended',
    'Bingbot',
    'GPTBot',
    'ChatGPT-User',
    'OAI-SearchBot',
    'ClaudeBot',
    'Claude-SearchBot',
    'Claude-User',
    'PerplexityBot',
    'Perplexity-User',
    'Applebot',
    'Amazonbot',
    'cohere-ai',
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: privateDisallows,
      },
      {
        userAgent: searchAndAiBots,
        allow: '/',
        disallow: privateDisallows,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

