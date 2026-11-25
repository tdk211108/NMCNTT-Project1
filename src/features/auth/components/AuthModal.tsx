'use client';

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { showToast } from '@/components/ui/toast-store';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import { buildOAuthStartUrl, useAuthSession } from '../useAuthSession';

export function AuthModal() {
  const { state, actions } = useAuthSession();
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const loginFormRef = useRef<HTMLFormElement>(null);
  const registerFormRef = useRef<HTMLFormElement>(null);
  const loginUsernameRef = useRef<HTMLInputElement>(null);
  const registerUsernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const authError = url.searchParams.get('authError');
    if (!authError) return;

    const oauthErrors = VI_MESSAGES.auth.oauthErrors as Record<string, string>;
    const message = oauthErrors[authError] ?? VI_MESSAGES.auth.oauthErrors.failed;
    showToast(message, 'error');

    url.searchParams.delete('authError');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  }, []);

  useEffect(() => {
    if (!state.modalOpen || typeof window === 'undefined') return;
    const frame = window.requestAnimationFrame(() => {
      if (state.activeTab === 'login') {
        loginUsernameRef.current?.focus();
      } else {
        registerUsernameRef.current?.focus();
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [state.modalOpen, state.activeTab]);

  function resetFormFields() {
    setLoginUsername('');
    setLoginPassword('');
    setRegUsername('');
    setRegDisplayName('');
    setRegPassword('');
  }

  function resetFormsAndClose() {
    resetFormFields();
    actions.closeAuthModal();
  }

  function handleFormEnterSubmit(
    event: ReactKeyboardEvent<HTMLFormElement>,
    form: HTMLFormElement | null,
    isBusy: boolean,
  ) {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing || isBusy) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target instanceof HTMLButtonElement && target.type === 'button') {
      return;
    }
    event.preventDefault();
    form?.requestSubmit();
  }

  const title =
    state.activeTab === 'login'
      ? VI_MESSAGES.auth.modalTitleLogin
      : VI_MESSAGES.auth.modalTitleRegister;

  return (
    <Modal open={state.modalOpen} title={title} onClose={resetFormsAndClose}>
      <div data-testid={TEST_IDS.auth.modal} className="flex flex-col gap-4">
        {state.authNotice ? (
          <p className="rounded-control border-2 border-signal bg-surface-subtle px-3 py-2 text-sm text-ink">
            {state.authNotice}
          </p>
        ) : null}

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
            onClick={() => actions.setActiveTab('login')}
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
            onClick={() => actions.setActiveTab('register')}
            className={`min-h-9 cursor-pointer rounded-control px-3 text-sm font-semibold transition ${
              state.activeTab === 'register'
                ? 'bg-primary text-primary-fg'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            {VI_MESSAGES.auth.tabRegister}
          </button>
        </div>

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
            ref={loginFormRef}
            onKeyDown={(e) => handleFormEnterSubmit(e, loginFormRef.current, state.isLoggingIn)}
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
              label={VI_MESSAGES.auth.usernameLabel}
              autoComplete="username"
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
            <Input
              type="password"
              label={VI_MESSAGES.auth.passwordLabel}
              autoComplete="current-password"
              required
              value={loginPassword}
              onChange={(e) => {
                setLoginPassword(e.target.value);
                actions.resetErrors();
              }}
              data-testid={TEST_IDS.auth.loginPassword}
            />
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
        ) : (
          <form
            ref={registerFormRef}
            onKeyDown={(e) =>
              handleFormEnterSubmit(e, registerFormRef.current, state.isRegistering)
            }
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await actions.register({
                  username: regUsername,
                  displayName: regDisplayName,
                  password: regPassword,
                });
                resetFormFields();
              } catch {
                // Error exposed via state.errorMessage.
              }
            }}
            className="flex flex-col gap-3"
          >
            <Input
              ref={registerUsernameRef}
              label={VI_MESSAGES.auth.usernameLabel}
              autoComplete="username"
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
              label={VI_MESSAGES.auth.displayNameLabel}
              autoComplete="name"
              required
              value={regDisplayName}
              onChange={(e) => {
                setRegDisplayName(e.target.value);
                actions.resetErrors();
              }}
              data-testid={TEST_IDS.auth.registerDisplayName}
            />
            <Input
              type="password"
              label={VI_MESSAGES.auth.passwordLabel}
              autoComplete="new-password"
              required
              value={regPassword}
              onChange={(e) => {
                setRegPassword(e.target.value);
                actions.resetErrors();
              }}
              data-testid={TEST_IDS.auth.registerPassword}
            />
            <div className="mt-1 flex justify-end gap-3">
              <Button variant="secondary" onClick={resetFormsAndClose}>
                {VI_MESSAGES.common.cancel}
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={state.isRegistering}
                data-testid={TEST_IDS.auth.registerSubmit}
              >
                {VI_MESSAGES.auth.registerSubmit}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
