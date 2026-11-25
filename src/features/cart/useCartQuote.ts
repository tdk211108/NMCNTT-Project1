'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiFetch } from '@/lib/api-client';
import type { CartQuote } from '@/shared/types';
import { useCartStore } from './store';

/** Queries `/api/cart/quote` for the current cart and syncs normalized line prices back into the store. */
export function useCartQuote(
  queryScope: 'cart' | 'checkout',
  options?: { requireItems?: boolean },
) {
  const items = useCartStore((s) => s.items);
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const applyServerQuote = useCartStore((s) => s.applyServerQuote);

  const quotePayload = items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    knownUnitPriceVnd: item.lastKnownUnitPriceVnd,
  }));

  const enabled = hasHydrated && (!options?.requireItems || items.length > 0);

  const quoteQuery = useQuery({
    queryKey: [queryScope, 'quote', quotePayload],
    queryFn: () =>
      apiFetch<CartQuote>('/api/cart/quote', {
        method: 'POST',
        json: { items: quotePayload },
      }),
    enabled,
    staleTime: 0,
  });

  useEffect(() => {
    if (quoteQuery.data) {
      applyServerQuote(quoteQuery.data);
    }
  }, [quoteQuery.data, applyServerQuote]);

  return {
    items,
    hasHydrated,
    quoteQuery,
    quote: quoteQuery.data ?? null,
  };
}
