'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import type {
  Category,
  ChipVendor,
  ProductCard as ProductCardDto,
  ProductListResponse,
  ProductSort,
} from '@/shared/types';
import { useProductCardActions } from './useProductCardActions';

function toggleItem<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function buildProductsUrl(
  category: Category,
  filters: {
    vendors: ChipVendor[];
    priceMinInput: string;
    priceMaxInput: string;
    vramGb: number[];
    aibBrands: string[];
    sockets: string[];
    limitedOnly: boolean;
    sort: ProductSort;
  },
): string {
  const params = new URLSearchParams({ category });
  if (filters.vendors.length > 0) params.set('vendor', filters.vendors.join(','));

  const minVal = filters.priceMinInput.trim();
  const maxVal = filters.priceMaxInput.trim();
  const parsedMin = minVal && /^\d+$/.test(minVal) ? Number(minVal) : undefined;
  const parsedMax = maxVal && /^\d+$/.test(maxVal) ? Number(maxVal) : undefined;

  if (parsedMin !== undefined && (parsedMax === undefined || parsedMin <= parsedMax)) {
    params.set('priceMin', String(parsedMin));
  }
  if (parsedMax !== undefined && parsedMax > 0 && (parsedMin === undefined || parsedMin <= parsedMax)) {
    params.set('priceMax', String(parsedMax));
  }
  if (category === 'gpu' && filters.vramGb.length > 0) {
    params.set('vramGb', filters.vramGb.join(','));
  }
  if (category === 'gpu' && filters.aibBrands.length > 0) {
    params.set('aibBrand', filters.aibBrands.join(','));
  }
  if (category === 'gpu' && filters.limitedOnly) {
    params.set('limitedEdition', 'true');
  }
  if (category === 'cpu' && filters.sockets.length > 0) {
    params.set('socket', filters.sockets.join(','));
  }
  if (filters.sort !== 'default') {
    params.set('sort', filters.sort);
  }
  return `/api/products?${params.toString()}`;
}

export function groupProductsByVendor(
  items: readonly ProductCardDto[],
): Array<{ vendor: ChipVendor; items: ProductCardDto[] }> {
  const grouped = new Map<ChipVendor, ProductCardDto[]>();
  for (const item of items) {
    const existing = grouped.get(item.vendor);
    if (existing) {
      existing.push(item);
    } else {
      grouped.set(item.vendor, [item]);
    }
  }
  return [...grouped.entries()].map(([vendor, groupItems]) => ({ vendor, items: groupItems }));
}

export function useCatalogController(category: Category) {
  const [vendors, setVendors] = useState<ChipVendor[]>([]);
  const [priceMinInput, setPriceMinInput] = useState('');
  const [priceMaxInput, setPriceMaxInput] = useState('');
  const [vramGb, setVramGb] = useState<number[]>([]);
  const [aibBrands, setAibBrands] = useState<string[]>([]);
  const [sockets, setSockets] = useState<string[]>([]);
  const [limitedOnly, setLimitedOnly] = useState(false);
  const [sort, setSort] = useState<ProductSort>('default');

  const cardActions = useProductCardActions();

  const queryUrl = buildProductsUrl(category, {
    vendors,
    priceMinInput,
    priceMaxInput,
    vramGb,
    aibBrands,
    sockets,
    limitedOnly,
    sort,
  });

  const listQuery = useQuery({
    queryKey: ['products', 'list', queryUrl],
    queryFn: () => apiFetch<ProductListResponse>(queryUrl),
  });

  const items = listQuery.data?.items ?? [];
  const groupedByVendor = sort === 'default' ? groupProductsByVendor(items) : null;

  return {
    state: {
      category,
      items,
      groupedByVendor,
      total: listQuery.data?.total ?? 0,
      facets: listQuery.data?.facets ?? { vendors: [], priceRange: null },
      selectedVendors: vendors,
      priceMinInput,
      priceMaxInput,
      selectedVramGb: vramGb,
      selectedAibBrands: aibBrands,
      selectedSockets: sockets,
      limitedOnly,
      sort,
      isLoading: listQuery.isLoading,
      errorMessage: listQuery.error?.message ?? null,
    },
    actions: {
      onToggleVendor: (v: ChipVendor) => setVendors((prev) => toggleItem(prev, v)),
      onChangePriceMin: setPriceMinInput,
      onChangePriceMax: setPriceMaxInput,
      onToggleVram: (gb: number) => setVramGb((prev) => toggleItem(prev, gb)),
      onToggleAibBrand: (brand: string) => setAibBrands((prev) => toggleItem(prev, brand)),
      onToggleSocket: (socket: string) => setSockets((prev) => toggleItem(prev, socket)),
      onChangeLimitedOnly: setLimitedOnly,
      onChangeSort: setSort,
      onClearFilters: () => {
        setVendors([]);
        setPriceMinInput('');
        setPriceMaxInput('');
        setVramGb([]);
        setAibBrands([]);
        setSockets([]);
        setSort('default');
      },
      ...cardActions,
    },
  };
}
