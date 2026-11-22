'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { showToast } from '@/components/ui/toast-store';
import { ApiClientError, apiFetch } from '@/lib/api-client';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { OrderBoard, OrderWithToken } from '@/shared/types';
import { saveOrderToken } from './order-tokens';

interface AdvancePlacedOrderInput {
  orderId: string;
  accessToken: string;
  expectedStage: number;
}

/**
 * Shared state + mutation controller for displaying the live OrderBoard popup immediately
 * after POST /api/orders succeeds across COD, VietQR, and Card checkout flows.
 */
export function usePlacedOrderPopup() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [placedOrder, setPlacedOrder] = useState<OrderWithToken | null>(null);
  const [hasCompletedOrder, setHasCompletedOrder] = useState(false);

  const advanceMutation = useMutation({
    mutationFn: ({ orderId, accessToken, expectedStage }: AdvancePlacedOrderInput) =>
      apiFetch<OrderBoard>(`/api/orders/${encodeURIComponent(orderId)}/advance`, {
        method: 'POST',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        json: { expectedStage },
      }),
    onSuccess: (updatedBoard, vars) => {
      queryClient.setQueryData(['orders', 'board', vars.orderId, vars.accessToken], updatedBoard);
      setPlacedOrder((prev) =>
        prev && prev.order.orderId === vars.orderId ? { ...prev, order: updatedBoard } : prev,
      );
    },
    onError: (err, vars) => {
      if (err instanceof ApiClientError && err.code === 'STALE_STAGE') {
        const freshBoard = err.details?.order as OrderBoard | undefined;
        if (freshBoard) {
          queryClient.setQueryData(['orders', 'board', vars.orderId, vars.accessToken], freshBoard);
          setPlacedOrder((prev) =>
            prev && prev.order.orderId === vars.orderId ? { ...prev, order: freshBoard } : prev,
          );
        }
        return;
      }
      showToast(
        err instanceof Error ? err.message : VI_MESSAGES.common.unexpectedError,
        'error',
      );
    },
  });

  const openPlacedOrder = useCallback(
    (res: OrderWithToken) => {
      saveOrderToken(res.order.orderId, res.accessToken);
      queryClient.setQueryData(['orders', 'board', res.order.orderId, res.accessToken], res.order);
      setHasCompletedOrder(true);
      setPlacedOrder(res);
    },
    [queryClient],
  );

  const onCopyOrderId = useCallback(() => {
    showToast(VI_MESSAGES.orders.copiedOrderId, 'success');
  }, []);

  const onAdvanceStage = useCallback(() => {
    if (!placedOrder || advanceMutation.isPending) {
      return;
    }
    advanceMutation.mutate({
      orderId: placedOrder.order.orderId,
      accessToken: placedOrder.accessToken,
      expectedStage: placedOrder.order.stage,
    });
  }, [placedOrder, advanceMutation]);

  const navigateAndClear = useCallback(
    (href: string) => {
      setPlacedOrder(null);
      router.push(href);
    },
    [router],
  );

  const onContinueShopping = useCallback(() => {
    if (!placedOrder) return;
    navigateAndClear('/');
  }, [placedOrder, navigateAndClear]);

  const onViewMyOrders = useCallback(() => {
    if (!placedOrder) return;
    navigateAndClear('/orders');
  }, [placedOrder, navigateAndClear]);

  const onClose = useCallback(() => {
    if (!placedOrder) return;
    navigateAndClear(`/orders/${placedOrder.order.orderId}`);
  }, [placedOrder, navigateAndClear]);

  return {
    state: {
      placedOrder,
      hasCompletedOrder,
      isAdvancing: advanceMutation.isPending,
    },
    actions: {
      openPlacedOrder,
      onCopyOrderId,
      onAdvanceStage,
      onContinueShopping,
      onViewMyOrders,
      onClose,
    },
  };
}
