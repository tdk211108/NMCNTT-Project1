import { describe, expect, it } from 'vitest';
import { computeLineTotalVnd, validateCartItems } from '@/server/domain/cart-rules';
import { calculateCartTotals } from '@/server/domain/shipping';
import { generateOrderId, mapBytesToOrderAlphabet } from '@/server/domain/order-id';
import { ORDER_ID_ALPHABET, ORDER_ID_REGEX } from '@/shared/constants';

describe('domain/cart-rules, shipping, order-id', () => {
  it('validates cart item rules', () => {
    expect(validateCartItems([])).toEqual({ ok: false, code: 'EMPTY_CART' });
    expect(validateCartItems([], { allowEmpty: true })).toEqual({ ok: true });

    const tooMany = Array.from({ length: 21 }, (_, i) => ({ productId: `p-${i}`, quantity: 1 }));
    expect(validateCartItems(tooMany)).toEqual({ ok: false, code: 'CART_LIMIT_EXCEEDED' });

    expect(
      validateCartItems([
        { productId: 'cpu-1', quantity: 1 },
        { productId: 'cpu-1', quantity: 2 },
      ]),
    ).toEqual({ ok: false, code: 'VALIDATION_ERROR' });

    expect(validateCartItems([{ productId: 'cpu-1', quantity: 0 }])).toEqual({
      ok: false,
      code: 'VALIDATION_ERROR',
    });
    expect(validateCartItems([{ productId: 'cpu-1', quantity: 101 }])).toEqual({
      ok: false,
      code: 'VALIDATION_ERROR',
    });
    expect(validateCartItems([{ productId: 'cpu-1', quantity: 1.5 }])).toEqual({
      ok: false,
      code: 'VALIDATION_ERROR',
    });

    expect(validateCartItems([{ productId: 'cpu-1', quantity: 100 }])).toEqual({ ok: true });
    expect(computeLineTotalVnd(5_000_000, 3)).toBe(15_000_000);
  });

  it('computes quantity-based shipping fees', () => {
    expect(calculateCartTotals([])).toEqual({
      totalQuantity: 0,
      subtotalVnd: 0,
      shippingFeeVnd: 0,
      freeShipping: false,
      totalVnd: 0,
    });

    expect(calculateCartTotals([{ unitPriceVnd: 10_000_000, quantity: 1 }])).toEqual({
      totalQuantity: 1,
      subtotalVnd: 10_000_000,
      shippingFeeVnd: 50_000,
      freeShipping: false,
      totalVnd: 10_050_000,
    });

    expect(calculateCartTotals([{ unitPriceVnd: 10_000_000, quantity: 2 }])).toEqual({
      totalQuantity: 2,
      subtotalVnd: 20_000_000,
      shippingFeeVnd: 0,
      freeShipping: true,
      totalVnd: 20_000_000,
    });

    expect(
      calculateCartTotals([
        { unitPriceVnd: 5_000_000, quantity: 1 },
        { unitPriceVnd: 7_000_000, quantity: 1 },
      ]),
    ).toEqual({
      totalQuantity: 2,
      subtotalVnd: 12_000_000,
      shippingFeeVnd: 0,
      freeShipping: true,
      totalVnd: 12_000_000,
    });
  });

  it('generates unbiased order IDs matching PC- format', () => {
    const id = generateOrderId();
    expect(id).toMatch(ORDER_ID_REGEX);

    const allSymbols = Uint8Array.from({ length: 32 }, (_, i) => i + 32);
    expect(mapBytesToOrderAlphabet(allSymbols)).toBe(ORDER_ID_ALPHABET);

    const deterministic = generateOrderId(() => Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
    expect(deterministic).toBe('PC-0123456789');
  });
});
