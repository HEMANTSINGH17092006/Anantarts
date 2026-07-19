'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, usePathname } from 'next/navigation';
import ProductCard from '../common/ProductCard';

export default function ShopCatalogClient({ initialProducts = [], categories = [] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Calculate dynamic price boundaries based on actual catalog products
  const minPossiblePrice = useMemo(() => {
    if (initialProducts.length === 0) return 0;
    const prices = initialProducts.map(p => p.discount_price && p.discount_price > 0 ? p.discount_price : p.price);
    return Math.floor(Math.min(...prices));
  }, [initialProducts]);

  const maxPossiblePrice = useMemo(() => {
    if (initialProducts.length === 0) return 50000;
    const prices = initialProducts.map(p => p.discount_price && p.discount_price > 0 ? p.discount_price : p.price);
    const maxVal = Math.ceil(Math.max(...prices));
    return maxVal === minPossiblePrice ? maxVal + 1000 : maxVal;
  }, [initialProducts, minPossiblePrice]);

  // Filter States initialized from URL params if present
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedDeity, setSelectedDeity] = useState(searchParams.get('category') || '');
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
  const [selectedMaterial, setSelectedMaterial] = useState(searchParams.get('material') || '');
  const [minPrice, setMinPrice] = useState(Number(searchParams.get('minPrice')) || minPossiblePrice);
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get('maxPrice')) || maxPossiblePrice);
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('inStock') === '1');
  const [readyToShip, setReadyToShip] = useState(searchParams.get('readyToShip') === '1');
  const [customizable, setCustomizable] = useState(searchParams.get('customizable') === '1');
  const [sort, setSort] = useState(searchParams.get('sort') || 'latest');

  // Keep minPrice/maxPrice boundaries synchronized when products data changes
  useEffect(() => {
    if (!searchParams.get('minPrice')) {
      setMinPrice(minPossiblePrice);
    }
    if (!searchParams.get('maxPrice')) {
      setMaxPrice(maxPossiblePrice);
    }
  }, [minPossiblePrice, maxPossiblePrice, searchParams]);

  // Sync URL query params with state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedDeity) params.set('category', selectedDeity);
    if (selectedTag) params.set('tag', selectedTag);
    if (selectedMaterial) params.set('material', selectedMaterial);
    if (minPrice > minPossiblePrice) params.set('minPrice', minPrice);
    if (maxPrice < maxPossiblePrice) params.set('maxPrice', maxPrice);
    if (inStockOnly) params.set('inStock', '1');
    if (readyToShip) params.set('readyToShip', '1');
    if (customizable) params.set('customizable', '1');
    if (sort !== 'latest') params.set('sort', sort);

    const queryString = params.toString();
    const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
    window.history.replaceState(null, '', targetUrl);
  }, [search, selectedDeity, selectedTag, selectedMaterial, minPrice, maxPrice, inStockOnly, readyToShip, customizable, sort, pathname, minPossiblePrice, maxPossiblePrice]);

  // Accordion Expand/Collapse States
  const [expandedSections, setExpandedSections] = useState({
    deities: true,
    price: true,
    availability: true,
    tags: true,
    material: false
  });

  // Mobile Filter Drawer States
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);

  // For mobile apply/clear staging
  const [stagedFilters, setStagedFilters] = useState({});

  // Reference for click-away search suggestions
  const searchWrapperRef = useRef(null);

  // Extract unique materials from products
  const uniqueMaterials = useMemo(() => {
    const materials = initialProducts
      .map(p => p.material)
      .filter(Boolean)
      .map(m => m.trim());
    return Array.from(new Set(materials));
  }, [initialProducts]);

  // Handle accordion toggling
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Close suggestions on clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync staged filters on mobile open
  useEffect(() => {
    if (mobileFilterOpen) {
      setStagedFilters({
        search,
        selectedDeity,
        selectedTag,
        selectedMaterial,
        minPrice,
        maxPrice,
        inStockOnly,
        readyToShip,
        customizable
      });
    }
  }, [mobileFilterOpen]);

  // Apply staging filters on mobile
  const applyMobileFilters = () => {
    setSearch(stagedFilters.search || '');
    setSelectedDeity(stagedFilters.selectedDeity || '');
    setSelectedTag(stagedFilters.selectedTag || '');
    setSelectedMaterial(stagedFilters.selectedMaterial || '');
    setMinPrice(stagedFilters.minPrice ?? 1000);
    setMaxPrice(stagedFilters.maxPrice ?? 50000);
    setInStockOnly(stagedFilters.inStockOnly || false);
    setReadyToShip(stagedFilters.readyToShip || false);
    setCustomizable(stagedFilters.customizable || false);
    setMobileFilterOpen(false);
  };

  // Clear staging filters
  const clearMobileFilters = () => {
    setStagedFilters({
      search: '',
      selectedDeity: '',
      selectedTag: '',
      selectedMaterial: '',
      minPrice: 1000,
      maxPrice: 50000,
      inStockOnly: false,
      readyToShip: false,
      customizable: false
    });
  };

  // Clear all filters (Desktop)
  const clearAllFilters = () => {
    setSearch('');
    setSelectedDeity('');
    setSelectedTag('');
    setSelectedMaterial('');
    setMinPrice(1000);
    setMaxPrice(50000);
    setInStockOnly(false);
    setReadyToShip(false);
    setCustomizable(false);
    setSort('latest');
  };

