'use client';

import { useEffect, useRef } from 'react';
import { trackViewContent } from '@/lib/meta-pixel';

/**
 * Fires Meta Pixel 'ViewContent' event once when a product page loads.
 */
export default function MetaViewContent({ product }) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (product && !trackedRef.current) {
      trackedRef.current = true;
      trackViewContent(product);
    }
  }, [product]);

  return null;
}
