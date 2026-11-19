import 'server-only';

import { FREE_SHIPPING_MIN_QTY, STANDARD_SHIPPING_FEE_VND } from '@/shared/constants';

export interface CartTotals {
  totalQuantity: number;
  subtotalVnd: number;
  shippingFeeVnd: 0 | 50000;
  freeShipping: boolean;
  totalVnd: number;
}

/**
 * Computes cart totals and quantity-based shipping fee (`>= 2` items -> free shipping,
 * `1` item -> 50,000 VND, `0` items -> 0 VND).
 */
export function calculateCartTotals(
  lines: readonly { unitPriceVnd: number; quantity: number }[],
): CartTotals {
  if (lines.length === 0) {
    return {
      totalQuantity: 0,
      subtotalVnd: 0,
      shippingFeeVnd: 0,
      freeShipping: false,
      totalVnd: 0,
    };
  }

  let totalQuantity = 0;
  let subtotalVnd = 0;
  for (const line of lines) {
    totalQuantity += line.quantity;
    subtotalVnd += line.unitPriceVnd * line.quantity;
  }

  const freeShipping = totalQuantity >= FREE_SHIPPING_MIN_QTY;
  const shippingFeeVnd: 0 | 50000 = freeShipping ? 0 : STANDARD_SHIPPING_FEE_VND;

  return {
    totalQuantity,
    subtotalVnd,
    shippingFeeVnd,
    freeShipping,
    totalVnd: subtotalVnd + shippingFeeVnd,
  };
}
