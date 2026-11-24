'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useCartStore } from '@/features/cart/store';
import { apiFetch } from '@/lib/api-client';
import type { Category, PerfPerPriceResponse } from '@/shared/types';

export function usePerfPerPriceController(initial: { category: Category }) {
  const addItem = useCartStore((s) => s.addItem);
  const [category, setCategory] = useState<Category>(initial.category);

  const rankingQuery = useQuery({
    queryKey: ['perf-per-price', category],
    queryFn: () => apiFetch<PerfPerPriceResponse>(`/api/perf-per-price?category=${category}`),
  });

  return {
    state: {
      category,
      data: rankingQuery.data ?? null,
      isLoading: rankingQuery.isLoading,
      errorMessage: rankingQuery.error?.message ?? null,
    },
    actions: {
      onChangeCategory: (nextCategory: Category) => {
        setCategory(nextCategory);
      },
      onAddToCart: (item: { id: string; name: string; priceVnd: number }) => {
        addItem({
          productId: item.id,
          name: item.name,
          unitPriceVnd: item.priceVnd,
        });
      },
    },
  };
}
