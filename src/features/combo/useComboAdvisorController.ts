'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCartStore } from '@/features/cart/store';
import { apiFetch } from '@/lib/api-client';
import { COMBO_MAX_BUDGET_VND, COMBO_MIN_BUDGET_VND } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type {
  ComboPurpose,
  ComboRecommendation,
  ComboResponse,
  CpuVendor,
  GpuVendor,
} from '@/shared/types';

export interface ComboInitialParams {
  budget?: string;
  purpose?: string;
  cpuVendor?: string;
  gpuVendor?: string;
}

interface AppliedComboParams {
  budgetVnd: number;
  purpose: ComboPurpose;
  cpuVendor?: CpuVendor;
  gpuVendor?: GpuVendor;
}

function parsePurpose(raw?: string): ComboPurpose {
  if (raw === 'esport' || raw === 'work_ai') return raw;
  return 'gaming_aaa';
}

function parseCpuVendor(raw?: string): CpuVendor | undefined {
  return raw === 'intel' || raw === 'amd' ? raw : undefined;
}

function parseGpuVendor(raw?: string): GpuVendor | undefined {
  return raw === 'nvidia' || raw === 'amd' ? raw : undefined;
}

function normalizeBudgetDigits(raw: string): string {
  return raw.replace(/[\s.,₫đ]/gi, '').trim();
}

function parseBudgetValue(raw: string): number | null {
  const digits = normalizeBudgetDigits(raw);
  if (!digits || !/^\d+$/.test(digits)) return null;
  const num = Number(digits);
  if (
    !Number.isSafeInteger(num) ||
    num < COMBO_MIN_BUDGET_VND ||
    num > COMBO_MAX_BUDGET_VND
  ) {
    return null;
  }
  return num;
}

function buildComboApiUrl(params: AppliedComboParams): string {
  const qs = new URLSearchParams({
    budget: String(params.budgetVnd),
    purpose: params.purpose,
  });
  if (params.cpuVendor) qs.set('cpuVendor', params.cpuVendor);
  if (params.gpuVendor) qs.set('gpuVendor', params.gpuVendor);
  return `/api/tools/combo?${qs.toString()}`;
}

function buildComboPageUrl(params: AppliedComboParams): string {
  const qs = new URLSearchParams({
    budget: String(params.budgetVnd),
    purpose: params.purpose,
  });
  if (params.cpuVendor) qs.set('cpuVendor', params.cpuVendor);
  if (params.gpuVendor) qs.set('gpuVendor', params.gpuVendor);
  return `/tools/combo?${qs.toString()}`;
}

export function useComboAdvisorController(initial: ComboInitialParams) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const initialBudgetVnd = initial.budget ? parseBudgetValue(initial.budget) : 20_000_000;
  const initialPurpose = parsePurpose(initial.purpose);
  const initialCpuVendor = parseCpuVendor(initial.cpuVendor);
  const initialGpuVendor = parseGpuVendor(initial.gpuVendor);

  const [budgetInput, setBudgetInput] = useState(
    initialBudgetVnd !== null ? String(initialBudgetVnd) : initial.budget ?? '20000000',
  );
  const [purpose, setPurpose] = useState<ComboPurpose>(initialPurpose);
  const [cpuVendor, setCpuVendor] = useState<CpuVendor | undefined>(initialCpuVendor);
  const [gpuVendor, setGpuVendor] = useState<GpuVendor | undefined>(initialGpuVendor);
  const [budgetError, setBudgetError] = useState<string | null>(
    initial.budget && initialBudgetVnd === null ? VI_MESSAGES.tools.combo.invalidBudgetError : null,
  );

  const [applied, setApplied] = useState<AppliedComboParams | null>(
    initialBudgetVnd !== null
      ? {
          budgetVnd: initialBudgetVnd,
          purpose: initialPurpose,
          cpuVendor: initialCpuVendor,
          gpuVendor: initialGpuVendor,
        }
      : null,
  );

  const comboQuery = useQuery({
    queryKey: ['combo', applied],
    queryFn: () => apiFetch<ComboResponse>(buildComboApiUrl(applied!)),
    enabled: Boolean(applied),
  });

  function commitParams(next: AppliedComboParams) {
    setApplied(next);
    router.replace(buildComboPageUrl(next), { scroll: false });
  }

  function applyWithCurrentBudget(overrides: Partial<AppliedComboParams> = {}) {
    const nextPurpose = overrides.purpose ?? purpose;
    const nextCpuVendor = 'cpuVendor' in overrides ? overrides.cpuVendor : cpuVendor;
    const nextGpuVendor = 'gpuVendor' in overrides ? overrides.gpuVendor : gpuVendor;
    const nextBudget =
      overrides.budgetVnd !== undefined ? overrides.budgetVnd : parseBudgetValue(budgetInput);

    if (nextBudget === null) {
      setBudgetError(VI_MESSAGES.tools.combo.invalidBudgetError);
      return;
    }

    setBudgetError(null);
    commitParams({
      budgetVnd: nextBudget,
      purpose: nextPurpose,
      cpuVendor: nextCpuVendor,
      gpuVendor: nextGpuVendor,
    });
  }

  return {
    state: {
      budgetInput,
      budgetError,
      purpose,
      cpuVendor: cpuVendor ?? null,
      gpuVendor: gpuVendor ?? null,
      appliedBudgetVnd: applied?.budgetVnd ?? null,
      data: comboQuery.data ?? null,
      isLoading: comboQuery.isLoading,
      errorMessage: comboQuery.error?.message ?? null,
    },
    actions: {
      onChangeBudgetInput: (value: string) => {
        setBudgetError(null);
        setBudgetInput(value);
      },
      onSelectBudgetPreset: (amountVnd: number) => {
        setBudgetInput(String(amountVnd));
        setBudgetError(null);
        applyWithCurrentBudget({ budgetVnd: amountVnd });
      },
      onSelectPurpose: (nextPurpose: ComboPurpose) => {
        setPurpose(nextPurpose);
        if (applied !== null) {
          applyWithCurrentBudget({ purpose: nextPurpose });
        }
      },
      onSelectCpuVendor: (nextVendor: CpuVendor | null) => {
        const resolved = nextVendor ?? undefined;
        setCpuVendor(resolved);
        if (applied !== null) {
          applyWithCurrentBudget({ cpuVendor: resolved });
        }
      },
      onSelectGpuVendor: (nextVendor: GpuVendor | null) => {
        const resolved = nextVendor ?? undefined;
        setGpuVendor(resolved);
        if (applied !== null) {
          applyWithCurrentBudget({ gpuVendor: resolved });
        }
      },
      onSubmit: () => {
        applyWithCurrentBudget();
      },
      onApplyMinBudget: (minBudgetVnd: number) => {
        setBudgetInput(String(minBudgetVnd));
        setBudgetError(null);
        applyWithCurrentBudget({ budgetVnd: minBudgetVnd });
      },
      onAddBothToCart: (combo: ComboRecommendation) => {
        addItem({
          productId: combo.cpu.id,
          name: combo.cpu.name,
          unitPriceVnd: combo.cpu.priceVnd,
        });
        addItem({
          productId: combo.gpu.id,
          name: combo.gpu.name,
          unitPriceVnd: combo.gpu.priceVnd,
        });
      },
    },
  };
}
