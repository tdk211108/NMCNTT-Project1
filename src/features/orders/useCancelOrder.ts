'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { showToast } from '@/components/ui/toast-store';
import { ApiClientError, apiFetch } from '@/lib/api-client';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { OrderBoard } from '@/shared/types';
import { invalidateOrderLists } from './optimistic-board';

interface CancelOrderVariables {
  orderId: string;
  accessToken: string | null | undefined;
  targetQueryKey: readonly [string, string, string, string];
}

export interface UseCancelOrderOptions {
  onBoardUpdated?: (orderId: string, board: OrderBoard) => void;
  onUnauthorized?: (orderId: string) => void;
}

/**
 * Shared mutation controller for cancelling a stage-0 order across both the placed-order popup
 * and the standalone order tracking board.
 */
export function useCancelOrder({ onBoardUpdated, onUnauthorized }: UseCancelOrderOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ orderId, accessToken }: CancelOrderVariables) =>
      apiFetch<OrderBoard>(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {
        method: 'POST',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      }),
    onSuccess: (updatedBoard, vars) => {
      queryClient.setQueryData(vars.targetQueryKey, updatedBoard);
      invalidateOrderLists(queryClient);
      onBoardUpdated?.(vars.orderId, updatedBoard);
      showToast(VI_MESSAGES.orders.cancelSuccessToast, 'success');
    },
    onError: (err, vars) => {
      if (err instanceof ApiClientError) {
        if (err.code === 'ORDER_CANCELLED' || err.code === 'ORDER_CANCEL_NOT_ALLOWED') {
          const freshBoard = err.details?.order as OrderBoard | undefined;
          if (freshBoard) {
            queryClient.setQueryData(vars.targetQueryKey, freshBoard);
            onBoardUpdated?.(vars.orderId, freshBoard);
          } else {
            void queryClient.invalidateQueries({ queryKey: vars.targetQueryKey });
          }
          invalidateOrderLists(queryClient);
        } else if (err.code === 'UNAUTHORIZED' && onUnauthorized) {
          onUnauthorized(vars.orderId);
          return;
        }
      }
      showToast(
        err instanceof Error ? err.message : VI_MESSAGES.common.unexpectedError,
        'error',
      );
    },
  });

  const cancelOrder = useCallback(
    async (
      board: OrderBoard | null | undefined,
      accessToken: string | null | undefined,
      targetQueryKey: readonly [string, string, string, string],
    ): Promise<void> => {
      if (!board || !board.canCancel || mutation.isPending) return;
      try {
        await mutation.mutateAsync({
          orderId: board.orderId,
          accessToken,
          targetQueryKey,
        });
      } catch {
        // Error synced and toasted inside mutation onError.
      }
    },
    [mutation],
  );

  return {
    isCancelling: mutation.isPending,
    cancelOrder,
  };
}
