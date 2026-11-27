import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthModalTab } from '@/features/auth/useAuthSession';
import { VI_MESSAGES } from '@/shared/messages/vi';

const mockUseAuthSession = vi.fn();

vi.mock('@/features/auth/useAuthSession', () => ({
  buildOAuthStartUrl: (provider: string, nextPath: string) =>
    `/api/auth/oauth/${provider}?next=${encodeURIComponent(nextPath)}`,
  useAuthSession: () => mockUseAuthSession(),
}));

const { AuthModal } = await import('@/features/auth/components/AuthModal');

function makeAuthSessionState(activeTab: AuthModalTab) {
  return {
    state: {
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
      modalOpen: true,
      activeTab,
      authNotice: null,
      facebookPending:
        activeTab === 'facebook_email'
          ? { displayName: 'Trần Facebook', avatarUrl: 'https://graph.facebook.com/avatar.jpg' }
          : null,
      oauthNextPath: '/',
      isLoggingIn: false,
      isSendingOtp: false,
      isVerifyingOtp: false,
      isLoggingOut: false,
      errorMessage: null,
    },
    actions: {
      openAuthModal: vi.fn(),
      closeAuthModal: vi.fn(),
      setActiveTab: vi.fn(),
      setFacebookPending: vi.fn(),
      login: vi.fn(),
      requestRegisterOtp: vi.fn(),
      verifyRegisterOtp: vi.fn(),
      requestFacebookOtp: vi.fn(),
      verifyFacebookOtp: vi.fn(),
      cancelFacebookPending: vi.fn(),
      requestForgotPasswordOtp: vi.fn(),
      resetPasswordWithOtp: vi.fn(),
      logout: vi.fn(),
      resetErrors: vi.fn(),
    },
  };
}

describe('AuthModal OTP flows and password monkey toggle integration', () => {
  beforeEach(() => {
    mockUseAuthSession.mockReset();
  });

  it('renders username/email login, forgot-password link, email register, forgot-password, and Facebook email views', () => {
    mockUseAuthSession.mockReturnValue(makeAuthSessionState('login'));
    const loginHtml = renderToStaticMarkup(createElement(AuthModal));
    expect(loginHtml).toContain(VI_MESSAGES.auth.loginUsernameLabel);
    expect(loginHtml).toContain('data-testid="auth-login-username"');
    expect(loginHtml).toContain('data-testid="auth-login-password"');
    expect(loginHtml).toContain('data-testid="auth-login-password-toggle"');
    expect(loginHtml).toContain('data-testid="auth-forgot-password-link"');
    expect(loginHtml).toContain('type="password"');
    expect(loginHtml).toMatch(/autocomplete="current-password"/i);
    expect(loginHtml).toContain(`aria-label="${VI_MESSAGES.auth.showPasswordAria}"`);
    expect(loginHtml).not.toContain('<ul');
    expect(loginHtml).not.toContain('<ol');

    mockUseAuthSession.mockReturnValue(makeAuthSessionState('register'));
    const registerHtml = renderToStaticMarkup(createElement(AuthModal));
    expect(registerHtml).toContain('data-testid="auth-register-username"');
    expect(registerHtml).toContain('data-testid="auth-register-email"');
    expect(registerHtml).toContain('type="email"');
    expect(registerHtml).toContain('data-testid="auth-register-password"');
    expect(registerHtml).toContain('data-testid="auth-register-password-toggle"');
    expect(registerHtml).toMatch(/autocomplete="new-password"/i);
    expect(registerHtml).toContain('monkey-hands-svg');
    expect(registerHtml).not.toContain('<ul');
    expect(registerHtml).not.toContain('<ol');

    mockUseAuthSession.mockReturnValue(makeAuthSessionState('forgot'));
    const forgotHtml = renderToStaticMarkup(createElement(AuthModal));
    expect(forgotHtml).toContain('data-testid="auth-forgot-email"');
    expect(forgotHtml).toContain('data-testid="auth-forgot-request-submit"');
    expect(forgotHtml).not.toContain('data-testid="auth-google-button"');
    expect(forgotHtml).not.toContain('<ul');

    mockUseAuthSession.mockReturnValue(makeAuthSessionState('facebook_email'));
    const fbHtml = renderToStaticMarkup(createElement(AuthModal));
    expect(fbHtml).toContain('Trần Facebook');
    expect(fbHtml).toContain('data-testid="auth-facebook-email"');
    expect(fbHtml).toContain('data-testid="auth-facebook-request-submit"');
    expect(fbHtml).not.toContain('<ul');
  });
});
