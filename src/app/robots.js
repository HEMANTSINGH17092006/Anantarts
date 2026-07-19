export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/checkout/'],
    },
    sitemap: `${baseUrl.replace(/\/$/, '')}/sitemap.xml`,
  };
}
