'use client';

import { safeSessionStorage } from '@/lib/safe-storage';
import { ORDER_TOKEN_KEY_PREFIX, ORDER_TOKEN_KEY_SUFFIX } from '@/shared/constants';

export function buildOrderTokenStorageKey(orderId: string): string {
  return `${ORDER_TOKEN_KEY_PREFIX}${orderId}${ORDER_TOKEN_KEY_SUFFIX}`;
}

export function saveOrderToken(orderId: string, token: string): void {
  safeSessionStorage.setItem(buildOrderTokenStorageKey(orderId), token);
}

export function loadOrderToken(orderId: string): string | null {
  return safeSessionStorage.getItem(buildOrderTokenStorageKey(orderId));
}

export function clearOrderToken(orderId: string): void {
  safeSessionStorage.removeItem(buildOrderTokenStorageKey(orderId));
}
