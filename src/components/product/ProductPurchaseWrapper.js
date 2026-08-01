'use client';
import { useState, useEffect, useRef } from 'react';
import AddToCartButton from './AddToCartButton';
import StickyPurchaseBar from './StickyPurchaseBar';
import { useCart } from '../context/AppContext';
import { useRouter } from 'next/navigation';

export default function ProductPurchaseWrapper({ product }) {
  const [stickyVisible, setStickyVisible] = useState(false);
  const containerRef = useRef(null);
  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when main buy button scrolls out of view
        setStickyVisible(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const handleAddToCart = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    addToCart(product, 1);
  };

  const handleBuyNow = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    addToCart(product, 1);
    router.push('/checkout');
  };

  return (
    <>
      <div ref={containerRef}>
        <AddToCartButton product={product} />
      </div>

      <StickyPurchaseBar
        product={product}
        visible={stickyVisible}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />
    </>
  );
}
