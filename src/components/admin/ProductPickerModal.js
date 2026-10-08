'use client';
import { useState } from 'react';
import { formatPrice } from '@/lib/utils';

export default function ProductPickerModal({ products = [], categories = [], isOpen, onClose, onInsert, channel = 'email' }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  if (!isOpen) return null;

  const filteredProducts = products.filter(p => {
    const matchesSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.deity_category?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = !selectedCategory || String(p.category_id) === String(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const toggleProduct = (id) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleConfirmInsert = () => {
    const selected = products.filter(p => selectedProductIds.includes(p.id));
    if (selected.length === 0) {
      alert('Please select at least one product.');
      return;
    }

    if (channel === 'email') {
      // Generate luxury HTML product grid cards
      const cardsHtml = `
<div style="margin: 28px 0;">
  <div style="display: table; width: 100%; border-spacing: 12px 16px; margin: 0 auto;">
    ${selected.map(p => {
      const img = p.product_images?.[0]?.image_path || p.images?.[0] || '/uploads/ganesha-gold-1.jpg';
      const prodUrl = `https://anantarts.in/shop/${p.slug || p.id}`;
      const priceHtml = p.discount_price && p.discount_price < p.price
        ? `<span style="color: #AA7C11; font-weight: 700; font-size: 15px;">₹${Number(p.discount_price).toLocaleString('en-IN')}</span> <span style="text-decoration: line-through; color: #999999; font-size: 12px; margin-left: 6px;">₹${Number(p.price).toLocaleString('en-IN')}</span>`
        : `<span style="color: #1E1A17; font-weight: 700; font-size: 15px;">₹${Number(p.price).toLocaleString('en-IN')}</span>`;

      return `
    <div style="background: #FFFFFF; border: 1px solid #EAE3D2; border-radius: 8px; overflow: hidden; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="120" style="padding: 12px; vertical-align: middle; text-align: center; background: #FAF9F6;">
            <a href="${prodUrl}" target="_blank">
              <img src="${img.startsWith('http') ? img : 'https://anantarts.in' + img}" alt="${p.name}" width="100" style="width: 100px; max-height: 100px; object-fit: contain; border-radius: 4px; display: block; margin: 0 auto;" />
            </a>
          </td>
          <td style="padding: 16px; vertical-align: middle;">
            <h4 style="margin: 0 0 6px 0; font-size: 14.5px; color: #1E1A17; font-family: 'Playfair Display', Georgia, serif;">
              <a href="${prodUrl}" style="color: #1E1A17; text-decoration: none;">${p.name}</a>
            </h4>
            <div style="margin-bottom: 10px;">${priceHtml}</div>
            <a href="${prodUrl}" target="_blank" style="display: inline-block; background: #1E1A17; color: #D4AF37; padding: 6px 14px; border-radius: 4px; font-size: 11px; font-weight: 600; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #D4AF37;">
              View Sacred Idol &rarr;
            </a>
          </td>
        </tr>
      </table>
    </div>`;
    }).join('\n')}
  </div>
</div>`;
      onInsert(cardsHtml);
    } else {
      // Generate formatted WhatsApp text blocks
      const waText = selected.map(p => {
        const prodUrl = `https://anantarts.in/shop/${p.slug || p.id}`;
        const priceStr = p.discount_price && p.discount_price < p.price
          ? `₹${Number(p.discount_price).toLocaleString('en-IN')} (Regular: ₹${Number(p.price).toLocaleString('en-IN')})`
          : `₹${Number(p.price).toLocaleString('en-IN')}`;

        return `✨ *${p.name}*\n🏷️ Price: ${priceStr}\n🔗 Explore: ${prodUrl}`;
      }).join('\n\n');

      onInsert(waText);
    }

    setSelectedProductIds([]);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '750px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        border: '1px solid rgba(212,175,55,0.4)',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(180deg, #111 0%, #1A1918 100%)',
          color: '#FFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #D4AF37'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem', color: '#D4AF37' }}>🛍</span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontFamily: "'Playfair Display', serif", color: '#D4AF37' }}>
              Select Products for {channel === 'email' ? 'Email Card Insertion' : 'WhatsApp Message'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#AAA', fontSize: '1.2rem', cursor: 'pointer' }}>
            &times;
          </button>
        </div>

        {/* Filters */}
        <div style={{ padding: '14px 20px', background: '#FAF9F6', borderBottom: '1px solid #EEE', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by product name, SKU, deity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: '220px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #D4AF37',
              fontSize: '0.82rem'
            }}
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #CCC',
              fontSize: '0.82rem'
            }}
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Products List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {filteredProducts.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', margin: '40px 0', fontSize: '0.85rem' }}>
              No products found matching your search.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
              {filteredProducts.map(p => {
                const isSelected = selectedProductIds.includes(p.id);
                const img = p.product_images?.[0]?.image_path || p.images?.[0] || '/uploads/ganesha-gold-1.jpg';

                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    style={{
                      border: `2px solid ${isSelected ? '#D4AF37' : '#EAEAEA'}`,
                      borderRadius: '8px',
                      padding: '12px',
                      background: isSelected ? '#FFFDF5' : '#FFF',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 4px 12px rgba(212,175,55,0.2)' : 'none'
                    }}
                  >
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: '#2E7D32',
                        color: 'white',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: '700'
                      }}>
                        ✓
                      </div>
                    )}
                    <img
                      src={img}
                      alt={p.name}
                      style={{
                        width: '100%',
                        height: '110px',
                        objectFit: 'contain',
                        borderRadius: '4px',
                        marginBottom: '8px',
                        background: '#FAF9F6'
                      }}
                    />
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: '#111', lineHeight: '1.3', flex: 1 }}>
                      {p.name}
                    </h4>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#AA7C11' }}>
                      {formatPrice(p.discount_price || p.price)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          background: '#FAF9F6',
          borderTop: '1px solid #EEE',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: '600' }}>
            {selectedProductIds.length} {selectedProductIds.length === 1 ? 'product' : 'products'} selected
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #CCC',
                background: '#FFF',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmInsert}
              disabled={selectedProductIds.length === 0}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                border: 'none',
                background: selectedProductIds.length > 0 ? 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)' : '#CCC',
                color: '#111',
                fontSize: '0.8rem',
                fontWeight: '700',
                cursor: selectedProductIds.length > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              Insert into Campaign
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
