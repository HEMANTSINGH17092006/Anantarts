'use client';
import { useState } from 'react';
import ProductCard from '../common/ProductCard';
import SectionHeader from '../common/SectionHeader';

export default function TabbedCollectionShowcase({ products = [] }) {
  const [activeTab, setActiveTab] = useState('all');

  const TABS = [
    { id: 'all', label: '✨ All Featured' },
    { id: 'bestsellers', label: '🔥 Best Sellers' },
    { id: 'new', label: '🌟 New Arrivals' },
    { id: 'wooden', label: '🪵 Wooden Handicrafts' },
    { id: 'spiritual', label: '🪷 Sacred Idols' }
  ];

  const filteredProducts = products.filter((p) => {
    if (activeTab === 'all') return true;
    let tags = [];
    try {
      if (p.tags) {
        tags = typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags;
      }
    } catch (e) {
      if (typeof p.tags === 'string') tags = p.tags.split(',').map(t => t.trim());
    }

    if (activeTab === 'bestsellers') {
      return p.is_bestseller === 1 || tags.includes('Best Seller') || tags.includes('Featured');
    }
    if (activeTab === 'new') {
      return p.is_new_arrival === 1 || tags.includes('New Arrival') || tags.includes('New');
    }
    if (activeTab === 'wooden') {
      return (p.category_name && p.category_name.toLowerCase().includes('wood')) || (p.material && p.material.toLowerCase().includes('wood'));
    }
    if (activeTab === 'spiritual') {
      return (p.category_name && p.category_name.toLowerCase().includes('idol')) || (p.category_name && p.category_name.toLowerCase().includes('spiritual'));
    }
    return true;
  });

  const displayProducts = filteredProducts.slice(0, 8);

  return (
    <section style={{ maxWidth: '1280px', margin: '0 auto', padding: 'var(--section-padding-y) 2rem 0 2rem' }}>
      
      {/* Reusable Section Header (Issue #2) */}
      <SectionHeader
        eyebrow="Handpicked Masterpieces"
        title="Explore Divine Collections"
        subtitle="Switch between sacred idols, bestselling murtis, and traditional Rajasthan wooden handicrafts."
      />

      {/* Tab Selector Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '2.5rem'
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 22px',
                borderRadius: '999px',
                fontSize: '0.85rem',
                fontWeight: '600',
                border: isActive ? '1.5px solid var(--primary-gold)' : '1px solid rgba(212, 175, 55, 0.25)',
                background: isActive ? 'var(--gold-gradient)' : '#FFFFFF',
                color: isActive ? '#000000' : 'var(--text-dark)',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                boxShadow: isActive ? '0 4px 14px rgba(212, 175, 55, 0.3)' : 'none'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      {displayProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <p>No products found in this category right now.</p>
        </div>
      ) : (
        <div className="products-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(260px, 100%), 1fr))',
          gap: '1.75rem',
          padding: 0
        }}>
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

    </section>
  );
}
