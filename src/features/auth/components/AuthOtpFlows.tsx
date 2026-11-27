'use client';

import { useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { showToast } from '@/components/ui/toast-store';
import { getProfileInitials } from '@/lib/format';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';
import type { FacebookPendingProfile, OtpRequestResponse } from '@/shared/types';
import { useOtpStepState } from '../useOtpStepState';
import { OtpCodeField } from './OtpCodeField';

interface ForgotPasswordFormProps {
  isSendingOtp: boolean;
  isResetting: boolean;
  onRequestOtp: (payload: { email: string }) => Promise<OtpRequestResponse>;
  onResetPassword: (payload: {
    email: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<unknown>;
  onSuccess: () => void;
  onBackToLogin: () => void;
  onResetErrors: () => void;
  onFormKeyDown: (e: ReactKeyboardEvent<HTMLFormElement>, busy: boolean) => void;
}

export function ForgotPasswordForm({
  isSendingOtp,
  isResetting,
  onRequestOtp,
  onResetPassword,
  onSuccess,
  onBackToLogin,
  onResetErrors,
  onFormKeyDown,
}: ForgotPasswordFormProps) {
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const otp = useOtpStepState();

  async function sendOtp(targetEmail: string) {
    setLocalError(null);
    const res = await onRequestOtp({ email: targetEmail });
    otp.applyOtpRequested(res);
    setStep('reset');
  }

  if (step === 'email') {
    return (
      <form
        onKeyDown={(e) => onFormKeyDown(e, isSendingOtp)}
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await sendOtp(email);
          } catch {
            // Error rendered by AuthModal alert.
          }
        }}
        className="flex flex-col gap-3"
      >
        <p className="text-sm leading-relaxed text-ink-muted">
          {VI_MESSAGES.auth.forgotPasswordDesc}
        </p>
        <Input
          id="auth-forgot-email"
          name="email"
          type="email"
          label={VI_MESSAGES.auth.emailLabel}
          autoComplete="email"
          spellCheck={false}
          enterKeyHint="done"
          required
          autoFocus
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setLocalError(null);
            onResetErrors();
          }}
          data-testid={TEST_IDS.auth.forgotEmail}
        />
        <div className="mt-1 flex flex-wrap justify-between gap-2">
          <Button variant="ghost" onClick={onBackToLogin}>
            {VI_MESSAGES.auth.backToLogin}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSendingOtp}
            data-testid={TEST_IDS.auth.forgotRequestSubmit}
          >
            {VI_MESSAGES.auth.forgotPasswordSubmit}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form
      onKeyDown={(e) => onFormKeyDown(e, isResetting)}
      onSubmit={async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
          setLocalError(VI_MESSAGES.auth.passwordMismatchError);
          return;
        }
        setLocalError(null);
        try {
          await onResetPassword({
            email: otp.sentEmail,
            code: otp.code,
            newPassword,
            confirmPassword,
          });
          showToast(VI_MESSAGES.auth.forgotPasswordSuccessToast, 'success');
          onSuccess();
        } catch {
          // Error rendered by AuthModal alert.
        }
      }}
      className="flex flex-col gap-3"
    >
      {localError ? (
        <p
          role="alert"
          className="rounded-control border-2 border-danger bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {localError}
        </p>
      ) : null}

      <OtpCodeField
        email={otp.sentEmail}
        code={otp.code}
        onCodeChange={(val) => {
          otp.setCode(val);
          onResetErrors();
        }}
        cooldownUntilMs={otp.cooldownUntilMs}
        isResending={isSendingOtp}
        disabled={isResetting}
        onResend={async () => {
          try {
            await sendOtp(otp.sentEmail);
          } catch {
            // Error rendered by AuthModal alert.
          }
        }}
      />

      <PasswordInput
        id="auth-forgot-new-password"
        name="newPassword"
        label={VI_MESSAGES.auth.newPasswordLabel}
        autoComplete="new-password"
        spellCheck={false}
        enterKeyHint="next"
        required
        value={newPassword}
        onChange={(e) => {
          setNewPassword(e.target.value);
          setLocalError(null);
          onResetErrors();
        }}
        data-testid={TEST_IDS.auth.forgotNewPassword}
        toggleTestId={TEST_IDS.auth.forgotNewPasswordToggle}
      />

      <PasswordInput
        id="auth-forgot-confirm-password"
        name="confirmPassword"
        label={VI_MESSAGES.auth.confirmPasswordLabel}
        autoComplete="new-password"
        spellCheck={false}
        enterKeyHint="done"
        required
        value={confirmPassword}
        onChange={(e) => {
          setConfirmPassword(e.target.value);
          setLocalError(null);
          onResetErrors();
        }}
        data-testid={TEST_IDS.auth.forgotConfirmPassword}
        toggleTestId={TEST_IDS.auth.forgotConfirmPasswordToggle}
      />

      <div className="mt-1 flex flex-wrap justify-between gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            setStep('email');
            otp.setCode('');
            setLocalError(null);
            onResetErrors();
          }}
        >
          {VI_MESSAGES.auth.editInfoButton}
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isResetting}
          data-testid={TEST_IDS.auth.forgotResetSubmit}
        >
          {VI_MESSAGES.auth.forgotPasswordResetSubmit}
        </Button>
      </div>
    </form>
  );
}

