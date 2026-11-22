'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useProductCardActions } from '@/features/catalog/useProductCardActions';
import {
  SEARCH_RESULTS_PAGE_SIZE,
  SEARCH_SUGGEST_MAX_LEN,
  SEARCH_SUGGEST_MIN_LEN,
} from '@/shared/constants';
import type { ProductListResponse, ProductSort } from '@/shared/types';

export type SearchTab = 'all' | 'cpu' | 'gpu';

export function useSearchResultsController(rawQuery: string) {
  const query = rawQuery.trim();
  const validQuery =
    query.length >= SEARCH_SUGGEST_MIN_LEN && query.length <= SEARCH_SUGGEST_MAX_LEN;

  const [syncedQuery, setSyncedQuery] = useState(query);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [sort, setSort] = useState<ProductSort>('default');
  const [cpuPage, setCpuPage] = useState(1);
  const [gpuPage, setGpuPage] = useState(1);

  if (query !== syncedQuery) {
    setSyncedQuery(query);
    setActiveTab('all');
    setCpuPage(1);
    setGpuPage(1);
  }

  const cardActions = useProductCardActions();

  const searchQuery = useQuery({
    queryKey: ['search', 'results', query, sort],
    queryFn: async () => {
      const encoded = encodeURIComponent(query);
      const sortSuffix = sort !== 'default' ? `&sort=${encodeURIComponent(sort)}` : '';
      const [cpuRes, gpuRes] = await Promise.all([
        apiFetch<ProductListResponse>(`/api/products?category=cpu&q=${encoded}${sortSuffix}`),
        apiFetch<ProductListResponse>(`/api/products?category=gpu&q=${encoded}${sortSuffix}`),
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
      activeTab,
      sort,
      cpuPage,
      gpuPage,
      pageSize: SEARCH_RESULTS_PAGE_SIZE,
      isLoading: validQuery && searchQuery.isLoading,
      errorMessage: searchQuery.error?.message ?? null,
    },
    actions: {
      ...cardActions,
      onChangeTab: (nextTab: SearchTab) => {
        setActiveTab(nextTab);
        setCpuPage(1);
        setGpuPage(1);
      },
      onChangeSort: (nextSort: ProductSort) => {
        setSort(nextSort);
        setCpuPage(1);
        setGpuPage(1);
      },
      onChangeCpuPage: (nextPage: number) => setCpuPage(nextPage),
      onChangeGpuPage: (nextPage: number) => setGpuPage(nextPage),
    },
  };
}
