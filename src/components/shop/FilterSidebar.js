'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function FilterSidebar({ categories = [], initialMaxPrice = 50000 }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local state for filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || initialMaxPrice);
  const [inStock, setInStock] = useState(searchParams.get('inStock') === '1');
  const [sort, setSort] = useState(searchParams.get('sort') || 'latest');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
  
  // Mobile collapsing state
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Synchronize state with URL search params when they change (e.g. Back button)
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setSelectedCategory(searchParams.get('category') || '');
    setMaxPrice(searchParams.get('maxPrice') || initialMaxPrice);
    setInStock(searchParams.get('inStock') === '1');
    setSort(searchParams.get('sort') || 'latest');
    setSelectedTag(searchParams.get('tag') || '');
  }, [searchParams]);

  const updateFilters = (newFilters) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Merge new filters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === null || value === '' || value === false) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset page if applicable
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ search });
  };

  const handleCategoryChange = (slug) => {
    const nextCategory = selectedCategory === slug ? '' : slug;
    setSelectedCategory(nextCategory);
    updateFilters({ category: nextCategory });
  };

  const handleTagChange = (tag) => {
    const nextTag = selectedTag === tag ? '' : tag;
    setSelectedTag(nextTag);
    updateFilters({ tag: nextTag });
  };

  const handlePriceChange = (e) => {
    const val = e.target.value;
    setMaxPrice(val);
  };

  const handlePriceMouseUp = () => {
    updateFilters({ maxPrice });
  };

  const handleInStockChange = (e) => {
    const val = e.target.checked;
    setInStock(val);
    updateFilters({ inStock: val ? '1' : '' });
  };

  const handleSortChange = (e) => {
    const val = e.target.value;
    setSort(val);
    updateFilters({ sort: val });
  };

  const handleClearAll = () => {
    setSearch('');
    setSelectedCategory('');
    setMaxPrice(initialMaxPrice);
    setInStock(false);
    setSelectedTag('');
    setSort('latest');
    router.push(pathname);
  };

  return (
    <div className="filter-sidebar-container" style={{
      background: 'var(--bg-white)',
      border: '1px solid var(--primary-gold-border)',
      borderRadius: '8px',
      padding: isMobile ? '12px 16px' : '24px',
      width: '100%'
    }}>
      {isMobile && (
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            padding: '4px 0',
            color: 'var(--text-dark)',
            fontWeight: '600',
            fontSize: '0.95rem',
            fontFamily: 'var(--font-heading)'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fas fa-filter" style={{ color: 'var(--primary-gold)', fontSize: '0.85rem' }}></i> 
            Filter & Sort Products
          </span>
          <i className={`fas fa-chevron-${isCollapsed ? 'down' : 'up'}`} style={{ color: 'var(--primary-gold)', fontSize: '0.85rem' }}></i>
        </button>
      )}

      {(!isMobile || !isCollapsed) && (
        <div style={{ marginTop: isMobile ? '16px' : '0' }}>
          {/* Search Bar */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: '10px' }}>Search Idols</h4>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Type search terms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid var(--primary-gold-border)',
                  fontSize: '0.85rem'
                }}
              />
              <button type="submit" className="btn-gold" style={{ padding: '8px 12px' }}>
                <i className="fas fa-search"></i>
              </button>
            </form>
          </div>

          {/* Sort */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: '10px' }}>Sort By</h4>
            <select
              value={sort}
              onChange={handleSortChange}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px solid var(--primary-gold-border)',
                fontSize: '0.85rem',
                background: 'white',
                outline: 'none'
              }}
            >
              <option value="latest">Newest Arrivals</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          {/* Categories */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: '10px' }}>Deities</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map((cat) => (
                <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedCategory === cat.slug}
                    onChange={() => handleCategoryChange(cat.slug)}
                    style={{ accentColor: 'var(--primary-gold)' }}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: '10px' }}>Featured Tags</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Best Seller', 'New Arrival', 'Featured', 'Festival Special'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagChange(tag)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '16px',
                    border: '1px solid var(--primary-gold)',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    background: selectedTag === tag ? 'var(--gold-gradient)' : 'transparent',
                    color: selectedTag === tag ? 'var(--text-dark)' : 'var(--text-dark)',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Price Slider */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', margin: 0 }}>Max Price</h4>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary-gold-hover)' }}>
                ₹{Number(maxPrice).toLocaleString('en-IN')}
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="50000"
              step="1000"
              value={maxPrice}
              onChange={handlePriceChange}
              onMouseUp={handlePriceMouseUp}
              onTouchEnd={handlePriceMouseUp}
              style={{ width: '100%', accentColor: 'var(--primary-gold)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              <span>₹1,000</span>
              <span>₹50,000</span>
            </div>
          </div>

          {/* Stock Toggle */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={inStock}
                onChange={handleInStockChange}
                style={{ accentColor: 'var(--primary-gold)' }}
              />
              <strong>In Stock Only</strong>
            </label>
          </div>

          {/* Clear Button */}
          <button
            onClick={handleClearAll}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--text-muted)',
              background: 'transparent',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: '500',
              cursor: 'pointer',
              color: 'var(--text-dark)',
              transition: 'all 0.2s ease'
            }}
          >
            <i className="fas fa-undo" style={{ marginRight: '6px' }}></i> Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
