'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiClientError, apiFetch } from '@/lib/api-client';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type {
  Category,
  CompareInvalidReason,
  CompareResponse,
  ProductCard,
  ProductListResponse,
} from '@/shared/types';

export type CompareSlots = [string | null, string | null, string | null];

function parseRawTokens(rawIds: string): string[] {
  return rawIds
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}

function parseCompareSlots(rawIds: string): {
  slots: CompareSlots;
  showThird: boolean;
} {
  const unique: string[] = [];
  for (const token of parseRawTokens(rawIds)) {
    if (!unique.includes(token)) {
      unique.push(token);
    }
    if (unique.length >= 3) break;
  }
  return {
    slots: [unique[0] ?? null, unique[1] ?? null, unique[2] ?? null],
    showThird: unique.length >= 3,
  };
}

function buildCompareIdsParam(slots: CompareSlots): string {
  return slots.filter((id): id is string => Boolean(id)).join(',');
}

function resolveCompareErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError && error.code === 'COMPARE_INVALID') {
    const reason = error.details?.reason as CompareInvalidReason | undefined;
    if (reason && reason in VI_MESSAGES.tools.compare.errorReasons) {
      return VI_MESSAGES.tools.compare.errorReasons[reason];
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return VI_MESSAGES.common.unexpectedError;
}

export function useComparePageController(rawIds: string) {
  const router = useRouter();
  const [syncedRawIds, setSyncedRawIds] = useState(rawIds);
  const initialParsed = parseCompareSlots(rawIds);
  const [slots, setSlots] = useState<CompareSlots>(initialParsed.slots);
  const [showThirdColumn, setShowThirdColumn] = useState(initialParsed.showThird);

  if (rawIds !== syncedRawIds) {
    const nextParsed = parseCompareSlots(rawIds);
    setSyncedRawIds(rawIds);
    setSlots(nextParsed.slots);
    setShowThirdColumn(nextParsed.showThird);
  }

  const catalogQuery = useQuery({
    queryKey: ['compare', 'catalog'],
    queryFn: async () => {
      const [cpuRes, gpuRes] = await Promise.all([
        apiFetch<ProductListResponse>('/api/products?category=cpu'),
        apiFetch<ProductListResponse>('/api/products?category=gpu'),
      ]);
      return {
        cpus: cpuRes.items,
        gpus: gpuRes.items,
      };
    },
  });

  const cpus = catalogQuery.data?.cpus ?? [];
  const gpus = catalogQuery.data?.gpus ?? [];
  const productById = new Map<string, ProductCard>();
  for (const item of cpus) productById.set(item.id, item);
  for (const item of gpus) productById.set(item.id, item);

  const rawTokens = parseRawTokens(rawIds);
  const selectedIds = slots.filter((id): id is string => Boolean(id));
  const selectedCategories = new Set<Category>();
  for (const id of selectedIds) {
    const cat = productById.get(id)?.category;
    if (cat) selectedCategories.add(cat);
  }
  const lockedCategory: Category | null =
    selectedCategories.size === 1 ? ([...selectedCategories][0] ?? null) : null;

  const shouldCallCompareApi = rawTokens.length >= 2;
  const compareQuery = useQuery({
    queryKey: ['compare', 'table', rawIds],
    queryFn: () =>
      apiFetch<CompareResponse>(`/api/compare?ids=${encodeURIComponent(rawIds)}`),
    enabled: shouldCallCompareApi,
    retry: false,
  });

  const singleMissingFromUrl =
    rawTokens.length === 1 &&
    catalogQuery.isSuccess &&
    !productById.has(rawTokens[0]);

  const compareErrorMessage = singleMissingFromUrl
    ? VI_MESSAGES.tools.compare.errorReasons.NOT_FOUND
    : shouldCallCompareApi && compareQuery.isError
      ? resolveCompareErrorMessage(compareQuery.error)
      : null;

  function applySlots(nextSlots: CompareSlots, nextShowThird: boolean) {
    const nextParam = buildCompareIdsParam(nextSlots);
    setSlots(nextSlots);
    setShowThirdColumn(nextShowThird);
    setSyncedRawIds(nextParam);
    router.replace(
      nextParam ? `/compare?ids=${nextParam.split(',').map(encodeURIComponent).join(',')}` : '/compare',
      { scroll: false },
    );
  }

  return {
    state: {
      slots,
      showThirdColumn,
      lockedCategory,
      cpus,
      gpus,
      isLoadingCatalog: catalogQuery.isLoading,
      catalogErrorMessage: catalogQuery.error?.message ?? null,
      data: shouldCallCompareApi && !compareQuery.isError ? (compareQuery.data ?? null) : null,
      isLoadingCompare: shouldCallCompareApi && compareQuery.isLoading,
      compareErrorMessage,
    },
    actions: {
      onRetryCatalog: () => {
        void catalogQuery.refetch();
      },
      onSelectSlot: (slotIndex: 0 | 1 | 2, productId: string) => {
        const nextValue = productId.trim() || null;
        const nextSlots: CompareSlots = [...slots] as CompareSlots;
        nextSlots[slotIndex] = nextValue;
        applySlots(nextSlots, showThirdColumn || slotIndex === 2);
      },
      onClearSlot: (slotIndex: 0 | 1 | 2) => {
        const nextSlots: CompareSlots = [...slots] as CompareSlots;
        nextSlots[slotIndex] = null;
        const nextShowThird = slotIndex === 2 ? false : showThirdColumn;
        applySlots(nextSlots, nextShowThird);
      },
      onAddColumn: () => {
        setShowThirdColumn(true);
      },
      onClearAll: () => {
        applySlots([null, null, null], false);
      },
    },
  };
}
