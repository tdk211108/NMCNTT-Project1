'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { AdminOrderListItem } from '@/shared/types';
import { AUTH_SESSION_QUERY_KEY } from '@/features/auth/useAuthSession';
import { handleAdminApiError } from './admin-error';

export function useAdminOrdersController() {
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: async () => {
      try {
        return await apiFetch<AdminOrderListItem[]>('/api/admin/orders');
      } catch (err) {
        handleAdminApiError(err, () =>
          queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY }),
        );
        throw err;
      }
    },
  });

  return {
    state: {
      orders: ordersQuery.data ?? [],
      isLoading: ordersQuery.isLoading,
      errorMessage: ordersQuery.error?.message ?? null,
    },
  };
}
