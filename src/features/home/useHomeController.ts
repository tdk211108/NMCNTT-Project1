'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useProductCardActions } from '@/features/catalog/useProductCardActions';
import type { FeaturedProductsResponse } from '@/shared/types';

export function useHomeController() {
  const cardActions = useProductCardActions();

  const featuredQuery = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => apiFetch<FeaturedProductsResponse>('/api/products/featured'),
  });

  return {
    state: {
      cpus: featuredQuery.data?.cpus ?? [],
      gpus: featuredQuery.data?.gpus ?? [],
      isLoading: featuredQuery.isLoading,
      errorMessage: featuredQuery.error?.message ?? null,
    },
    actions: {
      onRetry: () => {
        void featuredQuery.refetch();
      },
      ...cardActions,
    },
  };
}
