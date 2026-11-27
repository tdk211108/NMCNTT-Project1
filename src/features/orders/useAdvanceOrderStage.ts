'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { showToast } from '@/components/ui/toast-store';
import { ApiClientError, apiFetch } from '@/lib/api-client';
import {
  playOrderDeliveredSfx,
  preloadOrderDeliveredSfx,
  shouldTriggerOrderDeliveredSfx,
} from '@/lib/ui-sound';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { OrderBoard } from '@/shared/types';
import { createOptimisticDeliveredBoard, invalidateOrderLists } from './optimistic-board';

interface AdvanceStageVariables {
  orderId: string;
  accessToken: string | null | undefined;
  expectedStage: number;
  previousBoard: OrderBoard;
  optimisticDelivered: boolean;
  targetQueryKey: readonly [string, string, string, string];
}

export interface UseAdvanceOrderStageOptions {
  activeBoard: OrderBoard | null | undefined;
  onBoardUpdated?: (orderId: string, board: OrderBoard) => void;
  onUnauthorized?: (orderId: string) => void;
}

/**
 * Shared mutation + optimistic delivery state + SFX lifecycle for advancing an OrderBoard
 * across both the placed-order popup and the standalone order tracking board.
 */
export function useAdvanceOrderStage({
  activeBoard,
  onBoardUpdated,
  onUnauthorized,
}: UseAdvanceOrderStageOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (activeBoard && !activeBoard.isCompleted) {
      preloadOrderDeliveredSfx();
    }
  }, [activeBoard]);

  const mutation = useMutation({
    mutationFn: ({ orderId, accessToken, expectedStage }: AdvanceStageVariables) =>
      apiFetch<OrderBoard>(`/api/orders/${encodeURIComponent(orderId)}/advance`, {
        method: 'POST',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        json: { expectedStage },
      }),
    onSuccess: (updatedBoard, vars) => {
      queryClient.setQueryData(vars.targetQueryKey, updatedBoard);
      invalidateOrderLists(queryClient);
      onBoardUpdated?.(vars.orderId, updatedBoard);
      if (
        !vars.optimisticDelivered &&
        shouldTriggerOrderDeliveredSfx(vars.expectedStage, updatedBoard)
      ) {
        void playOrderDeliveredSfx();
      }
    },
    onError: (err, vars) => {
      if (err instanceof ApiClientError) {
        if (err.code === 'STALE_STAGE' || err.code === 'ORDER_CANCELLED') {
          const freshBoard = err.details?.order as OrderBoard | undefined;
          if (freshBoard) {
            queryClient.setQueryData(vars.targetQueryKey, freshBoard);
            onBoardUpdated?.(vars.orderId, freshBoard);
            if (
              err.code === 'STALE_STAGE' &&
              !vars.optimisticDelivered &&
              shouldTriggerOrderDeliveredSfx(vars.expectedStage, freshBoard)
            ) {
              void playOrderDeliveredSfx();
            }
          } else {
            void queryClient.invalidateQueries({ queryKey: vars.targetQueryKey });
          }
          invalidateOrderLists(queryClient);
          if (err.code === 'STALE_STAGE') {
            return;
          }
          showToast(err.message, 'error');
          return;
        }
        if (err.code === 'UNAUTHORIZED' && onUnauthorized) {
          if (vars.optimisticDelivered) {
            queryClient.setQueryData(vars.targetQueryKey, vars.previousBoard);
            onBoardUpdated?.(vars.orderId, vars.previousBoard);
          }
          onUnauthorized(vars.orderId);
          return;
        }
      }
      if (vars.optimisticDelivered) {
        queryClient.setQueryData(vars.targetQueryKey, vars.previousBoard);
        onBoardUpdated?.(vars.orderId, vars.previousBoard);
      }
      showToast(
        err instanceof Error ? err.message : VI_MESSAGES.common.unexpectedError,
        'error',
      );
    },
  });

  const advanceStage = useCallback(
    (
      board: OrderBoard | null | undefined,
      accessToken: string | null | undefined,
      targetQueryKey: readonly [string, string, string, string],
    ) => {
      if (!board || mutation.isPending) return;
      const optimisticDelivered = board.stage === 3 && !board.isCompleted;
      if (optimisticDelivered) {
        const optimisticBoard = createOptimisticDeliveredBoard(board);
        queryClient.setQueryData(targetQueryKey, optimisticBoard);
        onBoardUpdated?.(board.orderId, optimisticBoard);
        void playOrderDeliveredSfx();
      }
      mutation.mutate({
        orderId: board.orderId,
        accessToken,
        expectedStage: board.stage,
        previousBoard: board,
        optimisticDelivered,
        targetQueryKey,
      });
    },
    [mutation, onBoardUpdated, queryClient],
  );

  return {
    isAdvancing: mutation.isPending,
    advanceStage,
  };
}
