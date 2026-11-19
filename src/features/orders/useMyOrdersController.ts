'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useAuthSession } from '@/features/auth/useAuthSession';
import type { CustomerOrderSummary } from '@/shared/types';

export function useMyOrdersController() {
  const { state: authState, actions: authActions } = useAuthSession();

  const ordersQuery = useQuery({
    queryKey: ['orders', 'mine', authState.user?.id ?? 'anon'],
    queryFn: () => apiFetch<CustomerOrderSummary[]>('/api/orders/mine'),
    enabled: authState.isAuthenticated && !authState.isAdmin,
  });

  return {
    state: {
      isAuthLoading: authState.isLoading,
      isAuthenticated: authState.isAuthenticated,
      isAdmin: authState.isAdmin,
      orders: ordersQuery.data ?? [],
      isLoading: ordersQuery.isLoading,
      errorMessage: ordersQuery.error?.message ?? null,
    },
    actions: {
      onOpenLogin: () =>
        authActions.openAuthModal({ tab: 'login', postLoginRedirect: '/orders' }),
      onRetry: () => {
        void ordersQuery.refetch();
      },
    },
  };
}
