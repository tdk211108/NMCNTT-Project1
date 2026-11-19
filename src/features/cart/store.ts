'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { showToast } from '@/components/ui/toast-store';
import { formatVnd } from '@/lib/format';
import { createValidatedLocalPersistStorage } from '@/lib/safe-storage';
import { CART_MAX_ITEMS, CART_MAX_QTY, CART_MIN_QTY, CART_STORAGE_KEY } from '@/shared/constants';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { cartStoredStateSchema } from '@/shared/schemas';
import type { CartQuote } from '@/shared/types';

export interface CartStoredItem {
  productId: string;
  quantity: number;
  lastKnownUnitPriceVnd: number | null;
  addedAt: string;
}

interface CartStoreState {
  items: CartStoredItem[];
  hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  addItem: (input: { productId: string; name?: string; unitPriceVnd: number; quantity?: number }) => boolean;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  applyServerQuote: (quote: CartQuote) => void;
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      hasHydrated: false,
      setHasHydrated: (value) => set({ hasHydrated: value }),

      addItem({ productId, name, unitPriceVnd, quantity = 1 }) {
        const { items } = get();
        const existingIndex = items.findIndex((i) => i.productId === productId);

        if (existingIndex >= 0) {
          const current = items[existingIndex];
          if (current.quantity >= CART_MAX_QTY) {
            showToast(VI_MESSAGES.cart.maxQtyReachedToast, 'warning');
            return false;
          }
          const nextQty = Math.min(CART_MAX_QTY, current.quantity + quantity);
          if (current.quantity + quantity > CART_MAX_QTY) {
            showToast(VI_MESSAGES.cart.maxQtyReachedToast, 'warning');
          }
          const updated = items.map((item, idx) =>
            idx === existingIndex
              ? { ...item, quantity: nextQty, lastKnownUnitPriceVnd: unitPriceVnd }
              : item,
          );
          set({ items: updated });
          if (name) {
            showToast(VI_MESSAGES.catalog.addedToCartToast(name), 'success');
          }
          return true;
        }

        if (items.length >= CART_MAX_ITEMS) {
          showToast(VI_MESSAGES.cart.maxItemsReachedToast, 'warning');
          return false;
        }

        const clampedQty = Math.min(CART_MAX_QTY, Math.max(CART_MIN_QTY, quantity));
        set({
          items: [
            ...items,
            {
              productId,
              quantity: clampedQty,
              lastKnownUnitPriceVnd: unitPriceVnd,
              addedAt: new Date().toISOString(),
            },
          ],
        });
        if (name) {
          showToast(VI_MESSAGES.catalog.addedToCartToast(name), 'success');
        }
        return true;
      },

      setQuantity(productId, quantity) {
        const clamped = Math.min(CART_MAX_QTY, Math.max(CART_MIN_QTY, Math.trunc(quantity)));
        if (quantity > CART_MAX_QTY) {
          showToast(VI_MESSAGES.cart.maxQtyReachedToast, 'warning');
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId ? { ...item, quantity: clamped } : item,
          ),
        }));
      },

      removeItem(productId) {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },

      clearCart() {
        set({ items: [] });
      },

      applyServerQuote(quote) {
        for (const line of quote.lines) {
          if (line.priceChange) {
            showToast(
              VI_MESSAGES.cart.priceChangedItemToast(
                line.name,
                formatVnd(line.priceChange.fromVnd),
                formatVnd(line.priceChange.toVnd),
              ),
              'warning',
            );
          }
        }
        for (const removed of quote.removed) {
          showToast(VI_MESSAGES.cart.removedUnavailableItemToast(removed.name), 'warning');
        }

        const priceById = new Map(quote.lines.map((l) => [l.productId, l.unitPriceVnd]));
        const removedSet = new Set(quote.removed.map((r) => r.productId));

        set((state) => {
          let changed = false;
          const nextItems: CartStoredItem[] = [];

          for (const item of state.items) {
            if (removedSet.has(item.productId)) {
              changed = true;
              continue;
            }
            const nextPrice = priceById.get(item.productId);
            if (nextPrice !== undefined && item.lastKnownUnitPriceVnd !== nextPrice) {
              changed = true;
              nextItems.push({ ...item, lastKnownUnitPriceVnd: nextPrice });
            } else {
              nextItems.push(item);
            }
          }

          return changed ? { items: nextItems } : state;
        });
      },
    }),
    {
      name: CART_STORAGE_KEY,
      version: 1,
      storage: createValidatedLocalPersistStorage(cartStoredStateSchema),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
