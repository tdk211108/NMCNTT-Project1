'use client';

import { useQueryClient } from '@tanstack/react-query';
import { AUTH_SESSION_QUERY_KEY, useAuthSession, useAuthUiStore } from '@/features/auth/useAuthSession';

export const ADMIN_SESSION_QUERY_KEY = AUTH_SESSION_QUERY_KEY;

export const useAdminUiStore = {
  getState: () => ({
    openLoginModal: () => useAuthUiStore.getState().openAuthModal({ tab: 'login' }),
    closeLoginModal: () => useAuthUiStore.getState().closeAuthModal(),
  }),
};

export function useAdminSession() {
  const queryClient = useQueryClient();
  const auth = useAuthSession();

  return {
    state: {
      isAdmin: auth.state.isAdmin,
      isLoading: auth.state.isLoading,
      loginModalOpen: auth.state.modalOpen,
      isLoggingIn: auth.state.isLoggingIn,
      loginError: auth.state.errorMessage,
      isLoggingOut: auth.state.isLoggingOut,
    },
    actions: {
      openLoginModal: () => auth.actions.openAuthModal({ tab: 'login' }),
      closeLoginModal: auth.actions.closeAuthModal,
      login: (password: string) => auth.actions.login({ username: 'admin', password }),
      logout: auth.actions.logout,
      resetLoginError: auth.actions.resetErrors,
      invalidateSession: () =>
        queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY }),
    },
  };
}
