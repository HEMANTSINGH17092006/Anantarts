'use client';
import { useState } from 'react';

export default function FilterSidebar({
  categories = [],
  selectedCategory = '',
  onSelectCategory,
  selectedMaterial = '',
  onSelectMaterial,
  selectedOccasion = '',
  onSelectOccasion,
  selectedColor = '',
  onSelectColor,
  minPrice = 0,
  maxPrice = 50000,
  onPriceChange,
  inStockOnly = false,
  onInStockChange,
  onClearAll
}) {
  const [openSections, setOpenSections] = useState({
    category: true,
    material: true,
    price: true,
    color: false,
    availability: true,
    rating: false,
    offers: false,
    occasion: false,
    brand: false
  });

  const toggleSection = (sec) => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const MATERIALS_LIST = ['Wood', 'Resin', 'Metal', 'Marble', 'Brass', 'Silver Plated', 'Gold Plated', 'MDF', 'Glass', 'Mixed Materials'];
  const OCCASIONS_LIST = ['Housewarming', 'Wedding', 'Anniversary', 'Birthday', 'Corporate Events', 'Diwali', 'Ganesh Chaturthi', 'Christmas', 'New Year'];
  const COLORS_LIST = ['Gold', 'Silver', 'Antique Bronze', 'Natural Wood', 'White Marble', 'Black', 'Multi Color'];

  return (
    <aside style={{
      background: '#FFFFFF',
      borderRadius: '12px',
      border: '1px solid var(--primary-gold-border)',
      boxShadow: 'var(--shadow-sm)',
      padding: '20px',
      position: 'sticky',
      top: '90px',
      alignSelf: 'start'
    }}>
      {/* Sidebar Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--primary-gold-border)', paddingBottom: '12px' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', margin: 0, color: 'var(--text-dark)', fontWeight: '600' }}>
          <i className="fas fa-filter" style={{ color: 'var(--primary-gold)', marginRight: '8px', fontSize: '0.9rem' }}></i> Filters
        </h3>
        <button
          onClick={onClearAll}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--danger)',
            fontSize: '0.78rem',
            fontWeight: '600',
            cursor: 'pointer',
            padding: 0
          }}
        >
          Clear All
        </button>
      </div>

      {/* 1. Category Accordion */}
      <div style={{ marginBottom: '14px', borderBottom: '1px solid var(--bg-cream-dark)', paddingBottom: '10px' }}>
        <button
          onClick={() => toggleSection('category')}
          style={accordionHeaderStyle}
        >
          <span>Category</span>
          <i className={`fas fa-chevron-${openSections.category ? 'up' : 'down'}`} style={{ fontSize: '0.75rem' }}></i>
        </button>
        {openSections.category && (
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => onSelectCategory('')}
              style={filterItemStyle(selectedCategory === '')}
            >
              • All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.slug)}
                style={filterItemStyle(selectedCategory === cat.slug)}
              >
                • {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Material Accordion */}
      <div style={{ marginBottom: '14px', borderBottom: '1px solid var(--bg-cream-dark)', paddingBottom: '10px' }}>
        <button onClick={() => toggleSection('material')} style={accordionHeaderStyle}>
          <span>Material</span>
          <i className={`fas fa-chevron-${openSections.material ? 'up' : 'down'}`} style={{ fontSize: '0.75rem' }}></i>
        </button>
        {openSections.material && (
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {MATERIALS_LIST.map((mat, idx) => (
              <button
                key={idx}
                onClick={() => onSelectMaterial(selectedMaterial === mat ? '' : mat)}
                style={filterItemStyle(selectedMaterial === mat)}
              >
                • {mat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Price Accordion */}
      <div style={{ marginBottom: '14px', borderBottom: '1px solid var(--bg-cream-dark)', paddingBottom: '10px' }}>
        <button onClick={() => toggleSection('price')} style={accordionHeaderStyle}>
          <span>Price Range</span>
          <i className={`fas fa-chevron-${openSections.price ? 'up' : 'down'}`} style={{ fontSize: '0.75rem' }}></i>
        </button>
        {openSections.price && (
          <div style={{ marginTop: '10px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: '600' }}>
              <span>Max Price: ₹{maxPrice.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="500"
              max="50000"
              step="500"
              value={maxPrice}
              onChange={(e) => onPriceChange(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--primary-gold)' }}
            />
          </div>
        )}
      </div>

      {/* 4. Availability Accordion */}
      <div style={{ marginBottom: '14px', borderBottom: '1px solid var(--bg-cream-dark)', paddingBottom: '10px' }}>
        <button onClick={() => toggleSection('availability')} style={accordionHeaderStyle}>
          <span>Availability</span>
          <i className={`fas fa-chevron-${openSections.availability ? 'up' : 'down'}`} style={{ fontSize: '0.75rem' }}></i>
        </button>
        {openSections.availability && (
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="instock-chk"
              checked={inStockOnly}
              onChange={(e) => onInStockChange(e.target.checked)}
              style={{ accentColor: 'var(--primary-gold)', width: '16px', height: '16px' }}
            />
            <label htmlFor="instock-chk" style={{ fontSize: '0.84rem', cursor: 'pointer' }}>In Stock Only</label>
          </div>
        )}
      </div>

      {/* 5. Occasion Accordion */}
      <div style={{ marginBottom: '14px', borderBottom: '1px solid var(--bg-cream-dark)', paddingBottom: '10px' }}>
        <button onClick={() => toggleSection('occasion')} style={accordionHeaderStyle}>
          <span>Occasion</span>
          <i className={`fas fa-chevron-${openSections.occasion ? 'up' : 'down'}`} style={{ fontSize: '0.75rem' }}></i>
        </button>
        {openSections.occasion && (
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {OCCASIONS_LIST.map((occ, idx) => (
              <button
                key={idx}
                onClick={() => onSelectOccasion(selectedOccasion === occ ? '' : occ)}
                style={filterItemStyle(selectedOccasion === occ)}
              >
                • {occ}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 6. Color Accordion */}
      <div style={{ marginBottom: '14px' }}>
        <button onClick={() => toggleSection('color')} style={accordionHeaderStyle}>
          <span>Finish &amp; Color</span>
          <i className={`fas fa-chevron-${openSections.color ? 'up' : 'down'}`} style={{ fontSize: '0.75rem' }}></i>
        </button>
        {openSections.color && (
          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {COLORS_LIST.map((col, idx) => (
              <button
                key={idx}
                onClick={() => onSelectColor(selectedColor === col ? '' : col)}
                style={filterItemStyle(selectedColor === col)}
              >
                • {col}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

const accordionHeaderStyle = {
  width: '100%',
  background: 'none',
  border: 'none',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontWeight: '600',
  fontSize: '0.88rem',
  color: 'var(--text-dark)',
  cursor: 'pointer',
  padding: '4px 0'
};

function filterItemStyle(isActive) {
  return {
    background: isActive ? 'var(--primary-gold-light)' : 'transparent',
    border: 'none',
    textAlign: 'left',
    padding: '6px 8px',
    borderRadius: '4px',
    fontSize: '0.82rem',
    color: isActive ? 'var(--primary-gold-hover)' : 'var(--text-muted)',
    fontWeight: isActive ? '600' : '400',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };
}
