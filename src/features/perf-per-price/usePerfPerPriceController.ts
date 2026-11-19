'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import type { Category, ChipVendor, PerfPerPriceResponse } from '@/shared/types';

const VENDORS_BY_CATEGORY: Record<Category, ChipVendor[]> = {
  cpu: ['intel', 'amd'],
  gpu: ['nvidia', 'amd'],
};

interface AppliedPppParams {
  category: Category;
  vendors: ChipVendor[];
  maxPriceVnd?: number;
}

function buildPppUrl(params: AppliedPppParams): string {
  const qs = new URLSearchParams({ category: params.category });
  if (params.vendors.length > 0) {
    qs.set('vendor', params.vendors.join(','));
  }
  if (params.maxPriceVnd !== undefined) {
    qs.set('maxPriceVnd', String(params.maxPriceVnd));
  }
  return `/api/perf-per-price?${qs.toString()}`;
}

export function usePerfPerPriceController(initial: {
  category: Category;
  maxPriceVnd?: string;
}) {
  const initialMax =
    initial.maxPriceVnd && /^\d+$/.test(initial.maxPriceVnd) && Number(initial.maxPriceVnd) > 0
      ? Number(initial.maxPriceVnd)
      : undefined;

  const [draftCategory, setDraftCategory] = useState<Category>(initial.category);
  const [draftVendors, setDraftVendors] = useState<ChipVendor[]>([]);
  const [draftMaxPriceInput, setDraftMaxPriceInput] = useState(
    initialMax ? String(initialMax) : '',
  );
  const [budgetInputError, setBudgetInputError] = useState<string | null>(null);

  const [applied, setApplied] = useState<AppliedPppParams>({
    category: initial.category,
    vendors: [],
    maxPriceVnd: initialMax,
  });

  const rankingQuery = useQuery({
    queryKey: ['perf-per-price', applied],
    queryFn: () => apiFetch<PerfPerPriceResponse>(buildPppUrl(applied)),
  });

  function switchCategory(nextCategory: Category) {
    const allowed = new Set(VENDORS_BY_CATEGORY[nextCategory]);
    const filteredVendors = draftVendors.filter((v) => allowed.has(v));
    setDraftCategory(nextCategory);
    setDraftVendors(filteredVendors);
    setApplied((prev) => ({
      ...prev,
      category: nextCategory,
      vendors: filteredVendors,
    }));
  }

  function toggleVendor(vendor: ChipVendor) {
    const nextVendors = draftVendors.includes(vendor)
      ? draftVendors.filter((v) => v !== vendor)
      : [...draftVendors, vendor];
    setDraftVendors(nextVendors);
    setApplied((prev) => ({ ...prev, vendors: nextVendors }));
  }

  function submitFilter() {
    const trimmed = draftMaxPriceInput.trim();
    if (!trimmed) {
      setBudgetInputError(null);
      setApplied({
        category: draftCategory,
        vendors: draftVendors,
        maxPriceVnd: undefined,
      });
      return;
    }

    if (!/^\d+$/.test(trimmed) || Number(trimmed) <= 0) {
      setBudgetInputError('Ngân sách tối đa phải là số nguyên dương.');
      return;
    }

    setBudgetInputError(null);
    setApplied({
      category: draftCategory,
      vendors: draftVendors,
      maxPriceVnd: Number(trimmed),
    });
  }

  return {
    state: {
      category: draftCategory,
      availableVendors: VENDORS_BY_CATEGORY[draftCategory],
      selectedVendors: draftVendors,
      maxPriceInput: draftMaxPriceInput,
      budgetInputError,
      data: rankingQuery.data ?? null,
      isLoading: rankingQuery.isLoading,
      errorMessage: rankingQuery.error?.message ?? null,
    },
    actions: {
      onChangeCategory: switchCategory,
      onToggleVendor: toggleVendor,
      onChangeMaxPrice: (value: string) => {
        setBudgetInputError(null);
        setDraftMaxPriceInput(value);
      },
      onSubmit: submitFilter,
    },
  };
}
