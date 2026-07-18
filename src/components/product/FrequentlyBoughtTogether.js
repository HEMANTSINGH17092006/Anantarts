'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useCart } from '../context/AppContext';
import { formatPrice } from '@/lib/utils';

export default function FrequentlyBoughtTogether({ currentProduct, bundleProduct }) {
  const { addToCart } = useCart();
  const [selectCurrent, setSelectCurrent] = useState(true);
  const [selectBundle, setSelectBundle] = useState(true);
  const [adding, setAdding] = useState(false);

  if (!bundleProduct) return null;

  const currentPrice = currentProduct.discount_price > 0 ? currentProduct.discount_price : currentProduct.price;
  const bundlePrice = bundleProduct.discount_price > 0 ? bundleProduct.discount_price : bundleProduct.price;

  let total = 0;
  if (selectCurrent) total += currentPrice;
  if (selectBundle) total += bundlePrice;

  const handleAddBundle = () => {
    setAdding(true);
    if (selectCurrent) {
      addToCart({
        id: currentProduct.id,
        name: currentProduct.name,
        slug: currentProduct.slug,
        price: currentProduct.price,
        discount_price: currentProduct.discount_price,
        image_path: currentProduct.images?.[0]?.image_path || currentProduct.image_path || '/images/placeholder.jpg'
      }, 1);
    }
    if (selectBundle) {
      addToCart({
        id: bundleProduct.id,
        name: bundleProduct.name,
        slug: bundleProduct.slug,
        price: bundleProduct.price,
        discount_price: bundleProduct.discount_price,
        image_path: bundleProduct.image_path || '/images/placeholder.jpg'
      }, 1);
    }
    setTimeout(() => setAdding(false), 1000);
  };

  return (
    <div style={{
      marginTop: '3.5rem',
      background: 'white',
      border: '1px solid var(--primary-gold-border)',
      borderRadius: '8px',
      padding: '24px',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '16px', color: 'var(--text-dark)' }}>
        Frequently Bought Together
      </h3>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        {/* Item 1 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '80px', height: '80px', position: 'relative', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--primary-gold-border)' }}>
            <Image 
              src={currentProduct.images?.[0]?.image_path || currentProduct.image_path || '/images/placeholder.jpg'} 
              alt={currentProduct.name} 
              fill 
              sizes="80px"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div style={{ maxWidth: '160px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={selectCurrent} 
                onChange={(e) => setSelectCurrent(e.target.checked)} 
                style={{ accentColor: 'var(--primary-gold)' }}
              />
              This Item
            </label>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentProduct.name}
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--primary-gold)' }}>
              {formatPrice(currentPrice)}
            </span>
          </div>
        </div>

        {/* Plus Sign */}
        <div style={{ fontSize: '1.5rem', color: 'var(--primary-gold)' }}>+</div>

        {/* Item 2 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '80px', height: '80px', position: 'relative', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--primary-gold-border)' }}>
            <Image 
              src={bundleProduct.image_path || '/images/placeholder.jpg'} 
              alt={bundleProduct.name} 
              fill 
              sizes="80px"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div style={{ maxWidth: '160px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={selectBundle} 
                onChange={(e) => setSelectBundle(e.target.checked)} 
                style={{ accentColor: 'var(--primary-gold)' }}
              />
              {bundleProduct.name.slice(0, 15)}...
            </label>
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--primary-gold)', display: 'block', marginTop: '2px' }}>
              {formatPrice(bundlePrice)}
            </span>
          </div>
        </div>

        {/* Total & Action */}
        <div style={{ marginLeft: 'auto', borderLeft: '1px solid var(--primary-gold-border)', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Bundle Price:</span>
            <span style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--text-dark)' }}>{formatPrice(total)}</span>
          </div>
          <button
            onClick={handleAddBundle}
            className="btn-gold"
            disabled={adding || (!selectCurrent && !selectBundle)}
            style={{ padding: '8px 16px', fontSize: '0.8rem', justifyContent: 'center' }}
          >
            {adding ? 'Adding Bundle...' : 'Add Selected to Bag'}
          </button>
        </div>
      </div>
    </div>
  );
}
