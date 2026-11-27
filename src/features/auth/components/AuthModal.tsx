'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { showToast } from '@/components/ui/toast-store';
import { apiFetch } from '@/lib/api-client';
import { submitFormOnEnterExcludingButtons } from '@/lib/client-hooks';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { FacebookPendingProfile } from '@/shared/types';
import { buildOAuthStartUrl, useAuthSession, type AuthModalTab } from '../useAuthSession';
import { useOtpStepState } from '../useOtpStepState';
import { FacebookEmailVerifyForm, ForgotPasswordForm } from './AuthOtpFlows';
import { OtpCodeField } from './OtpCodeField';

function getModalTitle(tab: AuthModalTab): string {
  if (tab === 'register') return VI_MESSAGES.auth.modalTitleRegister;
  if (tab === 'forgot') return VI_MESSAGES.auth.modalTitleForgot;
  if (tab === 'facebook_email') return VI_MESSAGES.auth.modalTitleFacebookEmail;
  return VI_MESSAGES.auth.modalTitleLogin;
}

export function AuthModal() {
  const { state, actions } = useAuthSession();
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regStep, setRegStep] = useState<'details' | 'otp'>('details');
  const regOtp = useOtpStepState();

  const loginUsernameRef = useRef<HTMLInputElement>(null);
  const registerUsernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const authError = url.searchParams.get('authError');
    const authStep = url.searchParams.get('authStep');

    if (authError || authStep) {
      url.searchParams.delete('authError');
      url.searchParams.delete('authStep');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }

    if (authError) {
      const oauthErrors = VI_MESSAGES.auth.oauthErrors as Record<string, string>;
      const message = oauthErrors[authError] ?? VI_MESSAGES.auth.oauthErrors.failed;
      showToast(message, 'error');
    }

    if (authStep === 'facebook_email') {
      void (async () => {
        try {
          const data = await apiFetch<{ pending: FacebookPendingProfile | null }>(
            '/api/auth/oauth/facebook/pending',
          );
          if (data.pending) {
            actions.openAuthModal({
              tab: 'facebook_email',
              facebookPending: data.pending,
            });
          } else {
            showToast(VI_MESSAGES.auth.oauthErrors.invalid_state, 'error');
          }
        } catch {
          showToast(VI_MESSAGES.auth.oauthErrors.failed, 'error');
        }
      })();
    }
    // Intentionally runs once on mount to inspect post-OAuth URL query parameters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!state.modalOpen || typeof window === 'undefined') return;
    const frame = window.requestAnimationFrame(() => {
      if (state.activeTab === 'login') {
        loginUsernameRef.current?.focus();
      } else if (state.activeTab === 'register' && regStep === 'details') {
        registerUsernameRef.current?.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [state.modalOpen, state.activeTab, regStep]);

  function resetFormFields() {
    setLoginUsername('');
    setLoginPassword('');
    setRegUsername('');
    setRegDisplayName('');
    setRegEmail('');
    setRegPassword('');
    setRegStep('details');
    regOtp.resetOtpState();
  }

  function resetFormsAndClose() {
    if (state.activeTab === 'facebook_email') {
      resetFormFields();
      void actions.cancelFacebookPending();
      return;
    }
    resetFormFields();
    actions.closeAuthModal();
  }

  function handleTabChange(nextTab: AuthModalTab) {
    setRegStep('details');
    regOtp.setCode('');
    actions.setActiveTab(nextTab);
  }

  async function submitRegisterOtpRequest() {
    const res = await actions.requestRegisterOtp({
      username: regUsername,
      displayName: regDisplayName,
      email: regEmail,
      password: regPassword,
    });
    regOtp.applyOtpRequested(res);
    setRegStep('otp');
  }

  const showPrimaryOAuthAndTabs =
    state.activeTab === 'login' || state.activeTab === 'register';

  return (
    <Modal open={state.modalOpen} title={getModalTitle(state.activeTab)} onClose={resetFormsAndClose}>
      <div data-testid={TEST_IDS.auth.modal} className="flex flex-col gap-4">
        {state.authNotice ? (
          <p className="rounded-control border-2 border-signal bg-surface-subtle px-3 py-2 text-sm text-ink">
            {state.authNotice}
          </p>
        ) : null}

        {showPrimaryOAuthAndTabs ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <a
                href={buildOAuthStartUrl('google', state.oauthNextPath)}
                data-testid={TEST_IDS.auth.googleButton}
                className="mtx-shadow-sm inline-flex min-h-11 items-center justify-center gap-2 rounded-control border-2 border-border-strong bg-surface-subtle px-3 py-2 text-sm font-semibold text-ink hover:border-signal hover:bg-surface-elevated"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#EA4335"
                    d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.9 1.5l2.6-2.5C16.8 3.4 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.8 9.1-9.2 0-.6-.1-1.1-.2-1.6H12z"
                  />
                </svg>
                <span>{VI_MESSAGES.auth.googleButton}</span>
              </a>

              <a
                href={buildOAuthStartUrl('facebook', state.oauthNextPath)}
                data-testid={TEST_IDS.auth.facebookButton}
                className="mtx-shadow-sm inline-flex min-h-11 items-center justify-center gap-2 rounded-control border-2 border-border-strong bg-surface-subtle px-3 py-2 text-sm font-semibold text-ink hover:border-signal hover:bg-surface-elevated"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#1877F2"
                    d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1C0 18.1 4.4 23.1 10.1 24v-8.4H7.1v-3.5h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9v2.3h3.4l-.5 3.5h-2.9V24C19.6 23.1 24 18.1 24 12.1z"
                  />
                </svg>
                <span>{VI_MESSAGES.auth.facebookButton}</span>
              </a>
            </div>

            <div className="flex items-center gap-3 text-xs text-ink-muted">
              <div className="h-px flex-1 bg-border" />
              <span>{VI_MESSAGES.auth.orDivider}</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-control border-2 border-border-strong bg-surface-subtle p-1">
              <button
                type="button"
                data-sfx="toggle"
                data-testid={TEST_IDS.auth.tabLogin}
                onClick={() => handleTabChange('login')}
                className={`min-h-9 cursor-pointer rounded-control px-3 text-sm font-semibold transition ${
                  state.activeTab === 'login'
                    ? 'bg-primary text-primary-fg'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {VI_MESSAGES.auth.tabLogin}
              </button>
              <button
                type="button"
                data-sfx="toggle"
                data-testid={TEST_IDS.auth.tabRegister}
                onClick={() => handleTabChange('register')}
                className={`min-h-9 cursor-pointer rounded-control px-3 text-sm font-semibold transition ${
                  state.activeTab === 'register'
                    ? 'bg-primary text-primary-fg'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {VI_MESSAGES.auth.tabRegister}
              </button>
            </div>
          </>
        ) : null}

        {state.errorMessage ? (
          <p
            role="alert"
            data-testid={TEST_IDS.auth.errorAlert}
            className="rounded-control border-2 border-danger bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {state.errorMessage}
          </p>
        ) : null}

        {state.activeTab === 'login' ? (
          <form
            onKeyDown={(e) => submitFormOnEnterExcludingButtons(e, state.isLoggingIn)}
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await actions.login({
                  username: loginUsername,
                  password: loginPassword,
                });
                resetFormFields();
              } catch {
                // Error exposed via state.errorMessage.
              }
            }}
            className="flex flex-col gap-3"
          >
            <Input
              ref={loginUsernameRef}
              id="auth-login-username"
              name="username"
              label={VI_MESSAGES.auth.loginUsernameLabel}
              autoComplete="username"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="next"
              required
              autoFocus
              value={loginUsername}
              onChange={(e) => {
                setLoginUsername(e.target.value);
                actions.resetErrors();
              }}
              data-testid={TEST_IDS.auth.loginUsername}
            />
            <p className="text-xs text-ink-muted">{VI_MESSAGES.auth.usernameHint}</p>
            <PasswordInput
              id="auth-login-password"
              name="password"
              label={VI_MESSAGES.auth.passwordLabel}
              autoComplete="current-password"
              spellCheck={false}
              enterKeyHint="done"
              required
              value={loginPassword}
              onChange={(e) => {
                setLoginPassword(e.target.value);
                actions.resetErrors();
              }}
              data-testid={TEST_IDS.auth.loginPassword}
              toggleTestId={TEST_IDS.auth.loginPasswordToggle}
            />
            <div className="flex justify-end">
              <button
                type="button"
                data-sfx="toggle"
                data-testid={TEST_IDS.auth.forgotPasswordLink}
                onClick={() => handleTabChange('forgot')}
                className="cursor-pointer text-xs font-semibold text-accent-ink hover:underline"
              >
                {VI_MESSAGES.auth.forgotPasswordLink}
              </button>
            </div>
            <div className="mt-1 flex justify-end gap-3">
              <Button variant="secondary" onClick={resetFormsAndClose}>
                {VI_MESSAGES.common.cancel}
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={state.isLoggingIn}
                data-testid={TEST_IDS.auth.loginSubmit}
              >
                {VI_MESSAGES.auth.loginSubmit}
              </Button>
            </div>
          </form>
        ) : state.activeTab === 'register' ? (
          regStep === 'details' ? (
            <form
              onKeyDown={(e) => submitFormOnEnterExcludingButtons(e, state.isSendingOtp)}
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await submitRegisterOtpRequest();
                } catch {
                  // Error exposed via state.errorMessage.
                }
              }}
              className="flex flex-col gap-3"
            >
              <Input
                ref={registerUsernameRef}
                id="auth-register-username"
                name="username"
                label={VI_MESSAGES.auth.usernameLabel}
                autoComplete="username"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="next"
                required
                autoFocus
                value={regUsername}
                onChange={(e) => {
                  setRegUsername(e.target.value);
                  actions.resetErrors();
                }}
                data-testid={TEST_IDS.auth.registerUsername}
              />
              <Input
                id="auth-register-display-name"
                name="displayName"
                label={VI_MESSAGES.auth.displayNameLabel}
                autoComplete="name"
                enterKeyHint="next"
                required
                value={regDisplayName}
                onChange={(e) => {
                  setRegDisplayName(e.target.value);
                  actions.resetErrors();
                }}
                data-testid={TEST_IDS.auth.registerDisplayName}
              />
              <Input
                id="auth-register-email"
                name="email"
                type="email"
                label={VI_MESSAGES.auth.emailLabel}
                autoComplete="email"
                spellCheck={false}
                enterKeyHint="next"
                required
                value={regEmail}
                onChange={(e) => {
                  setRegEmail(e.target.value);
                  actions.resetErrors();
                }}
                data-testid={TEST_IDS.auth.registerEmail}
              />
              <PasswordInput
                id="auth-register-password"
                name="password"
                label={VI_MESSAGES.auth.passwordLabel}
                autoComplete="new-password"
                spellCheck={false}
                enterKeyHint="done"
                required
                value={regPassword}
                onChange={(e) => {
                  setRegPassword(e.target.value);
                  actions.resetErrors();
                }}
                data-testid={TEST_IDS.auth.registerPassword}
                toggleTestId={TEST_IDS.auth.registerPasswordToggle}
              />
              <div className="mt-1 flex justify-end gap-3">
                <Button variant="secondary" onClick={resetFormsAndClose}>
                  {VI_MESSAGES.common.cancel}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={state.isSendingOtp}
                  data-testid={TEST_IDS.auth.registerSubmit}
                >
                  {VI_MESSAGES.auth.registerRequestOtpSubmit}
                </Button>
              </div>
            </form>
          ) : (
            <form
              onKeyDown={(e) => submitFormOnEnterExcludingButtons(e, state.isVerifyingOtp)}
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await actions.verifyRegisterOtp({
                    email: regOtp.sentEmail,
                    code: regOtp.code,
                  });
                  resetFormFields();
                } catch {
                  // Error exposed via state.errorMessage.
                }
              }}
              className="flex flex-col gap-3"
            >
              <OtpCodeField
                email={regOtp.sentEmail}
                code={regOtp.code}
                onCodeChange={(val) => {
                  regOtp.setCode(val);
                  actions.resetErrors();
                }}
                cooldownUntilMs={regOtp.cooldownUntilMs}
                isResending={state.isSendingOtp}
                disabled={state.isVerifyingOtp}
                onResend={async () => {
                  try {
                    await submitRegisterOtpRequest();
                  } catch {
                    // Error exposed via state.errorMessage.
                  }
                }}
              />
              <div className="mt-1 flex flex-wrap justify-between gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setRegStep('details');
                    regOtp.setCode('');
                    actions.resetErrors();
                  }}
                >
                  {VI_MESSAGES.auth.editInfoButton}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={state.isVerifyingOtp}
                  data-testid={TEST_IDS.auth.registerVerifySubmit}
                >
                  {VI_MESSAGES.auth.registerVerifySubmit}
                </Button>
              </div>
            </form>
          )
        ) : state.activeTab === 'forgot' ? (
          <ForgotPasswordForm
            isSendingOtp={state.isSendingOtp}
            isResetting={state.isVerifyingOtp}
            onRequestOtp={(payload) => actions.requestForgotPasswordOtp(payload)}
            onResetPassword={(payload) => actions.resetPasswordWithOtp(payload)}
            onSuccess={() => handleTabChange('login')}
            onBackToLogin={() => handleTabChange('login')}
            onResetErrors={() => actions.resetErrors()}
            onFormKeyDown={submitFormOnEnterExcludingButtons}
          />
        ) : (
          <FacebookEmailVerifyForm
            pending={state.facebookPending}
            isSendingOtp={state.isSendingOtp}
            isVerifying={state.isVerifyingOtp}
            onRequestOtp={(payload) => actions.requestFacebookOtp(payload)}
            onVerifyOtp={async (payload) => {
              await actions.verifyFacebookOtp(payload);
              resetFormFields();
            }}
            onCancel={resetFormsAndClose}
            onResetErrors={() => actions.resetErrors()}
            onFormKeyDown={submitFormOnEnterExcludingButtons}
          />
        )}
      </div>
    </Modal>
  );
}
