import 'server-only';

import { CART_MAX_ITEMS, CART_MAX_QTY, CART_MIN_QTY } from '@/shared/constants';

export interface CartRuleItem {
  productId: string;
  quantity: number;
}

export type CartRuleValidationResult =
  | { ok: true }
  | { ok: false; code: 'EMPTY_CART' | 'CART_LIMIT_EXCEEDED' | 'VALIDATION_ERROR' };

/**
 * Validates cart item count limits, integer quantity bounds, and duplicate product IDs.
 */
export function validateCartItems(
  items: readonly CartRuleItem[],
  options?: { allowEmpty?: boolean },
): CartRuleValidationResult {
  if (!options?.allowEmpty && items.length === 0) {
    return { ok: false, code: 'EMPTY_CART' };
  }
  if (items.length > CART_MAX_ITEMS) {
    return { ok: false, code: 'CART_LIMIT_EXCEEDED' };
  }

  const seen = new Set<string>();
  for (const item of items) {
    if (
      seen.has(item.productId) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < CART_MIN_QTY ||
      item.quantity > CART_MAX_QTY
    ) {
      return { ok: false, code: 'VALIDATION_ERROR' };
    }
    seen.add(item.productId);
  }

  return { ok: true };
}

export function computeLineTotalVnd(unitPriceVnd: number, quantity: number): number {
  return unitPriceVnd * quantity;
}
