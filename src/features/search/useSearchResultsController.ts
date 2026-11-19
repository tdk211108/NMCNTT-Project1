'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useProductCardActions } from '@/features/catalog/useProductCardActions';
import { SEARCH_SUGGEST_MAX_LEN, SEARCH_SUGGEST_MIN_LEN } from '@/shared/constants';
import type { ProductListResponse } from '@/shared/types';

export function useSearchResultsController(rawQuery: string) {
  const query = rawQuery.trim();
  const validQuery =
    query.length >= SEARCH_SUGGEST_MIN_LEN && query.length <= SEARCH_SUGGEST_MAX_LEN;

  const cardActions = useProductCardActions();

  const searchQuery = useQuery({
    queryKey: ['search', 'results', query],
    queryFn: async () => {
      const encoded = encodeURIComponent(query);
      const [cpuRes, gpuRes] = await Promise.all([
        apiFetch<ProductListResponse>(`/api/products?category=cpu&q=${encoded}`),
        apiFetch<ProductListResponse>(`/api/products?category=gpu&q=${encoded}`),
      ]);
      return {
        cpus: cpuRes.items,
        gpus: gpuRes.items,
      };
    },
    enabled: validQuery,
  });

  const cpus = validQuery ? (searchQuery.data?.cpus ?? []) : [];
  const gpus = validQuery ? (searchQuery.data?.gpus ?? []) : [];

  return {
    state: {
      query,
      validQuery,
      cpus,
      gpus,
      total: cpus.length + gpus.length,
      isLoading: validQuery && searchQuery.isLoading,
      errorMessage: searchQuery.error?.message ?? null,
    },
    actions: cardActions,
  };
}
