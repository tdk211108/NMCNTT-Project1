'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCartStore } from '@/features/cart/store';
import { apiFetch } from '@/lib/api-client';
import { MAX_PRICE_VND } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type {
  Category,
  ChipVendor,
  UpgradeOptionsResponse,
  UpgradeResponse,
  UpgradeSort,
} from '@/shared/types';

export interface UpgradeInitialParams {
  category?: string;
  current?: string;
  budget?: string;
  sameSocketOnly?: string;
  vendor?: string;
  sort?: string;
}

interface AppliedUpgradeParams {
  category: Category;
  current: string;
  budgetVnd?: number;
  sameSocketOnly: boolean;
  vendors: ChipVendor[];
  sort: UpgradeSort;
}

const VENDORS_BY_CATEGORY: Record<Category, readonly ChipVendor[]> = {
  cpu: ['intel', 'amd'],
  gpu: ['nvidia', 'amd', 'intel'],
};

function parseCategory(raw?: string): Category {
  return raw === 'gpu' ? 'gpu' : 'cpu';
}

function parseSort(raw?: string): UpgradeSort {
  if (
    raw === 'uplift_desc' ||
    raw === 'perf_per_price_desc' ||
    raw === 'price_asc'
  ) {
    return raw;
  }
  return 'recommended';
}

function parseVendors(raw: string | undefined, category: Category): ChipVendor[] {
  if (!raw) return [];
  const allowed = new Set<string>(VENDORS_BY_CATEGORY[category]);
  return raw
    .split(',')
    .map((v) => v.trim())
    .filter((v): v is ChipVendor => allowed.has(v));
}

function parseOptionalBudget(raw: string): { value?: number; valid: boolean } {
  const digits = raw.replace(/[\s.,₫đ]/gi, '').trim();
  if (!digits) return { value: undefined, valid: true };
  if (!/^\d+$/.test(digits)) return { valid: false };
  const num = Number(digits);
  if (!Number.isSafeInteger(num) || num <= 0 || num > MAX_PRICE_VND) {
    return { valid: false };
  }
  return { value: num, valid: true };
}

function buildUpgradeApiUrl(params: AppliedUpgradeParams): string {
  const qs = new URLSearchParams({
    category: params.category,
    current: params.current,
    sort: params.sort,
  });
  if (params.budgetVnd !== undefined) qs.set('budget', String(params.budgetVnd));
  if (params.category === 'cpu' && params.sameSocketOnly) {
    qs.set('sameSocketOnly', 'true');
  }
  if (params.vendors.length > 0) qs.set('vendor', params.vendors.join(','));
  return `/api/tools/upgrade?${qs.toString()}`;
}

function buildUpgradePageUrl(params: {
  category: Category;
  current?: string;
  budgetVnd?: number;
  sameSocketOnly?: boolean;
  vendors?: readonly ChipVendor[];
  sort?: UpgradeSort;
}): string {
  const qs = new URLSearchParams({ category: params.category });
  if (params.current) qs.set('current', params.current);
  if (params.budgetVnd !== undefined) qs.set('budget', String(params.budgetVnd));
  if (params.category === 'cpu' && params.sameSocketOnly) {
    qs.set('sameSocketOnly', 'true');
  }
  if (params.vendors?.length) qs.set('vendor', params.vendors.join(','));
  if (params.sort && params.sort !== 'recommended') qs.set('sort', params.sort);
  return `/tools/upgrade?${qs.toString()}`;
}

