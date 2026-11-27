'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useRef } from 'react';
import { showToast } from '@/components/ui/toast-store';
import { ApiClientError, apiFetch } from '@/lib/api-client';
import { useCartStore } from '@/features/cart/store';
import { invalidateOrderLists } from '@/features/orders/optimistic-board';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { CheckoutRequest, OrderWithToken } from '@/shared/types';
import { clearCheckoutAttempt } from './attempt-storage';

type RouterLike = ReturnType<typeof useRouter>;

/** Removes discontinued/unavailable cart lines reported by checkout/order APIs and redirects to `/cart`. */
export function handleUnavailableProductsError(
  error: ApiClientError,
  router: RouterLike,
  onBeforeRedirect?: () => void,
) {
  const unavailable = error.details?.items as
    | Array<{ productId: string; name: string | null }>
    | undefined;
  if (unavailable?.length) {
    const { removeItem } = useCartStore.getState();
    for (const entry of unavailable) {
      removeItem(entry.productId);
      showToast(VI_MESSAGES.cart.removedUnavailableItemToast(entry.name), 'error');
    }
  } else {
    showToast(error.message, 'error');
  }
  clearCheckoutAttempt();
  onBeforeRedirect?.();
  router.replace('/cart');
}

export interface UsePlaceOrderOptions {
  onBeforeRedirect?: () => void;
  onOrderPlaced: (order: OrderWithToken) => void;
}

/** Shared order-submission mutation for both COD review confirmation and card/QR payment confirmation. */
export function usePlaceOrder({ onBeforeRedirect, onOrderPlaced }: UsePlaceOrderOptions) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearCart = useCartStore((s) => s.clearCart);
  const inFlightRef = useRef(false);
  const submittedKeyRef = useRef<string | null>(null);

  const mutation = useMutation({
    mutationFn: (request: CheckoutRequest) =>
      apiFetch<OrderWithToken>('/api/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': request.idempotencyKey },
        json: request,
      }),
    onSuccess: (res, request) => {
      submittedKeyRef.current = request.idempotencyKey;
      clearCart();
      clearCheckoutAttempt();
      invalidateOrderLists(queryClient);
      onOrderPlaced(res);
    },
    onError: (err) => {
      if (err instanceof ApiClientError && err.code === 'PRODUCT_UNAVAILABLE') {
        handleUnavailableProductsError(err, router, onBeforeRedirect);
        return;
      }
      showToast(
        err instanceof Error ? err.message : VI_MESSAGES.common.unexpectedError,
        'error',
      );
    },
    onSettled: () => {
      inFlightRef.current = false;
    },
  });

  const { mutate: rawMutate } = mutation;
  const mutate = useCallback(
    (request: CheckoutRequest) => {
      if (inFlightRef.current || submittedKeyRef.current === request.idempotencyKey) {
        return;
      }
      inFlightRef.current = true;
      rawMutate(request);
    },
    [rawMutate],
  );

  return { ...mutation, mutate };
}
