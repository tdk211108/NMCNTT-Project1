'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { showToast } from '@/components/ui/toast-store';
import { apiFetch } from '@/lib/api-client';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { AdminLegacyCpuItem, CpuVendor } from '@/shared/types';
import { handleAdminApiError } from './admin-error';
import { ADMIN_SESSION_QUERY_KEY } from './useAdminSession';

export interface LegacyCpuFormState {
  mode: 'create' | 'edit';
  editingId: string | null;
  name: string;
  vendor: CpuVendor;
  socket: string;
  coresTotal: string;
  threadsTotal: string;
  psuPowerW: string;
  passmarkRaw: string;
  passmarkSource: string;
}

function emptyLegacyCpuForm(): LegacyCpuFormState {
  return {
    mode: 'create',
    editingId: null,
    name: '',
    vendor: 'intel',
    socket: '',
    coresTotal: '',
    threadsTotal: '',
    psuPowerW: '',
    passmarkRaw: '',
    passmarkSource: '',
  };
}

function legacyFormFromItem(item: AdminLegacyCpuItem): LegacyCpuFormState {
  return {
    mode: 'edit',
    editingId: item.id,
    name: item.name,
    vendor: item.vendor,
    socket: item.socket ?? '',
    coresTotal: item.coresTotal !== null ? String(item.coresTotal) : '',
    threadsTotal: item.threadsTotal !== null ? String(item.threadsTotal) : '',
    psuPowerW: String(item.psuPowerW),
    passmarkRaw: item.passmarkRaw !== null ? String(item.passmarkRaw) : '',
    passmarkSource: item.passmarkSource ?? '',
  };
}

export function useAdminLegacyCpusController() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<LegacyCpuFormState | null>(null);

  const listQuery = useQuery({
    queryKey: ['admin', 'legacy-cpus'],
    queryFn: () => apiFetch<AdminLegacyCpuItem[]>('/api/admin/legacy-cpus'),
  });

  const invalidateSession = () =>
    queryClient.invalidateQueries({ queryKey: ADMIN_SESSION_QUERY_KEY });

  const saveMutation = useMutation({
    mutationFn: async (current: LegacyCpuFormState) => {
      const passmarkTrimmed = current.passmarkRaw.trim();
      const sourceTrimmed = current.passmarkSource.trim();
      const payload = {
        name: current.name,
        vendor: current.vendor,
        socket: current.socket.trim() === '' ? null : current.socket.trim(),
        coresTotal: current.coresTotal.trim() === '' ? null : Number(current.coresTotal),
        threadsTotal: current.threadsTotal.trim() === '' ? null : Number(current.threadsTotal),
        psuPowerW: Number(current.psuPowerW),
        passmarkRaw: passmarkTrimmed === '' ? null : Number(passmarkTrimmed),
        passmarkSource: passmarkTrimmed === '' ? null : sourceTrimmed || 'PassMark',
      };
      if (current.mode === 'create') {
        return apiFetch<AdminLegacyCpuItem>('/api/admin/legacy-cpus', {
          method: 'POST',
          json: payload,
        });
      }
      return apiFetch<AdminLegacyCpuItem>(
        `/api/admin/legacy-cpus/${encodeURIComponent(current.editingId!)}`,
        {
          method: 'PATCH',
          json: payload,
        },
      );
    },
    onSuccess: async () => {
      setForm(null);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'legacy-cpus'] });
      await queryClient.invalidateQueries({ queryKey: ['psu'] });
      await queryClient.invalidateQueries({ queryKey: ['upgrade'] });
      showToast(VI_MESSAGES.admin.saveSuccessToast, 'success');
    },
    onError: (err) => handleAdminApiError(err, invalidateSession),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>(`/api/admin/legacy-cpus/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'legacy-cpus'] });
      await queryClient.invalidateQueries({ queryKey: ['psu'] });
      await queryClient.invalidateQueries({ queryKey: ['upgrade'] });
      showToast(VI_MESSAGES.admin.deleteSuccessToast, 'success');
    },
    onError: (err) => handleAdminApiError(err, invalidateSession),
  });

  return {
    state: {
      items: listQuery.data ?? [],
      form,
      isLoading: listQuery.isLoading,
      isSaving: saveMutation.isPending,
      isDeleting: deleteMutation.isPending,
    },
    actions: {
      onStartCreate: () => setForm(emptyLegacyCpuForm()),
      onStartEdit: (item: AdminLegacyCpuItem) => setForm(legacyFormFromItem(item)),
      onCancelForm: () => setForm(null),
      onUpdateField: <K extends keyof LegacyCpuFormState>(key: K, value: LegacyCpuFormState[K]) =>
        setForm((prev) => (prev ? { ...prev, [key]: value } : prev)),
      onSave: () => {
        if (!form || saveMutation.isPending) return;
        saveMutation.mutate(form);
      },
      onDelete: (id: string) => deleteMutation.mutate(id),
    },
  };
}
