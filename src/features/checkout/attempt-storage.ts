'use client';

import { safeSessionStorage } from '@/lib/safe-storage';
import { CHECKOUT_ATTEMPT_KEY } from '@/shared/constants';
import type { CheckoutRequest, PrepareResponse } from '@/shared/types';

export interface StoredCheckoutAttempt {
  idempotencyKey: string;
  request: CheckoutRequest;
  prepared: PrepareResponse;
}

export function saveCheckoutAttempt(attempt: StoredCheckoutAttempt): void {
  safeSessionStorage.setItem(CHECKOUT_ATTEMPT_KEY, JSON.stringify(attempt));
}

export function loadCheckoutAttempt(): StoredCheckoutAttempt | null {
  const raw = safeSessionStorage.getItem(CHECKOUT_ATTEMPT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredCheckoutAttempt;
  } catch {
    return null;
  }
}

export function clearCheckoutAttempt(): void {
  safeSessionStorage.removeItem(CHECKOUT_ATTEMPT_KEY);
}
