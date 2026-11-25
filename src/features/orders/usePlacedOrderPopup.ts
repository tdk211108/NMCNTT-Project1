'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { showToast } from '@/components/ui/toast-store';
import { preloadOrderDeliveredSfx } from '@/lib/ui-sound';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { OrderWithToken } from '@/shared/types';
import { saveOrderToken } from './order-tokens';
import { useAdvanceOrderStage } from './useAdvanceOrderStage';

/**
 * Shared state + mutation controller for displaying the live OrderBoard popup immediately
 * after POST /api/orders succeeds across COD, VietQR, and Card checkout flows.
 */
export function usePlacedOrderPopup() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [placedOrder, setPlacedOrder] = useState<OrderWithToken | null>(null);
  const [hasCompletedOrder, setHasCompletedOrder] = useState(false);

  const { isAdvancing, advanceStage } = useAdvanceOrderStage({
    activeBoard: placedOrder?.order ?? null,
    onBoardUpdated: (orderId, board) => {
      setPlacedOrder((prev) =>
        prev && prev.order.orderId === orderId ? { ...prev, order: board } : prev,
      );
    },
  });

  const openPlacedOrder = useCallback(
    (res: OrderWithToken) => {
      if (!res.order.isCompleted) {
        preloadOrderDeliveredSfx();
      }
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
    if (!placedOrder) return;
    advanceStage(
      placedOrder.order,
      placedOrder.accessToken,
      ['orders', 'board', placedOrder.order.orderId, placedOrder.accessToken],
    );
  }, [placedOrder, advanceStage]);

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
      isAdvancing,
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
