'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import type { PsuEstimate, PsuOptions } from '@/shared/types';

export function usePsuController(prefill: { cpu?: string; gpu?: string }) {
  const [cpuOverride, setCpuOverride] = useState<string | null>(null);
  const [gpuOverride, setGpuOverride] = useState<string | null>(null);

  const optionsQuery = useQuery({
    queryKey: ['psu', 'options'],
    queryFn: () => apiFetch<PsuOptions>('/api/psu/options'),
  });

  const cpus = optionsQuery.data?.cpus ?? [];
  const gpus = optionsQuery.data?.gpus ?? [];

  const cpuPrefillMatched = Boolean(prefill.cpu && cpus.some((c) => c.id === prefill.cpu));
  const gpuPrefillMatched = Boolean(prefill.gpu && gpus.some((g) => g.id === prefill.gpu));

  const selectedCpu =
    cpuOverride ?? (cpuPrefillMatched && prefill.cpu ? prefill.cpu : '');
  const selectedGpu =
    gpuOverride ?? (gpuPrefillMatched && prefill.gpu ? prefill.gpu : '');

  const prefillMissing = Boolean(
    optionsQuery.data &&
      ((prefill.cpu && !cpuPrefillMatched) || (prefill.gpu && !gpuPrefillMatched)),
  );

  const estimateMutation = useMutation({
    mutationFn: ({ cpu, gpu }: { cpu: string; gpu: string }) =>
      apiFetch<PsuEstimate>(
        `/api/psu/estimate?cpu=${encodeURIComponent(cpu)}&gpu=${encodeURIComponent(gpu)}`,
      ),
  });

  return {
    state: {
      retailCpus: cpus.filter((c) => c.source === 'store'),
      legacyCpus: cpus.filter((c) => c.source === 'legacy'),
      retailGpus: gpus.filter((g) => g.source === 'store'),
      legacyGpus: gpus.filter((g) => g.source === 'legacy'),
      selectedCpu,
      selectedGpu,
      prefillMissing,
      canCalculate: Boolean(selectedCpu && selectedGpu),
      isLoadingOptions: optionsQuery.isLoading,
      isCalculating: estimateMutation.isPending,
      estimate: estimateMutation.data ?? null,
      errorMessage:
        optionsQuery.error?.message ?? estimateMutation.error?.message ?? null,
    },
    actions: {
      onRetryOptions: () => {
        void optionsQuery.refetch();
      },
      onSelectCpu: (id: string) => {
        setCpuOverride(id);
        estimateMutation.reset();
      },
      onSelectGpu: (id: string) => {
        setGpuOverride(id);
        estimateMutation.reset();
      },
      onCalculate: () => {
        if (!selectedCpu || !selectedGpu) return;
        estimateMutation.mutate({ cpu: selectedCpu, gpu: selectedGpu });
      },
    },
  };
}
