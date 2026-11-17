import { z } from 'zod';
import {
  PRODUCT_ID_MAX_LEN,
  PRODUCT_ID_REGEX,
  SEARCH_SUGGEST_MAX_LEN,
  SEARCH_SUGGEST_MIN_LEN,
} from '../constants';

export const productIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(PRODUCT_ID_MAX_LEN)
  .regex(PRODUCT_ID_REGEX, 'Invalid product ID');

export const categorySchema = z.enum(['cpu', 'gpu']);
export const chipVendorSchema = z.enum(['intel', 'amd', 'nvidia']);
export const productSortSchema = z.enum(['default', 'price_asc', 'price_desc', 'score_desc']);

export const resolveProductsSchema = z.object({
  ids: z.array(productIdSchema).max(20),
});

export const searchSuggestQuerySchema = z.object({
  q: z.string().trim().min(SEARCH_SUGGEST_MIN_LEN).max(SEARCH_SUGGEST_MAX_LEN),
});

export const perfPerPriceQuerySchema = z
  .object({
    category: categorySchema,
    vendor: z.array(chipVendorSchema).optional(),
    maxPriceVnd: z.number().int().positive().optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.vendor?.length) return;
    const allowed = val.category === 'cpu' ? new Set(['intel', 'amd']) : new Set(['nvidia', 'amd']);
    for (const v of val.vendor) {
      if (!allowed.has(v)) {
        ctx.addIssue({
          code: 'custom',
          path: ['vendor'],
          message: `Vendor ${v} is not valid for category ${val.category}`,
        });
      }
    }
  });

export const psuEstimateQuerySchema = z.object({
  cpu: z.string().trim().min(1),
  gpu: z.string().trim().min(1),
});
