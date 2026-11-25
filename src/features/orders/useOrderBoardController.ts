'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { showToast } from '@/components/ui/toast-store';
import { ApiClientError, apiFetch } from '@/lib/api-client';
import { useIsClient } from '@/lib/client-hooks';
import { useAuthSession } from '@/features/auth/useAuthSession';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { OrderBoard, OrderWithToken } from '@/shared/types';
import { clearOrderToken, loadOrderToken, saveOrderToken } from './order-tokens';
import { useAdvanceOrderStage } from './useAdvanceOrderStage';

export function useOrderBoardController(orderId: string) {
  const queryClient = useQueryClient();
  const { state: authState } = useAuthSession();

  const isClient = useIsClient();
  const [tokenOverride, setTokenOverride] = useState<string | null | undefined>(undefined);
  const [lookupPhone, setLookupPhone] = useState('');

  const token =
    tokenOverride !== undefined ? tokenOverride : isClient ? loadOrderToken(orderId) : null;

  const canFetchBoard = isClient && (Boolean(token) || authState.isAuthenticated);
  const queryKey = ['orders', 'board', orderId, token ?? authState.user?.id ?? 'anon'] as const;

  const boardQuery = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        return await apiFetch<OrderBoard>(`/api/orders/${encodeURIComponent(orderId)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
      } catch (err) {
        if (err instanceof ApiClientError && err.code === 'UNAUTHORIZED') {
          clearOrderToken(orderId);
          setTokenOverride(null);
        }
        throw err;
      }
    },
    enabled: canFetchBoard,
    retry: false,
  });

  const reauthLookupMutation = useMutation({
    mutationFn: (phone: string) =>
      apiFetch<OrderWithToken>('/api/orders/lookup', {
        method: 'POST',
        json: { orderId, phone },
      }),
    onSuccess: (res) => {
      saveOrderToken(res.order.orderId, res.accessToken);
      setTokenOverride(res.accessToken);
      queryClient.setQueryData(['orders', 'board', res.order.orderId, res.accessToken], res.order);
    },
  });

  const { isAdvancing, advanceStage } = useAdvanceOrderStage({
    activeBoard: boardQuery.data ?? null,
    onUnauthorized: (id) => {
      clearOrderToken(id);
      setTokenOverride(null);
    },
  });

  const unauthorizedOrMissingToken =
    isClient &&
    !authState.isLoading &&
    ((!token && !authState.isAuthenticated) ||
      (boardQuery.error instanceof ApiClientError && boardQuery.error.code === 'UNAUTHORIZED'));

  function copyOrderId() {
    showToast(VI_MESSAGES.orders.copiedOrderId, 'success');
  }

  return {
    state: {
      orderId,
      board: boardQuery.data ?? null,
      isLoading: !isClient || (canFetchBoard && boardQuery.isLoading),
      needsLookup: unauthorizedOrMissingToken,
      lookupPhone,
      isLookingUp: reauthLookupMutation.isPending,
      lookupError: reauthLookupMutation.error?.message ?? null,
      fetchError: !unauthorizedOrMissingToken ? (boardQuery.error?.message ?? null) : null,
      isAdvancing,
    },
    actions: {
      onCopyOrderId: copyOrderId,
      onAdvanceStage: () => advanceStage(boardQuery.data, token, queryKey),
      onChangeLookupPhone: (value: string) => {
        setLookupPhone(value);
        reauthLookupMutation.reset();
      },
      onSubmitLookup: () => reauthLookupMutation.mutateAsync(lookupPhone),
    },
  };
}
