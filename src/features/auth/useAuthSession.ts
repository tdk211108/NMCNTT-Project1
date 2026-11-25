'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { create } from 'zustand';
import { showToast } from '@/components/ui/toast-store';
import { apiFetch } from '@/lib/api-client';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { AuthSessionResponse, OAuthProvider, SessionUser } from '@/shared/types';

export const AUTH_SESSION_QUERY_KEY = ['auth', 'session'] as const;

export type AuthModalTab = 'login' | 'register';

interface OpenAuthModalOptions {
  tab?: AuthModalTab;
  notice?: string | null;
  postLoginRedirect?: string | null;
}

interface AuthUiState {
  modalOpen: boolean;
  activeTab: AuthModalTab;
  authNotice: string | null;
  postLoginRedirect: string | null;
  openAuthModal: (options?: OpenAuthModalOptions) => void;
  closeAuthModal: () => void;
  setActiveTab: (tab: AuthModalTab) => void;
}

export const useAuthUiStore = create<AuthUiState>((set) => ({
  modalOpen: false,
  activeTab: 'login',
  authNotice: null,
  postLoginRedirect: null,
  openAuthModal: (options) =>
    set({
      modalOpen: true,
      activeTab: options?.tab ?? 'login',
      authNotice: options?.notice ?? null,
      postLoginRedirect: options?.postLoginRedirect ?? null,
    }),
  closeAuthModal: () =>
    set({
      modalOpen: false,
      authNotice: null,
      postLoginRedirect: null,
    }),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));

export function buildOAuthStartUrl(provider: OAuthProvider, nextPath: string): string {
  const safeNext = nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/';
  return `/api/auth/oauth/${provider}?next=${encodeURIComponent(safeNext)}`;
}

export function useAuthSession() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const modalOpen = useAuthUiStore((s) => s.modalOpen);
  const activeTab = useAuthUiStore((s) => s.activeTab);
  const authNotice = useAuthUiStore((s) => s.authNotice);
  const postLoginRedirect = useAuthUiStore((s) => s.postLoginRedirect);
  const openAuthModal = useAuthUiStore((s) => s.openAuthModal);
  const closeAuthModal = useAuthUiStore((s) => s.closeAuthModal);
  const setActiveTab = useAuthUiStore((s) => s.setActiveTab);

  const sessionQuery = useQuery({
    queryKey: AUTH_SESSION_QUERY_KEY,
    queryFn: () => apiFetch<AuthSessionResponse>('/api/auth/session'),
    staleTime: 30_000,
  });

  async function syncAfterAuth(user: SessionUser, toastMessage: string) {
    const redirectTarget = useAuthUiStore.getState().postLoginRedirect;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ['orders', 'mine'] }),
    ]);
    closeAuthModal();
    showToast(toastMessage, 'success');

    if (redirectTarget) {
      router.push(redirectTarget);
    } else if (user.role === 'admin' && !pathname?.startsWith('/admin')) {
      router.push('/admin');
    }
  }

  const loginMutation = useMutation({
    mutationFn: (payload: { username: string; password: string }) =>
      apiFetch<{ user: SessionUser }>('/api/auth/login', {
        method: 'POST',
        json: payload,
      }),
    onSuccess: async ({ user }) => {
      const msg =
        user.role === 'admin'
          ? VI_MESSAGES.auth.adminLoginSuccessToast
          : VI_MESSAGES.auth.loginSuccessToast(user.displayName);
      await syncAfterAuth(user, msg);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: { username: string; displayName: string; password: string }) =>
      apiFetch<{ user: SessionUser }>('/api/auth/register', {
        method: 'POST',
        json: payload,
      }),
    onSuccess: async ({ user }) => {
      await syncAfterAuth(user, VI_MESSAGES.auth.registerSuccessToast(user.displayName));
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () =>
      apiFetch<void>('/api/auth/logout', {
        method: 'POST',
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['orders', 'mine'] }),
      ]);
      showToast(VI_MESSAGES.auth.logoutSuccessToast, 'info');
    },
  });

  const oauthNextPath = postLoginRedirect ?? (pathname || '/');

  return {
    state: {
      user: sessionQuery.data?.user ?? null,
      isAuthenticated: Boolean(sessionQuery.data?.user),
      isAdmin: sessionQuery.data?.user?.role === 'admin',
      isLoading: sessionQuery.isLoading,
      modalOpen,
      activeTab,
      authNotice,
      oauthNextPath,
      isLoggingIn: loginMutation.isPending,
      isRegistering: registerMutation.isPending,
      isLoggingOut: logoutMutation.isPending,
      errorMessage:
        activeTab === 'login'
          ? (loginMutation.error?.message ?? null)
          : (registerMutation.error?.message ?? null),
    },
    actions: {
      openAuthModal,
      closeAuthModal: () => {
        loginMutation.reset();
        registerMutation.reset();
        closeAuthModal();
      },
      setActiveTab: (tab: AuthModalTab) => {
        loginMutation.reset();
        registerMutation.reset();
        setActiveTab(tab);
      },
      login: (payload: { username: string; password: string }) =>
        loginMutation.mutateAsync(payload),
      register: (payload: { username: string; displayName: string; password: string }) =>
        registerMutation.mutateAsync(payload),
      logout: () => logoutMutation.mutateAsync(),
      resetErrors: () => {
        loginMutation.reset();
        registerMutation.reset();
      },
    },
  };
}
