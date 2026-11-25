'use client';

import { useState } from 'react';
import { useIsClient } from '@/lib/client-hooks';
import { useAuthSession } from '@/features/auth/useAuthSession';
import { usePlacedOrderPopup } from '@/features/orders/usePlacedOrderPopup';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { loadCheckoutAttempt } from './attempt-storage';
import { usePlaceOrder } from './usePlaceOrder';

export function usePaymentController() {
  const { state: authState, actions: authActions } = useAuthSession();
  const placedOrderPopup = usePlacedOrderPopup();

  const isClient = useIsClient();
  const attempt = isClient ? loadCheckoutAttempt() : null;

  // Card inputs remain strictly in component state and are never submitted to the server.
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const createOrderMutation = usePlaceOrder({
    onOrderPlaced: (res) => placedOrderPopup.actions.openPlacedOrder(res),
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
      placedOrderModal: placedOrderPopup.state,
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
      placedOrderActions: placedOrderPopup.actions,
    },
  };
}
