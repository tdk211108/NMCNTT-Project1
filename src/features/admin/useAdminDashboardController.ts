'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { showToast } from '@/components/ui/toast-store';
import { apiFetch } from '@/lib/api-client';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { AdminResetResponse } from '@/shared/types';
import { AUTH_SESSION_QUERY_KEY } from '@/features/auth/useAuthSession';
import { handleAdminApiError } from './admin-error';

export function useAdminDashboardController() {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const resetMutation = useMutation({
    mutationFn: () =>
      apiFetch<AdminResetResponse>('/api/admin/reset', {
        method: 'POST',
      }),
    onSuccess: async (res) => {
      setConfirmOpen(false);
      await queryClient.invalidateQueries();
      showToast(
        `${VI_MESSAGES.admin.resetSuccessToast} (${res.productsRestored} SP, ${res.ordersDeleted} đơn đã xóa, ${res.imagesPurged} ảnh đã dọn)`,
        'success',
      );
      for (const warning of res.warnings) {
        showToast(warning, 'warning');
      }
    },
    onError: (err) =>
      handleAdminApiError(err, () =>
        queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY }),
      ),
  });

  return {
    state: {
      confirmOpen,
      isResetting: resetMutation.isPending,
      lastResetResult: resetMutation.data ?? null,
    },
    actions: {
      onOpenConfirm: () => setConfirmOpen(true),
      onCloseConfirm: () => setConfirmOpen(false),
      onConfirmReset: () => resetMutation.mutate(),
    },
  };
}
