'use client';

import { useEffect, useRef } from 'react';
import { trackPurchase } from '@/lib/meta-pixel';

/**
 * Fires Meta Pixel 'Purchase' event when an order is viewed, IF AND ONLY IF:
 * 1. payment_status is 'Paid' or 'Captured'
 * 2. The order has not already been tracked (deduplicated via localStorage)
 */
export default function MetaOrderPurchaseTracker({ order }) {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (order && !trackedRef.current) {
      trackedRef.current = true;
      trackPurchase(order);
    }
  }, [order]);

  return null;
}