export function useUpgradeAdvisorController(initial: UpgradeInitialParams) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const initialCategory = parseCategory(initial.category);
  const initialCurrent = initial.current?.trim() ?? '';
  const initialBudgetCheck = initial.budget
    ? parseOptionalBudget(initial.budget)
    : { value: undefined, valid: true };
  const initialSameSocket = initialCategory === 'cpu' && initial.sameSocketOnly === 'true';
  const initialVendors = parseVendors(initial.vendor, initialCategory);
  const initialSort = parseSort(initial.sort);

  const [category, setCategory] = useState<Category>(initialCategory);
  const [currentId, setCurrentId] = useState(initialCurrent);
  const [budgetInput, setBudgetInput] = useState(
    initialBudgetCheck.value !== undefined ? String(initialBudgetCheck.value) : initial.budget ?? '',
  );
  const [budgetError, setBudgetError] = useState<string | null>(
    initial.budget && !initialBudgetCheck.valid
      ? VI_MESSAGES.tools.upgrade.invalidBudgetError
      : null,
  );
  const [sameSocketOnly, setSameSocketOnly] = useState(initialSameSocket);
  const [selectedVendors, setSelectedVendors] = useState<ChipVendor[]>(initialVendors);
  const [sort, setSort] = useState<UpgradeSort>(initialSort);

  const [applied, setApplied] = useState<AppliedUpgradeParams | null>(
    initialCurrent && initialBudgetCheck.valid
      ? {
          category: initialCategory,
          current: initialCurrent,
          budgetVnd: initialBudgetCheck.value,
          sameSocketOnly: initialSameSocket,
          vendors: initialVendors,
          sort: initialSort,
        }
      : null,
  );

  const optionsQuery = useQuery({
    queryKey: ['upgrade', 'options'],
    queryFn: () => apiFetch<UpgradeOptionsResponse>('/api/tools/upgrade/options'),
  });

  const recommendationQuery = useQuery({
    queryKey: ['upgrade', 'recommendations', applied],
    queryFn: () => apiFetch<UpgradeResponse>(buildUpgradeApiUrl(applied!)),
    enabled: Boolean(applied),
  });

  function commitSearch(overrides: Partial<AppliedUpgradeParams> & { budgetRaw?: string } = {}) {
    const nextCategory = overrides.category ?? category;
    const nextCurrent = overrides.current !== undefined ? overrides.current : currentId;
    const nextSort = overrides.sort ?? sort;
    const nextVendors = overrides.vendors ?? selectedVendors;
    const nextSameSocket =
      overrides.sameSocketOnly !== undefined ? overrides.sameSocketOnly : sameSocketOnly;
    const budgetCheck =
      overrides.budgetVnd !== undefined
        ? { value: overrides.budgetVnd, valid: true }
        : 'budgetVnd' in overrides
          ? { value: undefined, valid: true }
          : parseOptionalBudget(overrides.budgetRaw ?? budgetInput);

    if (!budgetCheck.valid) {
      setBudgetError(VI_MESSAGES.tools.upgrade.invalidBudgetError);
      return;
    }

    setBudgetError(null);
    if (!nextCurrent) {
      setApplied(null);
      router.replace(buildUpgradePageUrl({ category: nextCategory }), { scroll: false });
      return;
    }

    const nextParams: AppliedUpgradeParams = {
      category: nextCategory,
      current: nextCurrent,
      budgetVnd: budgetCheck.value,
      sameSocketOnly: nextCategory === 'cpu' ? nextSameSocket : false,
      vendors: nextVendors,
      sort: nextSort,
    };
    setApplied(nextParams);
    router.replace(buildUpgradePageUrl(nextParams), { scroll: false });
  }

  const allCpus = optionsQuery.data?.cpus ?? [];
  const allGpus = optionsQuery.data?.gpus ?? [];
  const recommendation = recommendationQuery.data ?? null;
  const sameSocketAvailable =
    category === 'cpu' && recommendation ? recommendation.hasSameSocketInCatalog : true;

  return {
    state: {
      category,
      currentId,
      budgetInput,
      budgetError,
      sameSocketOnly,
      sameSocketAvailable,
      availableVendors: VENDORS_BY_CATEGORY[category],
      selectedVendors,
      sort,
      retailCpuOptions: allCpus.filter((o) => o.source === 'store'),
      legacyCpuOptions: allCpus.filter((o) => o.source === 'legacy'),
      retailGpuOptions: allGpus.filter((o) => o.source === 'store'),
      legacyGpuOptions: allGpus.filter((o) => o.source === 'legacy'),
      isLoadingOptions: optionsQuery.isLoading,
      optionsErrorMessage: optionsQuery.error?.message ?? null,
      isLoadingRecommendations: recommendationQuery.isLoading,
      errorMessage: recommendationQuery.error?.message ?? null,
      data: recommendation,
    },
    actions: {
      onRetryOptions: () => {
        void optionsQuery.refetch();
      },
      onChangeCategory: (nextCategory: Category) => {
        if (nextCategory === category) return;
        setCategory(nextCategory);
        setCurrentId('');
        setBudgetInput('');
        setBudgetError(null);
        setSameSocketOnly(false);
        setSelectedVendors([]);
        setSort('recommended');
        setApplied(null);
        router.replace(buildUpgradePageUrl({ category: nextCategory }), { scroll: false });
      },
      onSelectCurrent: (nextId: string) => {
        setCurrentId(nextId);
        commitSearch({ current: nextId, sameSocketOnly: false });
        setSameSocketOnly(false);
      },
      onChangeBudgetInput: (value: string) => {
        setBudgetError(null);
        setBudgetInput(value);
      },
      onSelectBudgetPreset: (amountVnd: number) => {
        setBudgetInput(String(amountVnd));
        setBudgetError(null);
        if (currentId) {
          commitSearch({ budgetVnd: amountVnd });
        }
      },
      onClearBudget: () => {
        setBudgetInput('');
        setBudgetError(null);
        commitSearch({ budgetVnd: undefined, budgetRaw: '' });
      },
      onToggleSameSocket: () => {
        const nextVal = !sameSocketOnly;
        setSameSocketOnly(nextVal);
        if (currentId) {
          commitSearch({ sameSocketOnly: nextVal });
        }
      },
      onToggleVendor: (vendor: ChipVendor) => {
        const next = selectedVendors.includes(vendor)
          ? selectedVendors.filter((v) => v !== vendor)
          : [...selectedVendors, vendor];
        setSelectedVendors(next);
        if (currentId) {
          commitSearch({ vendors: next });
        }
      },
      onChangeSort: (nextSort: UpgradeSort) => {
        setSort(nextSort);
        if (currentId) {
          commitSearch({ sort: nextSort });
        }
      },
      onSubmit: () => {
        commitSearch();
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
