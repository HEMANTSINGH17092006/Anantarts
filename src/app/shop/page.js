import { Suspense } from 'react';
import ShopCatalogClient from '@/components/shop/ShopCatalogClient';
import { getCategories, getProducts } from '@/lib/db-helpers';
import { constructMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }) {
  const resolvedParams = searchParams ? await searchParams : {};
  const pageParam = parseInt(resolvedParams?.page, 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

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
    canonicalUrl = page > 1 ? `/category/${categoryParam}?page=${page}` : `/category/${categoryParam}`;
  } else if (page > 1) {
    canonicalUrl = `/shop?page=${page}`;
  }

  const baseTitle = 'Handicrafts Online India — Handcrafted Idols & Décor | Anant Arts';
  const title = page > 1 
    ? `Handicrafts Online India — Page ${page} | Anant Arts`
    : baseTitle;

  return constructMetadata({
    title,
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

export default async function ShopPage({ searchParams }) {
  const resolvedParams = searchParams ? await searchParams : {};
  const pageParam = parseInt(resolvedParams?.page, 10);
  const initialPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

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
      <ShopCatalogClient 
        initialProducts={products} 
        categories={categories} 
        initialPage={initialPage}
        pageSize={24}
      />
    </Suspense>
  );
}
