'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ProductCard from '../common/ProductCard';
import FilterSidebar from './FilterSidebar';
import CollectionHero from './CollectionHero';

export default function ShopCatalogClient({ initialProducts = [], categories = [] }) {
  const searchParams = useSearchParams();

  // Filter States initialized from URL params if present
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedMaterial, setSelectedMaterial] = useState(searchParams.get('material') || '');
  const [selectedOccasion, setSelectedOccasion] = useState(searchParams.get('occasion') || '');
  const [selectedColor, setSelectedColor] = useState(searchParams.get('color') || '');
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get('maxPrice')) || 50000);
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('inStock') === '1');
  const [sort, setSort] = useState(searchParams.get('sort') || 'latest');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Active Category Object for Hero Banner
  const activeCategoryObj = useMemo(() => {
    if (!selectedCategory) return null;
    return categories.find(c => c.slug === selectedCategory || c.name.toLowerCase() === selectedCategory.toLowerCase());
  }, [categories, selectedCategory]);

  // Filter and Sort Logic
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // 1. Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category_name && p.category_name.toLowerCase().includes(q)) ||
        (p.material && p.material.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    // 2. Category
    if (selectedCategory) {
      const catSlug = selectedCategory.toLowerCase();
      result = result.filter(p =>
        p.category_slug?.toLowerCase() === catSlug ||
        p.category_name?.toLowerCase() === catSlug
      );
    }

    // 3. Material
    if (selectedMaterial) {
      const mat = selectedMaterial.toLowerCase();
      result = result.filter(p => p.material && p.material.toLowerCase().includes(mat));
    }

    // 4. Occasion
    if (selectedOccasion) {
      const occ = selectedOccasion.toLowerCase();
      result = result.filter(p =>
        (p.occasion && p.occasion.toLowerCase().includes(occ)) ||
        (p.name && p.name.toLowerCase().includes(occ)) ||
        (p.tags && p.tags.toLowerCase().includes(occ))
      );
    }

    // 5. Color
    if (selectedColor) {
      const col = selectedColor.toLowerCase();
      result = result.filter(p => p.color && p.color.toLowerCase().includes(col));
    }

    // 6. Max Price
    result = result.filter(p => {
      const price = p.discount_price && p.discount_price > 0 ? p.discount_price : p.price;
      return price <= maxPrice;
    });

    // 7. Availability: In Stock
    if (inStockOnly) {
      result = result.filter(p => p.stock_quantity > 0);
    }

    // 8. Sorting
    if (sort === 'price-low') {
      result.sort((a, b) => (a.discount_price || a.price) - (b.discount_price || b.price));
    } else if (sort === 'price-high') {
      result.sort((a, b) => (b.discount_price || b.price) - (a.discount_price || a.price));
    } else if (sort === 'rating') {
      result.sort((a, b) => (b.rating || 5) - (a.rating || 5));
    } else if (sort === 'discount') {
      result.sort((a, b) => (b.discount_price ? (b.price - b.discount_price) : 0) - (a.discount_price ? (a.price - a.discount_price) : 0));
    } else {
      // Default: Latest
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return result;
  }, [initialProducts, search, selectedCategory, selectedMaterial, selectedOccasion, selectedColor, maxPrice, inStockOnly, sort]);

  const handleClearAll = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedMaterial('');
    setSelectedOccasion('');
    setSelectedColor('');
    setMaxPrice(50000);
    setInStockOnly(false);
    setSort('latest');
  };

  return (
    <div style={{ background: 'var(--bg-cream)', minHeight: '100vh', paddingBottom: '4rem' }}>
      
      {/* 1. Dynamic Collection Hero Banner */}
      <CollectionHero 
        categoryName={activeCategoryObj ? activeCategoryObj.name : (selectedCategory ? selectedCategory.replace('-', ' ') : '')}
        categoryDescription={activeCategoryObj ? activeCategoryObj.description : ''}
        categoryBanner={activeCategoryObj ? activeCategoryObj.banner_path : ''}
      />

      <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '2.5rem 1.5rem 0 1.5rem' }}>
        
        {/* 2. Top Controls Bar */}
        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
          background: '#FFFFFF',
          padding: '14px 20px',
          borderRadius: '10px',
          border: '1px solid var(--primary-gold-border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Left: Product Count */}
          <div style={{ fontSize: '0.9rem', color: 'var(--text-dark)', fontWeight: '600' }}>
            Showing: <span style={{ color: 'var(--primary-gold)' }}>{filteredProducts.length}</span> Products
          </div>

          {/* Right: Sort Dropdown & Grid/List Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
              <label htmlFor="sort-select" style={{ fontWeight: '500', color: 'var(--text-muted)' }}>Sort By:</label>
              <select
                id="sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--primary-gold-border)',
                  fontSize: '0.84rem',
                  color: 'var(--text-dark)',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="latest">Newest</option>
                <option value="popularity">Popularity</option>
                <option value="price-low">Price Low to High</option>
                <option value="price-high">Price High to Low</option>
                <option value="rating">Customer Rating</option>
                <option value="discount">Discount %</option>
              </select>
            </div>

            {/* Grid / List View Toggle */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-cream-dark)', padding: '3px', borderRadius: '6px' }}>
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Grid View"
                style={{
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  background: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'grid' ? 'var(--primary-gold)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                <i className="fas fa-th"></i>
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="List View"
                style={{
                  padding: '6px 10px',
                  borderRadius: '4px',
                  border: 'none',
                  background: viewMode === 'list' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'list' ? 'var(--primary-gold)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Main Catalog Container (Sidebar + Grid) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '2.5rem',
          alignItems: 'start'
        }} className="catalog-main-layout">
          
          {/* Left Sticky Filter Sidebar */}
          <FilterSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedMaterial={selectedMaterial}
            onSelectMaterial={setSelectedMaterial}
            selectedOccasion={selectedOccasion}
            onSelectOccasion={setSelectedOccasion}
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
            maxPrice={maxPrice}
            onPriceChange={setMaxPrice}
            inStockOnly={inStockOnly}
            onInStockChange={setInStockOnly}
            onClearAll={handleClearAll}
          />

          {/* Right Product Grid / List or Empty State */}
          <div>
            {filteredProducts.length > 0 ? (
              <div 
                className={viewMode === 'grid' ? "shop-products-grid" : "shop-products-list"}
                style={{
                  display: viewMode === 'grid' ? 'grid' : 'flex',
                  flexDirection: viewMode === 'list' ? 'column' : 'none',
                  gap: '1.75rem'
                }}
              >
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} isListView={viewMode === 'list'} />
                ))}
              </div>
            ) : (
              /* Premium Empty State */
              <div style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '4rem 2rem',
                textAlign: 'center',
                border: '1px solid var(--primary-gold-border)',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🪷</div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--text-dark)', marginBottom: '8px' }}>
                  No Products Match Your Selected Filters
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
                  Try relaxing your price boundary, clearing material filters, or browsing our recommended handcrafted collections below.
                </p>
                <button onClick={handleClearAll} className="btn-gold" style={{ padding: '10px 24px', fontSize: '0.85rem', marginBottom: '3rem' }}>
                  Clear All Filters
                </button>

                {/* Recommended Collections */}
                <div style={{ borderTop: '1px solid var(--bg-cream-dark)', paddingTop: '2rem' }}>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--text-dark)' }}>
                    Popular Handcrafted Collections
                  </h4>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/shop?category=spiritual-collection" className="btn-outline-gold" style={{ fontSize: '0.78rem', padding: '8px 16px' }}>
                      Spiritual Collection
                    </Link>
                    <Link href="/shop?category=wooden-handicrafts" className="btn-outline-gold" style={{ fontSize: '0.78rem', padding: '8px 16px' }}>
                      Wooden Handicrafts
                    </Link>
                    <Link href="/shop?category=home-decor" className="btn-outline-gold" style={{ fontSize: '0.78rem', padding: '8px 16px' }}>
                      Home Décor
                    </Link>
                    <Link href="/corporate-gifts" className="btn-outline-gold" style={{ fontSize: '0.78rem', padding: '8px 16px' }}>
                      Corporate Gifts
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
