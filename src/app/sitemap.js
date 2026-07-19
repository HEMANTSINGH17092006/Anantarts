import { getSettings } from '@/lib/db-helpers';

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in';
  
  // Static Routes
  const routes = [
    '',
    '/shop',
    '/about',
    '/contact',
    '/shipping-policy',
    '/return-policy',
    '/privacy-policy',
    '/terms-and-conditions',
  ].map((route) => ({
    url: `${baseUrl.replace(/\/$/, '')}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' || route === '/shop' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  // If there's a need to fetch products dynamically for the sitemap, we can do it here.
  // For now, static routes cover the essential ecommerce entry points.

  return routes;
}
