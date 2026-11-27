'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usePathname, useRouter } from 'next/navigation';
import { create } from 'zustand';
import { showToast } from '@/components/ui/toast-store';
import { apiFetch, extractApiErrorMessage } from '@/lib/api-client';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type {
  AuthSessionResponse,
  FacebookPendingProfile,
  OAuthProvider,
  OtpRequestResponse,
  SessionUser,
} from '@/shared/types';

export const AUTH_SESSION_QUERY_KEY = ['auth', 'session'] as const;

export type AuthModalTab = 'login' | 'register' | 'forgot' | 'facebook_email';

interface OpenAuthModalOptions {
  tab?: AuthModalTab;
  notice?: string | null;
  postLoginRedirect?: string | null;
  facebookPending?: FacebookPendingProfile | null;
}

interface AuthUiState {
  modalOpen: boolean;
  activeTab: AuthModalTab;
  authNotice: string | null;
  postLoginRedirect: string | null;
  facebookPending: FacebookPendingProfile | null;
  openAuthModal: (options?: OpenAuthModalOptions) => void;
  closeAuthModal: () => void;
  setActiveTab: (tab: AuthModalTab) => void;
  setFacebookPending: (pending: FacebookPendingProfile | null) => void;
}

export const useAuthUiStore = create<AuthUiState>((set) => ({
  modalOpen: false,
  activeTab: 'login',
  authNotice: null,
  postLoginRedirect: null,
  facebookPending: null,
  openAuthModal: (options) =>
    set({
      modalOpen: true,
      activeTab: options?.tab ?? 'login',
      authNotice: options?.notice ?? null,
      postLoginRedirect: options?.postLoginRedirect ?? null,
      facebookPending: options?.facebookPending ?? null,
    }),
  closeAuthModal: () =>
    set({
      modalOpen: false,
      authNotice: null,
      postLoginRedirect: null,
      facebookPending: null,
    }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setFacebookPending: (pending) => set({ facebookPending: pending }),
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
  const facebookPending = useAuthUiStore((s) => s.facebookPending);
  const openAuthModal = useAuthUiStore((s) => s.openAuthModal);
  const closeAuthModal = useAuthUiStore((s) => s.closeAuthModal);
  const setActiveTab = useAuthUiStore((s) => s.setActiveTab);
  const setFacebookPending = useAuthUiStore((s) => s.setFacebookPending);

  const sessionQuery = useQuery({
    queryKey: AUTH_SESSION_QUERY_KEY,
    queryFn: () => apiFetch<AuthSessionResponse>('/api/auth/session'),
    staleTime: 30_000,
  });

  async function syncAfterAuth(
    user: SessionUser,
    toastMessage: string,
    explicitRedirect?: string | null,
  ) {
    const redirectTarget = explicitRedirect ?? useAuthUiStore.getState().postLoginRedirect;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ['orders', 'mine'] }),
      queryClient.invalidateQueries({ queryKey: ['profile'] }),
    ]);
    closeAuthModal();
    showToast(toastMessage, 'success');

    if (redirectTarget && redirectTarget !== pathname) {
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

  const requestRegisterOtpMutation = useMutation({
    mutationFn: (payload: {
      username: string;
      displayName: string;
      email: string;
      password: string;
    }) =>
      apiFetch<OtpRequestResponse>('/api/auth/register/request-otp', {
        method: 'POST',
        json: payload,
      }),
  });

  const verifyRegisterOtpMutation = useMutation({
    mutationFn: (payload: { email: string; code: string }) =>
      apiFetch<{ user: SessionUser }>('/api/auth/register/verify-otp', {
        method: 'POST',
        json: payload,
      }),
    onSuccess: async ({ user }) => {
      await syncAfterAuth(user, VI_MESSAGES.auth.registerSuccessToast(user.displayName));
    },
  });

  const requestFacebookOtpMutation = useMutation({
    mutationFn: (payload: { email: string }) =>
      apiFetch<OtpRequestResponse>('/api/auth/oauth/facebook/request-otp', {
        method: 'POST',
        json: payload,
      }),
  });

  const verifyFacebookOtpMutation = useMutation({
    mutationFn: (payload: { email: string; code: string }) =>
      apiFetch<{ user: SessionUser; next: string }>('/api/auth/oauth/facebook/verify-otp', {
        method: 'POST',
        json: payload,
      }),
    onSuccess: async ({ user, next }) => {
      await syncAfterAuth(user, VI_MESSAGES.auth.loginSuccessToast(user.displayName), next);
    },
  });

  const requestForgotPasswordOtpMutation = useMutation({
    mutationFn: (payload: { email: string }) =>
      apiFetch<OtpRequestResponse>('/api/auth/forgot-password/request-otp', {
        method: 'POST',
        json: payload,
      }),
  });

  const resetPasswordWithOtpMutation = useMutation({
    mutationFn: (payload: {
      email: string;
      code: string;
      newPassword: string;
      confirmPassword: string;
    }) =>
      apiFetch<{ ok: boolean }>('/api/auth/forgot-password/reset', {
        method: 'POST',
        json: payload,
      }),
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
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ]);
      showToast(VI_MESSAGES.auth.logoutSuccessToast, 'info');
    },
  });

  function resetAllErrors() {
    loginMutation.reset();
    requestRegisterOtpMutation.reset();
    verifyRegisterOtpMutation.reset();
    requestFacebookOtpMutation.reset();
    verifyFacebookOtpMutation.reset();
    requestForgotPasswordOtpMutation.reset();
    resetPasswordWithOtpMutation.reset();
  }

  let errorMessage: string | null = null;
  if (activeTab === 'login') {
    errorMessage = extractApiErrorMessage(loginMutation.error);
  } else if (activeTab === 'register') {
    errorMessage =
      extractApiErrorMessage(verifyRegisterOtpMutation.error) ??
      extractApiErrorMessage(requestRegisterOtpMutation.error);
  } else if (activeTab === 'forgot') {
    errorMessage =
      extractApiErrorMessage(resetPasswordWithOtpMutation.error) ??
      extractApiErrorMessage(requestForgotPasswordOtpMutation.error);
  } else if (activeTab === 'facebook_email') {
    errorMessage =
      extractApiErrorMessage(verifyFacebookOtpMutation.error) ??
      extractApiErrorMessage(requestFacebookOtpMutation.error);
  }

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
      facebookPending,
      oauthNextPath,
      isLoggingIn: loginMutation.isPending,
      isSendingOtp:
        requestRegisterOtpMutation.isPending ||
        requestFacebookOtpMutation.isPending ||
        requestForgotPasswordOtpMutation.isPending,
      isVerifyingOtp:
        verifyRegisterOtpMutation.isPending ||
        verifyFacebookOtpMutation.isPending ||
        resetPasswordWithOtpMutation.isPending,
      isLoggingOut: logoutMutation.isPending,
      errorMessage,
    },
    actions: {
      openAuthModal,
      closeAuthModal: () => {
        resetAllErrors();
        closeAuthModal();
      },
      setActiveTab: (tab: AuthModalTab) => {
        resetAllErrors();
        setActiveTab(tab);
      },
      setFacebookPending,
      login: (payload: { username: string; password: string }) =>
        loginMutation.mutateAsync(payload),
      requestRegisterOtp: (payload: {
        username: string;
        displayName: string;
        email: string;
        password: string;
      }) => requestRegisterOtpMutation.mutateAsync(payload),
      verifyRegisterOtp: (payload: { email: string; code: string }) =>
        verifyRegisterOtpMutation.mutateAsync(payload),
      requestFacebookOtp: (payload: { email: string }) =>
        requestFacebookOtpMutation.mutateAsync(payload),
      verifyFacebookOtp: (payload: { email: string; code: string }) =>
        verifyFacebookOtpMutation.mutateAsync(payload),
      cancelFacebookPending: async () => {
        try {
          await apiFetch<{ ok: boolean }>('/api/auth/oauth/facebook/pending', {
            method: 'DELETE',
          });
        } catch {
          // Best-effort cookie clear on cancel.
        }
        resetAllErrors();
        closeAuthModal();
      },
      requestForgotPasswordOtp: (payload: { email: string }) =>
        requestForgotPasswordOtpMutation.mutateAsync(payload),
      resetPasswordWithOtp: (payload: {
        email: string;
        code: string;
        newPassword: string;
        confirmPassword: string;
      }) => resetPasswordWithOtpMutation.mutateAsync(payload),
      logout: () => logoutMutation.mutateAsync(),
      resetErrors: resetAllErrors,
    },
  };
}