interface FacebookEmailVerifyFormProps {
  pending: FacebookPendingProfile | null;
  isSendingOtp: boolean;
  isVerifying: boolean;
  onRequestOtp: (payload: { email: string }) => Promise<OtpRequestResponse>;
  onVerifyOtp: (payload: { email: string; code: string }) => Promise<unknown>;
  onCancel: () => void | Promise<void>;
  onResetErrors: () => void;
  onFormKeyDown: (e: ReactKeyboardEvent<HTMLFormElement>, busy: boolean) => void;
}

export function FacebookEmailVerifyForm({
  pending,
  isSendingOtp,
  isVerifying,
  onRequestOtp,
  onVerifyOtp,
  onCancel,
  onResetErrors,
  onFormKeyDown,
}: FacebookEmailVerifyFormProps) {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [avatarFailed, setAvatarFailed] = useState(false);
  const otp = useOtpStepState();

  const displayName = pending?.displayName ?? 'Facebook';

  async function sendOtp(targetEmail: string) {
    const res = await onRequestOtp({ email: targetEmail });
    otp.applyOtpRequested(res);
    setStep('otp');
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-control border-2 border-border-strong bg-surface-subtle p-3">
        {pending?.avatarUrl && !avatarFailed ? (
          <img
            src={pending.avatarUrl}
            alt={displayName}
            onError={() => setAvatarFailed(true)}
            className="h-11 w-11 shrink-0 rounded-full border border-border-strong object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-strong bg-primary font-display text-sm font-bold text-primary-fg">
            {getProfileInitials(displayName)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">
            {VI_MESSAGES.auth.facebookGreeting(displayName)}
          </p>
          <p className="text-xs leading-relaxed text-ink-muted">
            {VI_MESSAGES.auth.facebookVerifyDesc}
          </p>
        </div>
      </div>

      {step === 'email' ? (
        <form
          onKeyDown={(e) => onFormKeyDown(e, isSendingOtp)}
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await sendOtp(email);
            } catch {
              // Error rendered by AuthModal alert.
            }
          }}
          className="flex flex-col gap-3"
        >
          <Input
            id="auth-facebook-email"
            name="email"
            type="email"
            label={VI_MESSAGES.auth.emailLabel}
            autoComplete="email"
            spellCheck={false}
            enterKeyHint="done"
            required
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              onResetErrors();
            }}
            data-testid={TEST_IDS.auth.facebookEmail}
          />
          <div className="mt-1 flex flex-wrap justify-between gap-2">
            <Button variant="secondary" onClick={() => void onCancel()}>
              {VI_MESSAGES.common.cancel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSendingOtp}
              data-testid={TEST_IDS.auth.facebookRequestSubmit}
            >
              {VI_MESSAGES.auth.facebookRequestOtpSubmit}
            </Button>
          </div>
        </form>
      ) : (
        <form
          onKeyDown={(e) => onFormKeyDown(e, isVerifying)}
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await onVerifyOtp({ email: otp.sentEmail, code: otp.code });
            } catch {
              // Error rendered by AuthModal alert.
            }
          }}
          className="flex flex-col gap-3"
        >
          <OtpCodeField
            email={otp.sentEmail}
            code={otp.code}
            onCodeChange={(val) => {
              otp.setCode(val);
              onResetErrors();
            }}
            cooldownUntilMs={otp.cooldownUntilMs}
            isResending={isSendingOtp}
            disabled={isVerifying}
            onResend={async () => {
              try {
                await sendOtp(otp.sentEmail);
              } catch {
                // Error rendered by AuthModal alert.
              }
            }}
          />
          <div className="mt-1 flex flex-wrap justify-between gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setStep('email');
                otp.setCode('');
                onResetErrors();
              }}
            >
              {VI_MESSAGES.auth.editInfoButton}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isVerifying}
              data-testid={TEST_IDS.auth.facebookVerifySubmit}
            >
              {VI_MESSAGES.auth.facebookVerifySubmit}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
