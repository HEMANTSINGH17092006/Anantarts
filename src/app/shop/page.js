import { Suspense } from 'react';
import ShopCatalogClient from '@/components/shop/ShopCatalogClient';
import { getCategories, getProducts } from '@/lib/db-helpers';
import { constructMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = constructMetadata({
  title: 'Shop Premium 24K Gold & Silver Electroplated Hindu God Idols | Anant Arts',
  description: 'Browse our complete catalog of handcrafted Lord Ganesha, Radha Krishna, Shiva, Hanuman, and Lakshmi murtis with 24K gold and pure silver electroplating.',
  canonical: '/shop',
});

export default async function ShopPage() {
  const categories = await getCategories();
  const products = await getProducts(); // Fetch all published products for instant client-side filtering

  return (
    <Suspense fallback={
      <div style={{ background: 'var(--bg-cream)', minHeight: '100vh', padding: '5rem 0', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>🪷</div>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--text-dark)' }}>
          Loading Divine Collections...
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>
          Preparing our handcrafted spiritual idols catalogue for you.
        </p>
      </div>
    }>
      <ShopCatalogClient initialProducts={products} categories={categories} />
    </Suspense>
  );
}
