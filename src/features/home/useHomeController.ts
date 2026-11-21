'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { FeaturedProductsResponse } from '@/shared/types';

export function useHomeController() {
  const featuredQuery = useQuery({
    queryKey: ['products', 'featured', 'landing'],
    queryFn: () => apiFetch<FeaturedProductsResponse>('/api/products/featured?preset=landing'),
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
    },
  };
}
