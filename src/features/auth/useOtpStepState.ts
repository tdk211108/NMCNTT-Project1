'use client';

import { useState } from 'react';
import { showToast } from '@/components/ui/toast-store';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { OtpRequestResponse } from '@/shared/types';

/** Shared state for 2-step email -> OTP input flows across AuthModal forms. */
export function useOtpStepState() {
  const [sentEmail, setSentEmail] = useState('');
  const [code, setCode] = useState('');
  const [cooldownUntilMs, setCooldownUntilMs] = useState(0);

  function applyOtpRequested(res: OtpRequestResponse) {
    setSentEmail(res.email);
    setCooldownUntilMs(Date.now() + res.resendCooldownSeconds * 1000);
    showToast(VI_MESSAGES.auth.otpSentToast(res.email), 'info');
  }

  function resetOtpState() {
    setSentEmail('');
    setCode('');
    setCooldownUntilMs(0);
  }

  return {
    sentEmail,
    code,
    setCode,
    cooldownUntilMs,
    applyOtpRequested,
    resetOtpState,
  };
}
