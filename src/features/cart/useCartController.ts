'use client';

import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { safeSessionStorage } from '@/lib/safe-storage';
import { useAuthSession } from '@/features/auth/useAuthSession';
import { CART_ADVISORY_DISMISSED_KEY, CART_MAX_QTY } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { CartAdvisorySummary } from '@/shared/types';
import { useCartStore } from './store';
import { useCartQuote } from './useCartQuote';

const ADVISORY_EVENT = 'coreraster:cart-advisory-dismiss-change';

const EMPTY_ADVISORIES: CartAdvisorySummary = {
  items: [],
  recommendedPsuTierW: null,
  recommendedPsuExactW: null,
  psuExceedsMaxTier: false,
};

function subscribeAdvisoryDismissed(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(ADVISORY_EVENT, onStoreChange);
  return () => window.removeEventListener(ADVISORY_EVENT, onStoreChange);
}

function getAdvisoryDismissedSnapshot(): boolean {
  return safeSessionStorage.getItem(CART_ADVISORY_DISMISSED_KEY) === '1';
}

function getAdvisoryDismissedServerSnapshot(): boolean {
  return false;
}

function writeAdvisoryDismissed(dismissed: boolean): void {
  safeSessionStorage.setItem(CART_ADVISORY_DISMISSED_KEY, dismissed ? '1' : '0');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ADVISORY_EVENT));
  }
}

export function useCartController(notice?: string | null) {
  const router = useRouter();
  const { state: authState, actions: authActions } = useAuthSession();
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [draftQtyById, setDraftQtyById] = useState<Record<string, string>>({});
  const isAdvisoryDismissed = useSyncExternalStore(
    subscribeAdvisoryDismissed,
    getAdvisoryDismissedSnapshot,
    getAdvisoryDismissedServerSnapshot,
  );

  const { items, hasHydrated, quoteQuery, quote } = useCartQuote('cart');
  const lines = quote?.lines ?? [];

  function handleQtyInputChange(productId: string, rawValue: string) {
    setDraftQtyById((prev) => ({ ...prev, [productId]: rawValue }));

    if (rawValue.trim() === '') return;
    if (!/^\d+$/.test(rawValue.trim())) return;

    const parsed = Number(rawValue.trim());
    if (parsed === 0) {
      setPendingRemoveId(productId);
      return;
    }

    const clamped = Math.min(CART_MAX_QTY, parsed);
    setQuantity(productId, clamped);
    setDraftQtyById((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }

  function handleQtyBlur(productId: string) {
    const raw = draftQtyById[productId];
    if (raw === undefined) return;
    const trimmed = raw.trim();
    if (trimmed === '0') {
      setPendingRemoveId(productId);
    }
    setDraftQtyById((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  }

  return {
    state: {
      hasHydrated,
      showEmptyNotice: notice === 'empty-cart',
      isEmpty: hasHydrated && items.length === 0,
      lines,
      draftQtyById,
      subtotalVnd: quote?.subtotalVnd ?? 0,
      shippingFeeVnd: quote?.shippingFeeVnd ?? 0,
      freeShipping: quote?.freeShipping ?? false,
      totalVnd: quote?.totalVnd ?? 0,
      totalQuantity: quote?.totalQuantity ?? 0,
      advisories: quote?.advisories ?? EMPTY_ADVISORIES,
      isAdvisoryDismissed,
      pendingRemoveId,
      isLoading: !hasHydrated || (items.length > 0 && quoteQuery.isLoading),
      errorMessage: quoteQuery.error?.message ?? null,
    },
    actions: {
      onDismissAdvisory: () => writeAdvisoryDismissed(true),
      onReopenAdvisory: () => writeAdvisoryDismissed(false),
      onIncrement: (productId: string, currentQty: number) =>
        setQuantity(productId, currentQty + 1),
      onDecrement: (productId: string, currentQty: number) => {
        if (currentQty <= 1) {
          setPendingRemoveId(productId);
          return;
        }
        setQuantity(productId, currentQty - 1);
      },
      onQtyInputChange: handleQtyInputChange,
      onQtyBlur: handleQtyBlur,
      onRequestRemove: (productId: string) => setPendingRemoveId(productId),
      onConfirmRemove: () => {
        if (!pendingRemoveId) return;
        const targetId = pendingRemoveId;
        removeItem(targetId);
        setDraftQtyById((prev) => {
          const next = { ...prev };
          delete next[targetId];
          return next;
        });
        setPendingRemoveId(null);
      },
      onCancelRemove: () => {
        if (pendingRemoveId) {
          const targetId = pendingRemoveId;
          setDraftQtyById((prev) => {
            const next = { ...prev };
            delete next[targetId];
            return next;
          });
        }
        setPendingRemoveId(null);
      },
      onProceedToCheckout: () => {
        if (lines.length === 0) return;
        if (!authState.isLoading && !authState.isAuthenticated) {
          authActions.openAuthModal({
            tab: 'login',
            notice: VI_MESSAGES.auth.checkoutLoginRequired,
            postLoginRedirect: '/checkout',
          });
          return;
        }
        router.push('/checkout');
      },
    },
  };
}
