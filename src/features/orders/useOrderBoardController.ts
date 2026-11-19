'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useSyncExternalStore } from 'react';
import { showToast } from '@/components/ui/toast-store';
import { ApiClientError, apiFetch } from '@/lib/api-client';
import { useAuthSession } from '@/features/auth/useAuthSession';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { OrderBoard, OrderWithToken } from '@/shared/types';
import { clearOrderToken, loadOrderToken, saveOrderToken } from './order-tokens';

const subscribeNoop = () => () => {};

export function useOrderBoardController(orderId: string) {
  const queryClient = useQueryClient();
  const { state: authState } = useAuthSession();

  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
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

  const advanceMutation = useMutation({
    mutationFn: (expectedStage: number) =>
      apiFetch<OrderBoard>(`/api/orders/${encodeURIComponent(orderId)}/advance`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        json: { expectedStage },
      }),
    onSuccess: (updatedBoard) => {
      queryClient.setQueryData(queryKey, updatedBoard);
    },
    onError: (err) => {
      if (err instanceof ApiClientError) {
        if (err.code === 'STALE_STAGE') {
          const freshBoard = err.details?.order as OrderBoard | undefined;
          if (freshBoard) {
            queryClient.setQueryData(queryKey, freshBoard);
          } else {
            queryClient.invalidateQueries({ queryKey });
          }
          return;
        }
        if (err.code === 'UNAUTHORIZED') {
          clearOrderToken(orderId);
          setTokenOverride(null);
          return;
        }
      }
      showToast(
        err instanceof Error ? err.message : VI_MESSAGES.common.unexpectedError,
        'error',
      );
    },
  });

  const unauthorizedOrMissingToken =
    isClient &&
    !authState.isLoading &&
    ((!token && !authState.isAuthenticated) ||
      (boardQuery.error instanceof ApiClientError && boardQuery.error.code === 'UNAUTHORIZED'));

  async function copyOrderId() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(orderId);
      showToast(VI_MESSAGES.orders.copiedOrderId, 'success');
    }
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
      isAdvancing: advanceMutation.isPending,
    },
    actions: {
      onCopyOrderId: copyOrderId,
      onAdvanceStage: () => {
        if (!boardQuery.data || advanceMutation.isPending) return;
        advanceMutation.mutate(boardQuery.data.stage);
      },
      onChangeLookupPhone: (value: string) => {
        setLookupPhone(value);
        reauthLookupMutation.reset();
      },
      onSubmitLookup: () => reauthLookupMutation.mutateAsync(lookupPhone),
    },
  };
}
