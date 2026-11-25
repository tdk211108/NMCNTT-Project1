import { z } from 'zod';
import { CART_MAX_ITEMS, CART_MAX_QTY, CART_MIN_QTY } from '../constants';
import { productIdSchema } from './catalog';

export const cartStoredStateSchema = z.object({
  items: z
    .array(
      z.object({
        productId: productIdSchema,
        quantity: z.number().int().min(CART_MIN_QTY).max(CART_MAX_QTY),
        lastKnownUnitPriceVnd: z.number().int().positive().nullable(),
        addedAt: z.string(),
      }),
    )
    .max(CART_MAX_ITEMS),
});
