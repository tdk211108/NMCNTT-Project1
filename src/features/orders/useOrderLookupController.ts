'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useAuthSession } from '@/features/auth/useAuthSession';
import type { OrderWithToken } from '@/shared/types';
import { saveOrderToken } from './order-tokens';

export function useOrderLookupController(initialOrderId = '') {
  const router = useRouter();
  const { state: authState, actions: authActions } = useAuthSession();
  const [orderId, setOrderId] = useState(initialOrderId);
  const [phone, setPhone] = useState('');

  const lookupMutation = useMutation({
    mutationFn: (payload: { orderId: string; phone: string }) =>
      apiFetch<OrderWithToken>('/api/orders/lookup', {
        method: 'POST',
        json: payload,
      }),
    onSuccess: (res) => {
      saveOrderToken(res.order.orderId, res.accessToken);
      router.push(`/orders/${res.order.orderId}`);
    },
  });

  return {
    state: {
      orderId,
      phone,
      isAuthenticated: authState.isAuthenticated,
      isSubmitting: lookupMutation.isPending,
      errorMessage: lookupMutation.error?.message ?? null,
    },
    actions: {
      onOpenLogin: () =>
        authActions.openAuthModal({ tab: 'login', postLoginRedirect: '/orders' }),
      onChangeOrderId: (value: string) => {
        setOrderId(value);
        lookupMutation.reset();
      },
      onChangePhone: (value: string) => {
        setPhone(value);
        lookupMutation.reset();
      },
      onSubmit: () => lookupMutation.mutateAsync({ orderId, phone }),
    },
  };
}
