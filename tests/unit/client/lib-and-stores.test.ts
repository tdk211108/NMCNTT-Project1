import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError, apiFetch } from '@/lib/api-client';
import { formatDateTimeVi, formatExactWatts, formatNumberVi, formatVnd } from '@/lib/format';
import { matchesSearchTokens, normalizeSearchText } from '@/lib/search-filter';
import {
  createValidatedLocalPersistStorage,
  safeLocalStorage,
  safeSessionStorage,
} from '@/lib/safe-storage';
import { useCartStore } from '@/features/cart/store';
import { VI_MESSAGES } from '@/shared/messages/vi';
import { cartStoredStateSchema, compareStoredStateSchema } from '@/shared/schemas';

describe('client lib/format, lib/safe-storage and lib/api-client', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('formats VND, numbers, watts, and Asia/Ho_Chi_Minh datetimes', () => {
    expect(formatVnd(12_990_000)).toContain('12.990.000');
    expect(formatNumberVi(87.3, 1)).toBe('87,3');
    expect(formatExactWatts(581.25)).toBe('581,25 W');
    expect(formatExactWatts(450)).toBe('450 W');
    const formattedDt = formatDateTimeVi('2026-11-18T12:00:00Z');
    expect(formattedDt).toContain('19:00');
    expect(formattedDt).toMatch(/18\/11\/2026/);
    expect(formatDateTimeVi('invalid-date')).toBe('invalid-date');

    expect(normalizeSearchText('Đang bán — RTX 5070')).toBe('dang ban — rtx 5070');
    expect(matchesSearchTokens('asus 5070', ['ASUS PRIME RTX 5070 12GB', 'NVIDIA'])).toBe(true);
    expect(matchesSearchTokens('dang ban', ['Đang bán', 'AMD Ryzen 7'])).toBe(true);
    expect(matchesSearchTokens('msi 5090', ['ASUS PRIME RTX 5070 12GB', 'NVIDIA'])).toBe(false);
    expect(matchesSearchTokens('   ', ['anything'])).toBe(true);
  });

  it('provides memory fallback when browser storage is absent and resets invalid persisted JSON', () => {
    safeLocalStorage.setItem('k1', 'v1');
    expect(safeLocalStorage.getItem('k1')).toBe('v1');
    safeLocalStorage.removeItem('k1');
    expect(safeLocalStorage.getItem('k1')).toBeNull();

    safeSessionStorage.setItem('s1', 'v2');
    expect(safeSessionStorage.getItem('s1')).toBe('v2');
    safeSessionStorage.removeItem('s1');
    expect(safeSessionStorage.getItem('s1')).toBeNull();

    const cartPersist = createValidatedLocalPersistStorage(cartStoredStateSchema);
    safeLocalStorage.setItem('bad-json', '{corrupt');
    expect(cartPersist.getItem('bad-json')).toBeNull();

    safeLocalStorage.setItem(
      'bad-schema',
      JSON.stringify({ state: { items: [{ productId: 'BAD!ID', quantity: 999 }] }, version: 1 }),
    );
    expect(cartPersist.getItem('bad-schema')).toBeNull();

    const validCompare = createValidatedLocalPersistStorage(compareStoredStateSchema);
    validCompare.setItem('good-compare', {
      state: { category: 'cpu', productIds: ['cpu-a', 'cpu-b'] },
      version: 1,
    });
    expect(validCompare.getItem('good-compare')).toEqual({
      state: { category: 'cpu', productIds: ['cpu-a', 'cpu-b'] },
      version: 1,
    });
    validCompare.removeItem('good-compare');
    expect(validCompare.getItem('good-compare')).toBeNull();
  });

  it('maps aborted or timed-out fetch requests to a 408 ApiClientError in Vietnamese', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new DOMException('The operation timed out', 'TimeoutError'));

    try {
      await expect(apiFetch('/api/psu/options')).rejects.toMatchObject({
        name: 'ApiClientError',
        code: 'INTERNAL',
        status: 408,
        message: VI_MESSAGES.common.requestTimeoutError,
      } satisfies Partial<ApiClientError>);
    } finally {
      fetchSpy.mockRestore();
    }
  });
});

describe('client cart store', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('enforces cart 20-item and 100-qty caps and applies server quote diffs', () => {
    const store = useCartStore.getState();
    for (let i = 1; i <= 20; i++) {
      expect(store.addItem({ productId: `cpu-${i}`, unitPriceVnd: 1_000_000 })).toBe(true);
    }
    expect(store.addItem({ productId: 'cpu-21', unitPriceVnd: 1_000_000 })).toBe(false);

    useCartStore.getState().setQuantity('cpu-1', 100);
    expect(useCartStore.getState().addItem({ productId: 'cpu-1', unitPriceVnd: 1_000_000 })).toBe(
      false,
    );

    useCartStore.getState().applyServerQuote({
      lines: [
        {
          productId: 'cpu-1',
          name: 'CPU 1',
          category: 'cpu',
          imageUrl: null,
          unitPriceVnd: 2_000_000,
          quantity: 100,
          lineTotalVnd: 200_000_000,
          priceChange: { fromVnd: 1_000_000, toVnd: 2_000_000 },
        },
      ],
      removed: [{ productId: 'cpu-2', name: 'CPU 2' }],
      totalQuantity: 100,
      subtotalVnd: 200_000_000,
      shippingFeeVnd: 0,
      freeShipping: true,
      totalVnd: 200_000_000,
    });

    const updatedItems = useCartStore.getState().items;
    expect(updatedItems.some((i) => i.productId === 'cpu-2')).toBe(false);
    expect(updatedItems.find((i) => i.productId === 'cpu-1')?.lastKnownUnitPriceVnd).toBe(
      2_000_000,
    );
  });
});
