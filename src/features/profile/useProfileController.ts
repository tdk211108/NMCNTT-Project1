'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { showToast } from '@/components/ui/toast-store';
import { useAuthSession } from '@/features/auth/useAuthSession';
import { apiFetch, extractApiErrorMessage } from '@/lib/api-client';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { CustomerOrderSummary, UserProfileResponse } from '@/shared/types';

export type ProfileTab = 'overview' | 'orders';
export type OrderStatusFilter = 'all' | 'active' | 'completed' | 'cancelled';

export function filterProfileOrders(
  orders: readonly CustomerOrderSummary[],
  statusFilter: OrderStatusFilter,
): CustomerOrderSummary[] {
  if (statusFilter === 'all') {
    return [...orders];
  }
  if (statusFilter === 'cancelled') {
    return orders.filter((order) => order.isCancelled);
  }
  if (statusFilter === 'completed') {
    return orders.filter((order) => !order.isCancelled && order.stage === 4);
  }
  return orders.filter((order) => !order.isCancelled && order.stage < 4);
}

export function useProfileController() {
  const { state: authState, actions: authActions } = useAuthSession();
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['profile', authState.user?.id ?? 'guest'],
    queryFn: () => apiFetch<UserProfileResponse>('/api/profile'),
    enabled: authState.isAuthenticated && !authState.isAdmin,
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) =>
      apiFetch<{ ok: boolean }>('/api/profile/password', {
        method: 'POST',
        json: payload,
      }),
    onSuccess: () => {
      setPasswordModalOpen(false);
      showToast(VI_MESSAGES.profile.changePasswordSuccessToast, 'success');
    },
  });

  const allOrders = profileQuery.data?.orders ?? [];
  const filteredOrders = filterProfileOrders(allOrders, statusFilter);

  return {
    state: {
      isAuthLoading: authState.isLoading,
      isAuthenticated: authState.isAuthenticated,
      isAdmin: authState.isAdmin,
      isLoading: profileQuery.isLoading,
      errorMessage: extractApiErrorMessage(profileQuery.error),
      profileData: profileQuery.data ?? null,
      filteredOrders,
      activeTab,
      statusFilter,
      passwordModalOpen,
      isChangingPassword: changePasswordMutation.isPending,
      changePasswordError: extractApiErrorMessage(changePasswordMutation.error),
    },
    actions: {
      onOpenLogin: () => authActions.openAuthModal({ tab: 'login' }),
      onRetry: () => {
        void profileQuery.refetch();
      },
      onSelectTab: (tab: ProfileTab) => setActiveTab(tab),
      onSelectFilter: (filter: OrderStatusFilter) => setStatusFilter(filter),
      onOpenPasswordModal: () => {
        changePasswordMutation.reset();
        setPasswordModalOpen(true);
      },
      onClosePasswordModal: () => {
        changePasswordMutation.reset();
        setPasswordModalOpen(false);
      },
      onResetPasswordError: () => changePasswordMutation.reset(),
      onChangePassword: (payload: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
      }) => changePasswordMutation.mutateAsync(payload),
    },
  };
}
