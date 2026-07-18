import FilterSidebar from '@/components/shop/FilterSidebar';
import CatalogGrid from '@/components/shop/CatalogGrid';
import { getCategories, getProducts } from '@/lib/db-helpers';

export const revalidate = 60; // Cache search result skeletons/categories for 60 seconds

export default async function ShopPage({ searchParams }) {
  // Await searchParams as required in Next.js
  const params = await searchParams;
  
  const categories = await getCategories();
  
  // Fetch products with parameters from the URL
  const products = await getProducts({
    category: params.category || '',
    search: params.search || '',
    sort: params.sort || 'latest',
    maxPrice: params.maxPrice || '',
    inStock: params.inStock || '',
    tag: params.tag || '',
  });

  return (
    <div style={{ background: 'var(--bg-cream)', padding: '3rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        
        {/* Banner Headers */}
        <div className="section-heading" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem' }}>
            {params.wishlist === 'true' ? 'Your Sacred Wishlist' : 'Artisan Idol Catalog'}
          </h2>
          <div className="gold-line" style={{ margin: '8px 0 16px 0' }}></div>
          <p style={{ margin: 0 }}>
            {params.wishlist === 'true' 
              ? 'Patronize and complete your selection of divine luxury sculptures.' 
              : 'Browse our collection of masterfully casted and electroplated spiritual sculptures.'}
          </p>
        </div>

        {/* Layout Grid */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          gap: '2.5rem', 
          alignItems: 'flex-start',
          flexWrap: 'wrap' 
        }}>
          {/* Left Sidebar Filter */}
          <div style={{ flex: '1 1 280px', maxWidth: '320px' }}>
            <FilterSidebar categories={categories} />
          </div>

          {/* Right Product Grid */}
          <div style={{ flex: '3 1 600px' }}>
            <CatalogGrid initialProducts={products} />
          </div>
        </div>

      </div>
    </div>
  );
}
