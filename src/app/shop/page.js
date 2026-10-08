import { Suspense } from 'react';
import ShopCatalogClient from '@/components/shop/ShopCatalogClient';
import { getCategories, getProducts } from '@/lib/db-helpers';
import { constructMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const resolvedParams = searchParams ? await searchParams : {};
  const hasSubFilters = Boolean(
    resolvedParams?.search ||
    resolvedParams?.minPrice ||
    resolvedParams?.maxPrice ||
    resolvedParams?.sort
  );

  const categoryParam = resolvedParams?.category;
  const canonicalUrl = categoryParam ? `/category/${categoryParam}` : '/shop';

  return constructMetadata({
    title: 'Handicrafts Online India — Handcrafted Idols & Décor | Anant Arts',
    description: 'Shop authentic handicrafts online in India. Explore master-crafted 24K gold god idols, handmade wooden home décor, and traditional Indian handicrafts with insured shipping.',
    canonical: canonicalUrl,
    noIndex: hasSubFilters,
    keywords: [
      'handicrafts online India',
      'Indian handicrafts online',
      'handmade handicrafts',
      'handcrafted products',
      'traditional handicrafts India'
    ]
  });
}

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
