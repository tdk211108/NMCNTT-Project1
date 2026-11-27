'use client';

import { useEffect, useId, useState } from 'react';
import { OTP_CODE_LENGTH, OTP_TTL_MINUTES } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { TEST_IDS } from '@/shared/testids';

export interface OtpCodeFieldProps {
  email: string;
  code: string;
  onCodeChange: (value: string) => void;
  cooldownUntilMs: number;
  onResend: () => void | Promise<void>;
  isResending: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
}

export function OtpCodeField({
  email,
  code,
  onCodeChange,
  cooldownUntilMs,
  onResend,
  isResending,
  autoFocus = true,
  disabled = false,
}: OtpCodeFieldProps) {
  const inputId = useId();
  const hintId = useId();
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    if (cooldownUntilMs <= Date.now()) {
      return;
    }
    const syncNow = window.setTimeout(() => setNowMs(Date.now()), 0);
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNowMs(current);
      if (current >= cooldownUntilMs) {
        window.clearInterval(timer);
      }
    }, 1000);
    return () => {
      window.clearTimeout(syncNow);
      window.clearInterval(timer);
    };
  }, [cooldownUntilMs]);

  const remainingSeconds = Math.max(0, Math.ceil((cooldownUntilMs - nowMs) / 1000));

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {VI_MESSAGES.auth.otpLabel}
        </label>
        <button
          type="button"
          data-testid={TEST_IDS.auth.otpResend}
          data-sfx="toggle"
          disabled={disabled || isResending || remainingSeconds > 0}
          onClick={async () => {
            await onResend();
            setNowMs(Date.now());
          }}
          className="cursor-pointer text-xs font-semibold text-accent-ink hover:underline disabled:cursor-not-allowed disabled:opacity-55"
        >
          {remainingSeconds > 0
            ? VI_MESSAGES.auth.otpResendWait(remainingSeconds)
            : VI_MESSAGES.auth.otpResendButton}
        </button>
      </div>

      {/* Place hint above the OTP input so mobile keyboards/autofill do not obscure it */}
      <p id={hintId} className="text-xs leading-relaxed text-ink-muted">
        {VI_MESSAGES.auth.otpHint(email, OTP_TTL_MINUTES)}
      </p>

      <input
        id={inputId}
        name="otp"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern={`\\d{${OTP_CODE_LENGTH}}`}
        maxLength={OTP_CODE_LENGTH}
        spellCheck={false}
        enterKeyHint="done"
        required
        autoFocus={autoFocus}
        disabled={disabled}
        aria-describedby={hintId}
        data-testid={TEST_IDS.auth.otpInput}
        value={code}
        onChange={(e) => {
          const digitsOnly = e.target.value.replace(/\D+/g, '').slice(0, OTP_CODE_LENGTH);
          onCodeChange(digitsOnly);
        }}
        placeholder="000000"
        className="w-full rounded-control border-2 border-border-strong bg-surface-subtle px-3 py-2.5 text-center font-mono text-lg font-bold tracking-[0.35em] text-ink transition focus:border-signal focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}
