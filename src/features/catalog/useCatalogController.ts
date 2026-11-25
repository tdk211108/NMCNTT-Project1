'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { CPU_PER_BRAND_PAGE_SIZE, GPU_PAGE_SIZE } from '@/shared/constants';
import type {
  Category,
  ChipVendor,
  ProductCard as ProductCardDto,
  ProductListResponse,
  ProductSort,
} from '@/shared/types';
import { useProductCardActions } from './useProductCardActions';

export const CATALOG_PRICE_SLIDER_MIN = 5_000_000;
export const CATALOG_PRICE_SLIDER_MAX = 300_000_000;
export const CATALOG_PRICE_SLIDER_STEP = 1_000_000;

export interface PriceSliderBounds {
  minValue: number;
  maxValue: number;
  minPct: number;
  maxPct: number;
}

function parsePriceDigits(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Clamp visual slider thumb bounds strictly inside [5tr, 300tr] without distorting raw text inputs. */
export function clampPriceSliderBounds(rawMinInput: string, rawMaxInput: string): PriceSliderBounds {
  const parsedMin = parsePriceDigits(rawMinInput);
  const parsedMax = parsePriceDigits(rawMaxInput);

  const rawMax = parsedMax ?? CATALOG_PRICE_SLIDER_MAX;
  const rawMin = parsedMin ?? CATALOG_PRICE_SLIDER_MIN;

  const maxValue = Math.min(
    CATALOG_PRICE_SLIDER_MAX,
    Math.max(CATALOG_PRICE_SLIDER_MIN + CATALOG_PRICE_SLIDER_STEP, rawMax),
  );
  const minValue = Math.max(
    CATALOG_PRICE_SLIDER_MIN,
    Math.min(maxValue - CATALOG_PRICE_SLIDER_STEP, rawMin),
  );

  const span = CATALOG_PRICE_SLIDER_MAX - CATALOG_PRICE_SLIDER_MIN;
  const minPct = ((minValue - CATALOG_PRICE_SLIDER_MIN) / span) * 100;
  const maxPct = ((maxValue - CATALOG_PRICE_SLIDER_MIN) / span) * 100;

  return { minValue, maxValue, minPct, maxPct };
}

function toggleItem<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function buildFilterParams(
  category: Category,
  filters: {
    vendors: ChipVendor[];
    priceMinInput: string;
    priceMaxInput: string;
    vramGb: number[];
    aibBrands: string[];
    sockets: string[];
    seriesId: string;
    limitedOnly: boolean;
    sort: ProductSort;
  },
): URLSearchParams {
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
  if (category === 'gpu' && filters.seriesId.trim()) {
    params.set('seriesId', filters.seriesId.trim());
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
  return params;
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

export function useCatalogController(category: Category, initialSeriesId = '') {
  const [vendors, setVendors] = useState<ChipVendor[]>([]);
  const [priceMinInput, setPriceMinInput] = useState('');
  const [priceMaxInput, setPriceMaxInput] = useState('');
  const [debouncedPriceMin, setDebouncedPriceMin] = useState('');
  const [debouncedPriceMax, setDebouncedPriceMax] = useState('');
  const [vramGb, setVramGb] = useState<number[]>([]);
  const [aibBrands, setAibBrands] = useState<string[]>([]);
  const [sockets, setSockets] = useState<string[]>([]);
  const [seriesId, setSeriesId] = useState(category === 'gpu' ? initialSeriesId.trim() : '');
  const [limitedOnly, setLimitedOnly] = useState(false);
  const [sort, setSort] = useState<ProductSort>('default');

  const cardActions = useProductCardActions();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPriceMin(priceMinInput);
      setDebouncedPriceMax(priceMaxInput);
    }, 150);
    return () => clearTimeout(timer);
  }, [priceMinInput, priceMaxInput]);

  const filterParams = buildFilterParams(category, {
    vendors,
    priceMinInput: debouncedPriceMin,
    priceMaxInput: debouncedPriceMax,
    vramGb,
    aibBrands,
    sockets,
    seriesId,
    limitedOnly,
    sort,
  });
  const filterKey = filterParams.toString();

  const [paginationState, setPaginationState] = useState<{
    queryKey: string;
    pageByVendor: Record<string, number>;
    flatPage: number;
  }>({
    queryKey: filterKey,
    pageByVendor: {},
    flatPage: 1,
  });

  const activePageByVendor =
    paginationState.queryKey === filterKey ? paginationState.pageByVendor : {};
  const activeFlatPage = paginationState.queryKey === filterKey ? paginationState.flatPage : 1;
  const pageSize = category === 'cpu' ? CPU_PER_BRAND_PAGE_SIZE : GPU_PAGE_SIZE;
  const isPerVendorMode = category === 'cpu' && sort === 'default';

  const requestParams = new URLSearchParams(filterParams);
  if (isPerVendorMode) {
    requestParams.set('perVendor', 'true');
    requestParams.set('pageSize', String(pageSize));
    const vendorPageToken = Object.entries(activePageByVendor)
      .filter(([, p]) => p > 1)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([v, p]) => `${v}:${p}`)
      .join(',');
    if (vendorPageToken) {
      requestParams.set('vendorPage', vendorPageToken);
    }
  } else {
    requestParams.set('page', String(activeFlatPage));
    requestParams.set('pageSize', String(pageSize));
  }
  const queryUrl = `/api/products?${requestParams.toString()}`;

  const listQuery = useQuery({
    queryKey: ['products', 'list', queryUrl],
    queryFn: () => apiFetch<ProductListResponse>(queryUrl),
    placeholderData: keepPreviousData,
  });

  const items = listQuery.data?.items ?? [];
  const groupedByVendor = sort === 'default' ? groupProductsByVendor(items) : null;
  const sliderBounds = clampPriceSliderBounds(priceMinInput, priceMaxInput);

  return {
    state: {
      category,
      items,
      groupedByVendor,
      total: listQuery.data?.total ?? 0,
      vendorTotals: listQuery.data?.vendorTotals ?? {},
      serverPaginated: true,
      pageSize,
      pageByVendor: activePageByVendor,
      flatPage: listQuery.data?.pagination?.page ?? activeFlatPage,
      facets: listQuery.data?.facets ?? { vendors: [], priceRange: null },
      selectedVendors: vendors,
      priceMinInput,
      priceMaxInput,
      priceSlider: {
        min: CATALOG_PRICE_SLIDER_MIN,
        max: CATALOG_PRICE_SLIDER_MAX,
        step: CATALOG_PRICE_SLIDER_STEP,
        ...sliderBounds,
      },
      selectedVramGb: vramGb,
      selectedAibBrands: aibBrands,
      selectedSockets: sockets,
      activeSeriesId: seriesId || null,
      limitedOnly,
      sort,
      isLoading: listQuery.isLoading,
      isFetching: listQuery.isFetching,
      errorMessage: listQuery.error?.message ?? null,
    },
    actions: {
      onToggleVendor: (v: ChipVendor) => setVendors((prev) => toggleItem(prev, v)),
      onChangePriceMin: setPriceMinInput,
      onChangePriceMax: setPriceMaxInput,
      onSlidePriceMin: (value: number) => {
        const clamped = Math.max(
          CATALOG_PRICE_SLIDER_MIN,
          Math.min(sliderBounds.maxValue - CATALOG_PRICE_SLIDER_STEP, Math.round(value)),
        );
        setPriceMinInput(String(clamped));
      },
      onSlidePriceMax: (value: number) => {
        const clamped = Math.min(
          CATALOG_PRICE_SLIDER_MAX,
          Math.max(sliderBounds.minValue + CATALOG_PRICE_SLIDER_STEP, Math.round(value)),
        );
        setPriceMaxInput(String(clamped));
      },
      onToggleVram: (gb: number) => setVramGb((prev) => toggleItem(prev, gb)),
      onToggleAibBrand: (brand: string) => setAibBrands((prev) => toggleItem(prev, brand)),
      onToggleSocket: (socket: string) => setSockets((prev) => toggleItem(prev, socket)),
      onChangeLimitedOnly: setLimitedOnly,
      onChangeSort: setSort,
      onChangeVendorPage: (vendor: string, nextPage: number) =>
        setPaginationState((prev) => ({
          queryKey: filterKey,
          pageByVendor: {
            ...(prev.queryKey === filterKey ? prev.pageByVendor : {}),
            [vendor]: nextPage,
          },
          flatPage: prev.queryKey === filterKey ? prev.flatPage : 1,
        })),
      onChangeFlatPage: (nextPage: number) =>
        setPaginationState((prev) => ({
          queryKey: filterKey,
          pageByVendor: prev.queryKey === filterKey ? prev.pageByVendor : {},
          flatPage: nextPage,
        })),
      onClearFilters: () => {
        setVendors([]);
        setPriceMinInput('');
        setPriceMaxInput('');
        setDebouncedPriceMin('');
        setDebouncedPriceMax('');
        setVramGb([]);
        setAibBrands([]);
        setSockets([]);
        setSeriesId('');
        setSort('default');
        setPaginationState({ queryKey: filterKey, pageByVendor: {}, flatPage: 1 });
      },
      ...cardActions,
    },
  };
}
