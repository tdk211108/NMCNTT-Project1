'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { showToast } from '@/components/ui/toast-store';
import { ApiClientError, apiFetch } from '@/lib/api-client';
import { useAuthSession } from '@/features/auth/useAuthSession';
import { useCartStore } from '@/features/cart/store';
import { saveOrderToken } from '@/features/orders/order-tokens';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { CheckoutRequest, OrderWithToken } from '@/shared/types';
import {
  clearCheckoutAttempt,
  loadCheckoutAttempt,
} from './attempt-storage';

const subscribeNoop = () => () => {};

export function usePaymentController() {
  const router = useRouter();
  const { state: authState, actions: authActions } = useAuthSession();
  const clearCart = useCartStore((s) => s.clearCart);
  const removeCartItem = useCartStore((s) => s.removeItem);

  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const attempt = isClient ? loadCheckoutAttempt() : null;

  // Card inputs remain strictly in component state and are never submitted to the server.
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const createOrderMutation = useMutation({
    mutationFn: (request: CheckoutRequest) =>
      apiFetch<OrderWithToken>('/api/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': request.idempotencyKey },
        json: request,
      }),
    onSuccess: (res) => {
      clearCart();
      clearCheckoutAttempt();
      saveOrderToken(res.order.orderId, res.accessToken);
      router.push(`/orders/${res.order.orderId}`);
    },
    onError: (err) => {
      if (err instanceof ApiClientError && err.code === 'PRODUCT_UNAVAILABLE') {
        const unavailable = err.details?.items as
          | Array<{ productId: string; name: string | null }>
          | undefined;
        if (unavailable?.length) {
          for (const item of unavailable) {
            removeCartItem(item.productId);
            showToast(VI_MESSAGES.cart.removedUnavailableItemToast(item.name), 'error');
          }
        }
        clearCheckoutAttempt();
        router.replace('/cart');
        return;
      }
      showToast(
        err instanceof Error ? err.message : VI_MESSAGES.common.unexpectedError,
        'error',
      );
    },
  });

  return {
    state: {
      checkedStorage: isClient,
      isAuthLoading: authState.isLoading,
      isAuthenticated: authState.isAuthenticated,
      attempt,
      cardNumber,
      cardHolder,
      cardExpiry,
      cardCvv,
      isSubmitting: createOrderMutation.isPending,
    },
    actions: {
      onChangeCardNumber: setCardNumber,
      onChangeCardHolder: setCardHolder,
      onChangeCardExpiry: setCardExpiry,
      onChangeCardCvv: setCardCvv,
      onConfirmPayment: () => {
        if (!attempt || createOrderMutation.isPending) return;
        createOrderMutation.mutate(attempt.request);
      },
      onRequestLogin: () =>
        authActions.openAuthModal({
          tab: 'login',
          notice: VI_MESSAGES.auth.checkoutLoginRequired,
          postLoginRedirect: '/checkout/payment',
        }),
    },
  };
}
