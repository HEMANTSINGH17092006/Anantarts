import { Suspense } from 'react';
import ShopCatalogClient from '@/components/shop/ShopCatalogClient';
import { getCategories, getProducts } from '@/lib/db-helpers';
import { constructMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const resolvedParams = searchParams ? await searchParams : {};
  const PAGE_SIZE = 24;

  const rawProducts = await getProducts();
  const totalProducts = Array.isArray(rawProducts) ? rawProducts.length : 0;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));

  const rawPageParam = parseInt(resolvedParams?.page, 10);
  const isPageParamProvided = !isNaN(rawPageParam);
  const requestedPage = isPageParamProvided && rawPageParam >= 1 ? rawPageParam : 1;
  const isOutOfRange = isPageParamProvided && rawPageParam > totalPages;
  const validPage = Math.min(requestedPage, totalPages);

  const hasSubFilters = Boolean(
    resolvedParams?.search ||
    resolvedParams?.minPrice ||
    resolvedParams?.maxPrice ||
    resolvedParams?.sort ||
    resolvedParams?.material ||
    resolvedParams?.occasion ||
    resolvedParams?.color ||
    resolvedParams?.inStock
  );

  const categoryParam = resolvedParams?.category;
  let canonicalUrl = '/shop';
  if (categoryParam) {
    canonicalUrl = validPage > 1 ? `/category/${categoryParam}?page=${validPage}` : `/category/${categoryParam}`;
  } else if (validPage > 1) {
    canonicalUrl = `/shop?page=${validPage}`;
  }

  const baseTitle = 'Handicrafts Online India — Handcrafted Idols & Décor | Anant Arts';
  const title = validPage > 1 
    ? `Handicrafts Online India — Page ${validPage} | Anant Arts`
    : baseTitle;

  return constructMetadata({
    title,
    description: 'Shop authentic handicrafts online in India. Explore master-crafted 24K gold god idols, handmade wooden home décor, and traditional Indian handicrafts with insured shipping.',
    canonical: canonicalUrl,
    noIndex: hasSubFilters || isOutOfRange,
    keywords: [
      'handicrafts online India',
      'Indian handicrafts online',
      'handmade handicrafts',
      'handcrafted products',
      'traditional handicrafts India'
    ]
  });
}

// Helper to construct a lightweight searchable description:
// Preserves the first 180 chars for UI preview (e.g. QuickView modal)
// followed by unique extra keywords from the remaining text to retain 100% search accuracy
function buildSearchableDescription(rawDesc, name = '') {
  if (!rawDesc) return '';
  const plain = rawDesc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const snippet = plain.slice(0, 180);
  
  const existingWords = new Set((snippet + ' ' + name).toLowerCase().match(/[a-z0-9]+/g) || []);
  const remainingWords = plain.slice(180).toLowerCase().match(/[a-z0-9]+/g) || [];
  const uniqueExtras = [];
  for (const w of remainingWords) {
    if (w.length > 2 && !existingWords.has(w)) {
      existingWords.add(w);
      uniqueExtras.push(w);
    }
  }
  return uniqueExtras.length > 0 ? `${snippet} | ${uniqueExtras.join(' ')}` : snippet;
}

const PRODUCTION_DOMAIN = 'https://anantarts.in';
const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || PRODUCTION_DOMAIN).replace(/\/$/, '');

export default async function ShopPage({ searchParams }) {
  const resolvedParams = searchParams ? await searchParams : {};
  const PAGE_SIZE = 24;

  const categories = await getCategories();
  const rawProducts = await getProducts(); // Fetch all published products for instant client-side filtering

  // Performance Optimization: Strip multi-kilobyte raw HTML descriptions, unused images array,
  // and unneeded database fields before serializing to Client Component flight payload.
  const products = (rawProducts || []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku || '',
    price: p.price,
    discount_price: p.discount_price,
    stock_quantity: p.stock_quantity,
    material: p.material || '',
    tags: p.tags || '',
    occasion: p.occasion || '',
    color: p.color || '',
    rating: p.rating || 5,
    created_at: p.created_at || '',
    is_bestseller: p.is_bestseller,
    is_new_arrival: p.is_new_arrival,
    category_id: p.category_id,
    category_name: p.category_name || p.categories?.name || '',
    category_slug: p.category_slug || p.categories?.slug || '',
    image_path: p.image_path || (p.images?.[0]?.image_path) || (p.product_images?.[0]?.image_path) || '/images/placeholder.jpg',
    // Lightweight plain-text snippet (180 chars for QuickView display) + unique keywords for 100% search accuracy
    description: buildSearchableDescription(p.description, p.name),
  }));

  // Pagination derivation matching generateMetadata & ShopCatalogClient
  const totalProducts = products.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const rawPageParam = parseInt(resolvedParams?.page, 10);
  const isPageParamProvided = !isNaN(rawPageParam);
  const requestedPage = isPageParamProvided && rawPageParam >= 1 ? rawPageParam : 1;
  const isOutOfRange = isPageParamProvided && rawPageParam > totalPages;
  const validPage = Math.min(requestedPage, totalPages);
  const startIndex = (validPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalProducts);
  const displayedProducts = products.slice(startIndex, endIndex);

  // Active filter detection: emit CollectionPage/ItemList only for clean catalog pages
  const hasSubFilters = Boolean(
    resolvedParams?.search ||
    resolvedParams?.minPrice ||
    resolvedParams?.maxPrice ||
    resolvedParams?.sort ||
    resolvedParams?.material ||
    resolvedParams?.occasion ||
    resolvedParams?.color ||
    resolvedParams?.inStock
  );
  const categoryParam = resolvedParams?.category;
  const isCleanCatalog = !categoryParam && !hasSubFilters && !isOutOfRange;

  const canonicalUrl = validPage > 1 
    ? `${BASE_URL}/shop?page=${validPage}` 
    : `${BASE_URL}/shop`;

  const pageTitle = validPage > 1 
    ? `Handicrafts Online India — Page ${validPage} | Anant Arts`
    : 'Handicrafts Online India — Handcrafted Idols & Décor | Anant Arts';
  const pageDescription = 'Shop authentic handicrafts online in India. Explore master-crafted 24K gold god idols, handmade wooden home décor, and traditional Indian handicrafts with insured shipping.';

  const breadcrumbSchema = isCleanCatalog ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Shop', item: `${BASE_URL}/shop` },
    ],
  } : null;

  const collectionSchema = isCleanCatalog ? {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    description: pageDescription,
    url: canonicalUrl,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: displayedProducts.map((p, idx) => ({
        '@type': 'ListItem',
        position: startIndex + idx + 1,
        url: `${BASE_URL}/product/${p.slug}`,
        name: p.name,
      })),
    },
  } : null;

  return (
    <>
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      {collectionSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
        />
      )}
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
        <ShopCatalogClient 
          initialProducts={products} 
          categories={categories} 
          initialPage={validPage}
          pageSize={PAGE_SIZE}
        />
      </Suspense>
    </>
  );
}
