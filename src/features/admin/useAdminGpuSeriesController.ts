'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { showToast } from '@/components/ui/toast-store';
import { apiFetch } from '@/lib/api-client';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { AdminGpuSeriesItem, GpuSeriesKind, GpuVendor } from '@/shared/types';
import { AUTH_SESSION_QUERY_KEY } from '@/features/auth/useAuthSession';
import { handleAdminApiError } from './admin-error';

export interface GpuSeriesFormState {
  mode: 'create' | 'edit';
  editingId: string | null;
  kind: GpuSeriesKind;
  name: string;
  vendor: GpuVendor;
  vramGb: string;
  tbpW: string;
  cores: string;
  baseClockMhz: string;
  boostClockMhz: string;
  memoryType: string;
  busWidthBit: string;
  passmarkRaw: string;
  passmarkSource: string;
}

function emptySeriesForm(kind: GpuSeriesKind): GpuSeriesFormState {
  return {
    mode: 'create',
    editingId: null,
    kind,
    name: '',
    vendor: 'nvidia',
    vramGb: '',
    tbpW: '',
    cores: '',
    baseClockMhz: '',
    boostClockMhz: '',
    memoryType: '',
    busWidthBit: '',
    passmarkRaw: '',
    passmarkSource: kind === 'retail' ? 'PassMark' : '',
  };
}

function seriesFormFromItem(item: AdminGpuSeriesItem): GpuSeriesFormState {
  return {
    mode: 'edit',
    editingId: item.id,
    kind: item.kind,
    name: item.name,
    vendor: item.vendor,
    vramGb: String(item.vramGb),
    tbpW: String(item.tbpW),
    cores: item.cores !== null ? String(item.cores) : '',
    baseClockMhz: item.baseClockMhz !== null ? String(item.baseClockMhz) : '',
    boostClockMhz: item.boostClockMhz !== null ? String(item.boostClockMhz) : '',
    memoryType: item.memoryType ?? '',
    busWidthBit: item.busWidthBit !== null ? String(item.busWidthBit) : '',
    passmarkRaw: item.passmarkRaw !== null ? String(item.passmarkRaw) : '',
    passmarkSource: item.passmarkSource ?? (item.kind === 'retail' ? 'PassMark' : ''),
  };
}

export function useAdminGpuSeriesController() {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<GpuSeriesKind>('retail');
  const [form, setForm] = useState<GpuSeriesFormState | null>(null);

  const seriesQuery = useQuery({
    queryKey: ['admin', 'gpu-series', kind],
    queryFn: () => apiFetch<AdminGpuSeriesItem[]>(`/api/admin/gpu-series?kind=${kind}`),
  });

  const invalidateSession = () =>
    queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY });

  const saveMutation = useMutation({
    mutationFn: async (current: GpuSeriesFormState) => {
      const common = {
        name: current.name,
        vendor: current.vendor,
        vramGb: Number(current.vramGb),
        tbpW: Number(current.tbpW),
      };
      const legacyPassmarkTrimmed = current.passmarkRaw.trim();
      const legacySourceTrimmed = current.passmarkSource.trim();
      const kindSpecificFields =
        current.kind === 'retail'
          ? {
              cores: Number(current.cores),
              baseClockMhz: Number(current.baseClockMhz),
              boostClockMhz: Number(current.boostClockMhz),
              memoryType: current.memoryType,
              busWidthBit: Number(current.busWidthBit),
              passmarkRaw: Number(current.passmarkRaw),
              passmarkSource: current.passmarkSource || 'PassMark',
            }
          : {
              passmarkRaw: legacyPassmarkTrimmed === '' ? null : Number(legacyPassmarkTrimmed),
              passmarkSource:
                legacyPassmarkTrimmed === '' ? null : legacySourceTrimmed || 'PassMark',
            };

      if (current.mode === 'create') {
        return apiFetch<AdminGpuSeriesItem>('/api/admin/gpu-series', {
          method: 'POST',
          json: { kind: current.kind, ...common, ...kindSpecificFields },
        });
      }

      return apiFetch<AdminGpuSeriesItem>(
        `/api/admin/gpu-series/${encodeURIComponent(current.editingId!)}`,
        {
          method: 'PATCH',
          json: { ...common, ...kindSpecificFields },
        },
      );
    },
    onSuccess: async () => {
      setForm(null);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'gpu-series'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['psu'] });
      await queryClient.invalidateQueries({ queryKey: ['upgrade'] });
      await queryClient.invalidateQueries({ queryKey: ['combo'] });
      showToast(VI_MESSAGES.admin.saveSuccessToast, 'success');
    },
    onError: (err) => handleAdminApiError(err, invalidateSession),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/admin/gpu-series/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'gpu-series'] });
      await queryClient.invalidateQueries({ queryKey: ['psu'] });
      await queryClient.invalidateQueries({ queryKey: ['upgrade'] });
      await queryClient.invalidateQueries({ queryKey: ['combo'] });
      showToast(VI_MESSAGES.admin.deleteSuccessToast, 'success');
    },
    onError: (err) => handleAdminApiError(err, invalidateSession),
  });

  return {
    state: {
      kind,
      items: seriesQuery.data ?? [],
      form,
      isLoading: seriesQuery.isLoading,
      isSaving: saveMutation.isPending,
      isDeleting: deleteMutation.isPending,
    },
    actions: {
      onChangeKind: (nextKind: GpuSeriesKind) => {
        setKind(nextKind);
        setForm(null);
      },
      onStartCreate: () => setForm(emptySeriesForm(kind)),
      onStartEdit: (item: AdminGpuSeriesItem) => setForm(seriesFormFromItem(item)),
      onCancelForm: () => setForm(null),
      onUpdateField: <K extends keyof GpuSeriesFormState>(key: K, value: GpuSeriesFormState[K]) =>
        setForm((prev) => (prev ? { ...prev, [key]: value } : prev)),
      onSave: () => {
        if (!form || saveMutation.isPending) return;
        saveMutation.mutate(form);
      },
      onDelete: (id: string) => deleteMutation.mutate(id),
    },
  };
}