// Helper to ignore Capital letters, extra spaces, hyphens, and underscores for category comparison
function normalizeCategorySlug(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s-_]+/g, '');
}

  // Filter and sort logic (instant client-side!)
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...initialProducts];

    // Debug logging
    const activeCategoryObj = categories.find(c => 
      normalizeCategorySlug(c.slug) === normalizeCategorySlug(selectedDeity) ||
      normalizeCategorySlug(c.name) === normalizeCategorySlug(selectedDeity)
    );
    console.log('--- Catalog Filter Debugging ---');
    console.log('Selected Category URL param:', selectedDeity);
    console.log('Category ID mapped:', activeCategoryObj ? activeCategoryObj.id : 'N/A');
    console.log('Category Slug mapped:', activeCategoryObj ? activeCategoryObj.slug : 'N/A');
    console.log('Fetched Products Count:', initialProducts.length);
    console.log('Applied Filters:', {
      search,
      category: selectedDeity,
      tag: selectedTag,
      material: selectedMaterial,
      priceRange: `₹${minPrice} - ₹${maxPrice}`,
      inStockOnly,
      readyToShip,
      customizable,
      sort
    });

    // 1. Search Query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) ||
        (p.category_name && p.category_name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    // 2. Deity / Category (Ignorings case, spaces, and hyphens)
    if (selectedDeity) {
      result = result.filter(p => 
        normalizeCategorySlug(p.category_slug) === normalizeCategorySlug(selectedDeity) ||
        normalizeCategorySlug(p.category_name) === normalizeCategorySlug(selectedDeity)
      );
    }

    // 3. Featured Tags
    if (selectedTag) {
      result = result.filter(p => {
        if (!p.tags) return false;
        const parsedTags = typeof p.tags === 'string' 
          ? (p.tags.startsWith('[') ? JSON.parse(p.tags) : p.tags.split(',').map(t=>t.trim()))
          : p.tags;
        return parsedTags.includes(selectedTag);
      });
    }

    // 4. Material
    if (selectedMaterial) {
      result = result.filter(p => p.material && p.material.trim() === selectedMaterial);
    }

    // 5. Price Range
    result = result.filter(p => {
      const price = p.discount_price && p.discount_price > 0 ? p.discount_price : p.price;
      return price >= minPrice && price <= maxPrice;
    });

    // 6. Availability: In Stock
    if (inStockOnly) {
      result = result.filter(p => p.stock_quantity > 0);
    }

    // 7. Availability: Ready to Ship
    if (readyToShip) {
      result = result.filter(p => p.stock_quantity > 0 && (!p.tags || !p.tags.includes('Custom')));
    }

    // 8. Availability: Customizable
    if (customizable) {
      result = result.filter(p => p.tags && (p.tags.includes('Custom') || p.tags.includes('Customizable')));
    }

    // 9. Sorting (Supports Final active prices: including discount!)
    if (sort === 'price-low') {
      result.sort((a, b) => {
        const pA = a.discount_price && a.discount_price > 0 ? a.discount_price : a.price;
        const pB = b.discount_price && b.discount_price > 0 ? b.discount_price : b.price;
        return pA - pB;
      });
    } else if (sort === 'price-high') {
      result.sort((a, b) => {
        const pA = a.discount_price && a.discount_price > 0 ? a.discount_price : a.price;
        const pB = b.discount_price && b.discount_price > 0 ? b.discount_price : b.price;
        return pB - pA;
      });
    } else if (sort === 'latest') {
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (sort === 'popularity') {
      result.sort((a, b) => b.id - a.id); // fallback ID ranking
    } else if (sort === 'featured') {
      result.sort((a, b) => {
        const aFeat = a.tags && a.tags.includes('Featured') ? 1 : 0;
        const bFeat = b.tags && b.tags.includes('Featured') ? 1 : 0;
        return bFeat - aFeat;
      });
    } else if (sort === 'best-seller') {
      result.sort((a, b) => {
        const aBest = a.tags && a.tags.includes('Best Seller') ? 1 : 0;
        const bBest = b.tags && b.tags.includes('Best Seller') ? 1 : 0;
        return bBest - aBest;
      });
    }

    return result;
  }, [initialProducts, search, selectedDeity, selectedTag, selectedMaterial, minPrice, maxPrice, inStockOnly, readyToShip, customizable, sort]);

  // Derived Search Suggestions
  const searchSuggestions = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return initialProducts
      .filter(p => p.name.toLowerCase().includes(q))
      .slice(0, 5);
  }, [initialProducts, search]);

  // Active Chips List
  const activeChips = useMemo(() => {
    const list = [];
    if (search.trim()) list.push({ type: 'search', label: `Search: "${search}"` });
    if (selectedDeity) {
      const cat = categories.find(c => c.slug === selectedDeity);
      list.push({ type: 'deity', label: cat ? cat.name : selectedDeity });
    }
    if (selectedTag) list.push({ type: 'tag', label: selectedTag });
    if (selectedMaterial) list.push({ type: 'material', label: selectedMaterial });
    if (minPrice > 1000 || maxPrice < 50000) {
      list.push({ type: 'price', label: `₹${minPrice.toLocaleString('en-IN')}–₹${maxPrice.toLocaleString('en-IN')}` });
    }
    if (inStockOnly) list.push({ type: 'inStock', label: 'In Stock Only' });
    if (readyToShip) list.push({ type: 'readyToShip', label: 'Ready To Ship' });
    if (customizable) list.push({ type: 'customizable', label: 'Customizable' });
    return list;
  }, [search, selectedDeity, selectedTag, selectedMaterial, minPrice, maxPrice, inStockOnly, readyToShip, customizable, categories]);

  // Handle active chip removal
  const handleRemoveChip = (chip) => {
    if (chip.type === 'search') setSearch('');
    else if (chip.type === 'deity') setSelectedDeity('');
    else if (chip.type === 'tag') setSelectedTag('');
    else if (chip.type === 'material') setSelectedMaterial('');
    else if (chip.type === 'price') {
      setMinPrice(1000);
      setMaxPrice(50000);
    }
    else if (chip.type === 'inStock') setInStockOnly(false);
    else if (chip.type === 'readyToShip') setReadyToShip(false);
    else if (chip.type === 'customizable') setCustomizable(false);
  };

  const handleMinSlider = (e) => {
    const value = Math.min(Number(e.target.value), maxPrice - 1000);
    setMinPrice(value);
  };

  const handleMaxSlider = (e) => {
    const value = Math.max(Number(e.target.value), minPrice + 1000);
    setMaxPrice(value);
  };

  return (
    <div style={{ background: 'var(--bg-cream)', minHeight: '100vh', padding: '2rem 0' }}>
      <div className="responsive-container" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* PAGE HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--primary-gold-border)', paddingBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', color: 'var(--text-dark)', margin: 0 }}>
              Divine Artisan Catalog
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px', marginBottom: 0 }}>
              Browse {filteredAndSortedProducts.length} premium electroplated spiritual idols.
            </p>
          </div>
          
          {/* DESKTOP SORTING DROPDOWN */}
          <div className="site-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }} className="desktop-wishlist-btn">
              Sort By:
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="desktop-wishlist-btn"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1.5px solid var(--primary-gold-border)',
                background: 'white',
                fontSize: '0.85rem',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer',
                color: 'var(--text-dark)',
                minWidth: '180px'
              }}
            >
              <option value="latest">Newest Arrivals</option>
              <option value="popularity">Popularity</option>
              <option value="featured">Featured Collection</option>
              <option value="best-seller">Best Sellers First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* ACTIVE FILTER CHIPS (DESKTOP) */}
        {activeChips.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '2rem' }} className="desktop-wishlist-btn">
            <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--primary-gold-hover)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Filters:</span>
            <div className="active-chips-container" style={{ margin: 0 }}>
              {activeChips.map((chip, idx) => (
                <div key={idx} className="filter-chip" onClick={() => handleRemoveChip(chip)}>
                  {chip.label} <span className="close-icon"><i className="fas fa-times"></i></span>
                </div>
              ))}
              <button 
                onClick={clearAllFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '4px 8px'
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* MOBILE CONTROLS BAR (STICKY) */}
        <div 
          style={{
            display: 'none',
            background: 'white',
            border: '1px solid var(--primary-gold-border)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '1.5rem',
            position: 'sticky',
            top: '72px',
            zIndex: 100,
            boxShadow: 'var(--shadow-sm)',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
          className="mobile-only-rating"
        >
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-dark)' }}>
            Products ({filteredAndSortedProducts.length})
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setMobileFilterOpen(true)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1.5px solid var(--primary-gold-border)',
                background: 'white',
                fontSize: '0.8rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fas fa-filter" style={{ color: 'var(--primary-gold)' }}></i> Filter
            </button>
            <button 
              onClick={() => setMobileSortOpen(true)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1.5px solid var(--primary-gold-border)',
                background: 'white',
                fontSize: '0.8rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fas fa-sort" style={{ color: 'var(--primary-gold)' }}></i> Sort
            </button>
          </div>
        </div>

        {/* CORE CATALOG GRID */}
        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start' }}>
          
          {/* DESKTOP FILTER SIDEBAR */}
          <aside style={{ flex: '0 0 320px', width: '320px' }} className="desktop-wishlist-btn">
            <div className="luxury-filter-card">
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--primary-gold-border)', paddingBottom: '12px', marginBottom: '16px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: 'var(--text-dark)', margin: 0 }}>Filters</h3>
                <button 
                  onClick={clearAllFilters}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-gold-hover)',
                    fontSize: '0.78rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    cursor: 'pointer'
                  }}
                >
                  Clear All
                </button>
              </div>

              {/* SEARCH INPUT */}
              <div className="filter-accordion-item" style={{ paddingTop: 0 }}>
                <div ref={searchWrapperRef} className="premium-search-wrapper">
                  <input
                    type="text"
                    placeholder="Search idols..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setSearchFocused(true);
                    }}
                    onFocus={() => setSearchFocused(true)}
                    className="premium-search-input"
                  />
                  <i className="fas fa-search premium-search-icon"></i>
                  {searchFocused && searchSuggestions.length > 0 && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1.5px solid var(--primary-gold)',
                        borderTop: 'none',
                        borderRadius: '0 0 12px 12px',
                        zIndex: 100,
                        boxShadow: 'var(--shadow-md)',
                        overflow: 'hidden'
                      }}
                    >
                      {searchSuggestions.map((prod) => (
                        <div 
                          key={prod.id}
                          onClick={() => {
                            setSearch(prod.name);
                            setSearchFocused(false);
                          }}
                          style={{
                            padding: '10px 14px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f3f4f6',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#fef3c7'}
                          onMouseLeave={(e) => e.target.style.background = 'white'}
                        >
                          {prod.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ACCORDION: DEITIES / CATEGORIES */}
              <div className="filter-accordion-item">
                <button 
                  onClick={() => toggleSection('deities')}
                  className={`filter-accordion-header ${expandedSections.deities ? 'active' : ''}`}
                >
                  <span>Deities</span>
                  <i className="fas fa-chevron-down chevron-icon"></i>
                </button>
                <div className={`filter-accordion-content ${expandedSections.deities ? 'expanded' : ''}`}>
                  <div className="deity-chip-container">
                    <button
                      onClick={() => setSelectedDeity('')}
                      className={`deity-chip ${!selectedDeity ? 'active' : ''}`}
                    >
                      All Idols
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedDeity(cat.slug)}
                        className={`deity-chip ${normalizeCategorySlug(selectedDeity) === normalizeCategorySlug(cat.slug) ? 'active' : ''}`}
                      >
                        {cat.name.replace('Lord ', '').replace('Goddess ', '')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ACCORDION: PRICE SLIDER */}
              <div className="filter-accordion-item">
                <button 
                  onClick={() => toggleSection('price')}
                  className={`filter-accordion-header ${expandedSections.price ? 'active' : ''}`}
                >
                  <span>Price Range</span>
                  <i className="fas fa-chevron-down chevron-icon"></i>
                </button>
                <div className={`filter-accordion-content ${expandedSections.price ? 'expanded' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-dark)' }}>
                    <span>₹{minPrice.toLocaleString('en-IN')}</span>
                    <span>₹{maxPrice.toLocaleString('en-IN')}</span>
                  </div>
                  
                  {/* Custom Dual HTML Range Slider */}
                  <div className="price-slider-container">
                    <div className="dual-slider-track"></div>
                    <div 
                      className="dual-slider-range"
                      style={{
                        left: `${((minPrice - minPossiblePrice) / (maxPossiblePrice - minPossiblePrice || 1)) * 100}%`,
                        right: `${100 - ((maxPrice - minPossiblePrice) / (maxPossiblePrice - minPossiblePrice || 1)) * 100}%`
                      }}
                    ></div>
                    <input
                      type="range"
                      min={minPossiblePrice}
                      max={maxPossiblePrice}
                      step={Math.ceil((maxPossiblePrice - minPossiblePrice) / 100) || 1}
                      value={minPrice}
                      onChange={handleMinSlider}
                      className="dual-slider-input"
                    />
                    <input
                      type="range"
                      min={minPossiblePrice}
                      max={maxPossiblePrice}
                      step={Math.ceil((maxPossiblePrice - minPossiblePrice) / 100) || 1}
                      value={maxPrice}
                      onChange={handleMaxSlider}
                      className="dual-slider-input"
                    />
                  </div>

                  {/* Range Inputs */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Min</span>
                      <input
                        type="number"
                        min={minPossiblePrice}
                        max={maxPrice - 1}
                        value={minPrice}
                        onChange={(e) => setMinPrice(Math.min(Number(e.target.value), maxPrice - 1))}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--primary-gold-border)',
                          fontSize: '0.8rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Max</span>
                      <input
                        type="number"
                        min={minPrice + 1}
                        max={maxPossiblePrice}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Math.max(Number(e.target.value), minPrice + 1))}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--primary-gold-border)',
                          fontSize: '0.8rem',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ACCORDION: AVAILABILITY TOGGLES */}
              <div className="filter-accordion-item">
                <button 
                  onClick={() => toggleSection('availability')}
                  className={`filter-accordion-header ${expandedSections.availability ? 'active' : ''}`}
                >
                  <span>Availability</span>
                  <i className="fas fa-chevron-down chevron-icon"></i>
                </button>
                <div className={`filter-accordion-content ${expandedSections.availability ? 'expanded' : ''}`}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label className="luxury-toggle-label">
                      <span>In Stock Only</span>
                      <input 
                        type="checkbox" 
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                        className="luxury-toggle-input" 
                      />
                      <span className="luxury-toggle-switch"></span>
                    </label>

                    <label className="luxury-toggle-label">
                      <span>Ready To Ship</span>
                      <input 
                        type="checkbox" 
                        checked={readyToShip}
                        onChange={(e) => setReadyToShip(e.target.checked)}
                        className="luxury-toggle-input" 
                      />
                      <span className="luxury-toggle-switch"></span>
                    </label>

                    <label className="luxury-toggle-label">
                      <span>Customizable</span>
                      <input 
                        type="checkbox" 
                        checked={customizable}
                        onChange={(e) => setCustomizable(e.target.checked)}
                        className="luxury-toggle-input" 
                      />
                      <span className="luxury-toggle-switch"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* ACCORDION: FEATURED TAG PILLS */}
              <div className="filter-accordion-item">
                <button 
                  onClick={() => toggleSection('tags')}
                  className={`filter-accordion-header ${expandedSections.tags ? 'active' : ''}`}
                >
                  <span>Featured Tags</span>
                  <i className="fas fa-chevron-down chevron-icon"></i>
                </button>
                <div className={`filter-accordion-content ${expandedSections.tags ? 'expanded' : ''}`}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {[
                      { name: 'Best Seller', icon: '🔥' },
                      { name: 'New Arrival', icon: '✨' },
                      { name: 'Featured', icon: '🏆' },
                      { name: 'Festival Special', icon: '🎁' }
                    ].map((tag) => {
                      const isSel = selectedTag === tag.name;
                      return (
                        <button
                          key={tag.name}
                          onClick={() => setSelectedTag(isSel ? '' : tag.name)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '16px',
                            border: isSel ? '1px solid var(--primary-gold)' : '1px solid var(--primary-gold-border)',
                            background: isSel ? 'var(--gold-gradient)' : 'transparent',
                            color: 'var(--text-dark)',
                            fontSize: '0.74rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s'
                          }}
                        >
                          <span>{tag.icon}</span> {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ACCORDION: MATERIALS */}
              {uniqueMaterials.length > 0 && (
                <div className="filter-accordion-item">
                  <button 
                    onClick={() => toggleSection('material')}
                    className={`filter-accordion-header ${expandedSections.material ? 'active' : ''}`}
                  >
                    <span>Material Finishes</span>
                    <i className="fas fa-chevron-down chevron-icon"></i>
                  </button>
                  <div className={`filter-accordion-content ${expandedSections.material ? 'expanded' : ''}`}>
                    <div className="deity-chip-container">
                      <button
                        onClick={() => setSelectedMaterial('')}
                        className={`deity-chip ${!selectedMaterial ? 'active' : ''}`}
                      >
                        All Materials
                      </button>
                      {uniqueMaterials.map((mat) => (
                        <button
                          key={mat}
                          onClick={() => setSelectedMaterial(selectedMaterial === mat ? '' : mat)}
                          className={`deity-chip ${selectedMaterial === mat ? 'active' : ''}`}
                        >
                          {mat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </aside>

          {/* MAIN GRID BLOCK */}
          <div style={{ flex: 1 }}>
            {filteredAndSortedProducts.length === 0 ? (
              
              /* REDESIGNED COMPACT EMPTY STATE */
              <div 
                style={{
                  textAlign: 'center',
                  padding: '60px 24px',
                  background: 'white',
                  border: '1px solid var(--primary-gold-border)',
                  borderRadius: '16px',
                  boxShadow: 'var(--shadow-sm)',
                  maxWidth: '560px',
                  margin: '2rem auto'
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '14px' }}>🌸</div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--text-dark)', marginBottom: '8px' }}>
                  No Idols Found
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5', margin: '0 0 24px 0' }}>
                  Try adjusting filters, modifying your search, or browsing our full catalog.
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={clearAllFilters} className="btn-outline-gold" style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px' }}>
                    Clear Filters
                  </button>
                  <button onClick={() => { clearAllFilters(); setSearch(''); }} className="btn-gold" style={{ padding: '8px 16px', fontSize: '0.8rem', borderRadius: '8px' }}>
                    Browse Collection
                  </button>
                </div>
              </div>
            ) : (
              /* LUXURY DYNAMIC GRIDS */
              <div className="luxury-catalog-grid">
                {filteredAndSortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MOBILE FILTER BOTTOM SHEET DRAWER */}
      <div className={`mobile-drawer-overlay ${mobileFilterOpen ? 'open' : ''}`} onClick={() => setMobileFilterOpen(false)}>
        <div className={`mobile-filter-drawer ${mobileFilterOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="mobile-drawer-header">
            <h3>Filter Products</h3>
            <button onClick={() => setMobileFilterOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem' }}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="mobile-drawer-content">
            
            {/* Search */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>Search</h4>
              <input
                type="text"
                placeholder="Search idols..."
                value={stagedFilters.search || ''}
                onChange={(e) => setStagedFilters(prev => ({ ...prev, search: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--primary-gold-border)',
                  fontSize: '0.82rem'
                }}
              />
            </div>

            {/* Deities */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>Deities</h4>
              <div className="deity-chip-container">
                <button
                  onClick={() => setStagedFilters(prev => ({ ...prev, selectedDeity: '' }))}
                  className={`deity-chip ${!stagedFilters.selectedDeity ? 'active' : ''}`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setStagedFilters(prev => ({ ...prev, selectedDeity: cat.slug }))}
                    className={`deity-chip ${normalizeCategorySlug(stagedFilters.selectedDeity) === normalizeCategorySlug(cat.slug) ? 'active' : ''}`}
                  >
                    {cat.name.replace('Lord ', '').replace('Goddess ', '')}
                  </button>
                ))}
              </div>
            </div>

             {/* Price slider */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>
                Price range (₹{(stagedFilters.minPrice ?? minPossiblePrice).toLocaleString()} - ₹{(stagedFilters.maxPrice ?? maxPossiblePrice).toLocaleString()})
              </h4>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="range"
                  min={minPossiblePrice}
                  max={maxPossiblePrice}
                  step={Math.ceil((maxPossiblePrice - minPossiblePrice) / 100) || 1}
                  value={stagedFilters.minPrice ?? minPossiblePrice}
                  onChange={(e) => setStagedFilters(prev => ({ ...prev, minPrice: Number(e.target.value) }))}
                  style={{ flex: 1, accentColor: 'var(--primary-gold)' }}
                />
                <input
                  type="range"
                  min={minPossiblePrice}
                  max={maxPossiblePrice}
                  step={Math.ceil((maxPossiblePrice - minPossiblePrice) / 100) || 1}
                  value={stagedFilters.maxPrice ?? maxPossiblePrice}
                  onChange={(e) => setStagedFilters(prev => ({ ...prev, maxPrice: Number(e.target.value) }))}
                  style={{ flex: 1, accentColor: 'var(--primary-gold)' }}
                />
              </div>
            </div>

            {/* Availability */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>Availability</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label className="luxury-toggle-label">
                  <span>In Stock Only</span>
                  <input 
                    type="checkbox" 
                    checked={stagedFilters.inStockOnly || false}
                    onChange={(e) => setStagedFilters(prev => ({ ...prev, inStockOnly: e.target.checked }))}
                    className="luxury-toggle-input" 
                  />
                  <span className="luxury-toggle-switch"></span>
                </label>
                <label className="luxury-toggle-label">
                  <span>Ready To Ship</span>
                  <input 
                    type="checkbox" 
                    checked={stagedFilters.readyToShip || false}
                    onChange={(e) => setStagedFilters(prev => ({ ...prev, readyToShip: e.target.checked }))}
                    className="luxury-toggle-input" 
                  />
                  <span className="luxury-toggle-switch"></span>
                </label>
                <label className="luxury-toggle-label">
                  <span>Customizable</span>
                  <input 
                    type="checkbox" 
                    checked={stagedFilters.customizable || false}
                    onChange={(e) => setStagedFilters(prev => ({ ...prev, customizable: e.target.checked }))}
                    className="luxury-toggle-input" 
                  />
                  <span className="luxury-toggle-switch"></span>
                </label>
              </div>
            </div>

            {/* Tags */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>Featured Tags</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['Best Seller', 'New Arrival', 'Featured', 'Festival Special'].map((tag) => {
                  const isSel = stagedFilters.selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setStagedFilters(prev => ({ ...prev, selectedTag: isSel ? '' : tag }))}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '16px',
                        border: isSel ? '1px solid var(--primary-gold)' : '1px solid var(--primary-gold-border)',
                        background: isSel ? 'var(--gold-gradient)' : 'transparent',
                        color: 'var(--text-dark)',
                        fontSize: '0.74rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
          <div className="mobile-drawer-footer">
            <button 
              onClick={clearMobileFilters}
              style={{
                flex: 1,
                padding: '12px',
                border: '1.5px solid var(--primary-gold-border)',
                borderRadius: '8px',
                background: 'white',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              Reset
            </button>
            <button 
              onClick={applyMobileFilters}
              style={{
                flex: 2,
                padding: '12px',
                border: 'none',
                borderRadius: '8px',
                background: 'var(--gold-gradient)',
                fontSize: '0.85rem',
                fontWeight: '600',
                color: 'var(--text-dark)'
              }}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE SORT BOTTOM SHEET DRAWER */}
      <div className={`mobile-drawer-overlay ${mobileSortOpen ? 'open' : ''}`} onClick={() => setMobileSortOpen(false)}>
        <div className={`mobile-filter-drawer ${mobileSortOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="mobile-drawer-header">
            <h3>Sort By</h3>
            <button onClick={() => setMobileSortOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.25rem' }}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="mobile-drawer-content" style={{ padding: '10px 0' }}>
            {[
              { val: 'latest', label: 'Newest Arrivals' },
              { val: 'popularity', label: 'Popularity' },
              { val: 'featured', label: 'Featured Collection' },
              { val: 'best-seller', label: 'Best Sellers' },
              { val: 'price-low', label: 'Price: Low to High' },
              { val: 'price-high', label: 'Price: High to Low' }
            ].map((option) => (
              <div
                key={option.val}
                onClick={() => {
                  setSort(option.val);
                  setMobileSortOpen(false);
                }}
                style={{
                  padding: '14px 20px',
                  fontSize: '0.9rem',
                  fontWeight: sort === option.val ? '600' : '400',
                  color: sort === option.val ? 'var(--primary-gold-hover)' : 'var(--text-dark)',
                  background: sort === option.val ? '#FFF8F0' : 'white',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f3f4f6'
                }}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
