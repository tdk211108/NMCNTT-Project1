'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { useAuthSession } from '@/features/auth/useAuthSession';
import { CART_MAX_QTY } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { CartQuote } from '@/shared/types';
import { useCartStore } from './store';

export function useCartController(notice?: string | null) {
  const router = useRouter();
  const { state: authState, actions: authActions } = useAuthSession();
  const items = useCartStore((s) => s.items);
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const applyServerQuote = useCartStore((s) => s.applyServerQuote);

  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [draftQtyById, setDraftQtyById] = useState<Record<string, string>>({});

  const quotePayload = items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    knownUnitPriceVnd: item.lastKnownUnitPriceVnd,
  }));

  const quoteQuery = useQuery({
    queryKey: ['cart', 'quote', quotePayload],
    queryFn: () =>
      apiFetch<CartQuote>('/api/cart/quote', {
        method: 'POST',
        json: { items: quotePayload },
      }),
    enabled: hasHydrated,
    staleTime: 0,
  });

  useEffect(() => {
    if (quoteQuery.data) {
      applyServerQuote(quoteQuery.data);
    }
  }, [quoteQuery.data, applyServerQuote]);

  const quote = quoteQuery.data ?? null;
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
      showEmptyNotice: notice === 'empty-cart' || (hasHydrated && items.length === 0),
      isEmpty: hasHydrated && items.length === 0,
      lines,
      draftQtyById,
      subtotalVnd: quote?.subtotalVnd ?? 0,
      shippingFeeVnd: quote?.shippingFeeVnd ?? 0,
      freeShipping: quote?.freeShipping ?? false,
      totalVnd: quote?.totalVnd ?? 0,
      totalQuantity: quote?.totalQuantity ?? 0,
      pendingRemoveId,
      isLoading: !hasHydrated || (items.length > 0 && quoteQuery.isLoading),
      errorMessage: quoteQuery.error?.message ?? null,
    },
    actions: {
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
