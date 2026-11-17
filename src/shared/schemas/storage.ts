import { z } from 'zod';
import { CART_MAX_ITEMS, CART_MAX_QTY, CART_MIN_QTY, COMPARE_MAX_ITEMS } from '../constants';
import { categorySchema, productIdSchema } from './catalog';

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

export const compareStoredStateSchema = z.object({
  category: categorySchema.nullable(),
  productIds: z.array(productIdSchema).max(COMPARE_MAX_ITEMS),
});
