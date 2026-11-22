import { z } from 'zod';
import {
  COMBO_MAX_BUDGET_VND,
  COMBO_MIN_BUDGET_VND,
  MAX_PRICE_VND,
  PRODUCT_ID_MAX_LEN,
  PRODUCT_ID_REGEX,
  SEARCH_SUGGEST_MAX_LEN,
  SEARCH_SUGGEST_MIN_LEN,
  SERIES_ID_REGEX,
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

function addInvalidVendorIssues(
  category: 'cpu' | 'gpu',
  vendors: readonly string[] | undefined,
  ctx: z.RefinementCtx,
): void {
  if (!vendors?.length) return;
  const allowed = category === 'cpu' ? new Set(['intel', 'amd']) : new Set(['nvidia', 'amd']);
  for (const v of vendors) {
    if (!allowed.has(v)) {
      ctx.addIssue({
        code: 'custom',
        path: ['vendor'],
        message: `Vendor ${v} is not valid for category ${category}`,
      });
    }
  }
}

export const productListQuerySchema = z
  .object({
    category: categorySchema,
    vendor: z.array(chipVendorSchema).optional(),
    priceMin: z.number().int().nonnegative().optional(),
    priceMax: z.number().int().positive().optional(),
    vramGb: z.array(z.number().int().positive()).optional(),
    aibBrand: z.array(z.string().trim().min(1).max(40)).optional(),
    socket: z.array(z.string().trim().min(1).max(20)).optional(),
    seriesId: z.string().trim().regex(SERIES_ID_REGEX).optional(),
    limitedEdition: z.boolean().optional(),
    sort: productSortSchema.optional(),
    q: z.string().trim().max(SEARCH_SUGGEST_MAX_LEN).optional(),
  })
  .superRefine((val, ctx) => {
    addInvalidVendorIssues(val.category, val.vendor, ctx);
    if (val.priceMin !== undefined && val.priceMax !== undefined && val.priceMin > val.priceMax) {
      ctx.addIssue({
        code: 'custom',
        path: ['priceMin'],
        message: 'priceMin must be less than or equal to priceMax',
      });
    }
    if (
      val.category === 'cpu' &&
      (val.vramGb?.length || val.aibBrand?.length || val.seriesId || val.limitedEdition)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: val.vramGb?.length
          ? ['vramGb']
          : val.aibBrand?.length
            ? ['aibBrand']
            : val.seriesId
              ? ['seriesId']
              : ['limitedEdition'],
        message: 'GPU filters are not allowed for CPU category',
      });
    }
    if (val.category === 'gpu' && val.socket?.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['socket'],
        message: 'Socket filter is not allowed for GPU category',
      });
    }
  });

export const perfPerPriceQuerySchema = z
  .object({
    category: categorySchema,
    vendor: z.array(chipVendorSchema).optional(),
    maxPriceVnd: z.number().int().positive().optional(),
  })
  .superRefine((val, ctx) => {
    addInvalidVendorIssues(val.category, val.vendor, ctx);
  });

export const psuEstimateQuerySchema = z.object({
  cpu: z.string().trim().min(1),
  gpu: z.string().trim().min(1),
});

export const comboPurposeSchema = z.enum(['gaming_aaa', 'esport', 'work_ai']);

export const comboQuerySchema = z.object({
  budgetVnd: z.number().int().min(COMBO_MIN_BUDGET_VND).max(COMBO_MAX_BUDGET_VND),
  purpose: comboPurposeSchema.default('gaming_aaa'),
  cpuVendor: z.enum(['intel', 'amd']).optional(),
  gpuVendor: z.enum(['nvidia', 'amd']).optional(),
});

export const upgradeSortSchema = z.enum([
  'recommended',
  'uplift_desc',
  'perf_per_price_desc',
  'price_asc',
]);

export const upgradeQuerySchema = z
  .object({
    category: categorySchema,
    current: z.string().trim().min(1).max(120),
    budgetVnd: z.number().int().positive().max(MAX_PRICE_VND).optional(),
    sameSocketOnly: z.boolean().optional(),
    vendor: z.array(chipVendorSchema).optional(),
    sort: upgradeSortSchema.optional(),
  })
  .superRefine((val, ctx) => {
    addInvalidVendorIssues(val.category, val.vendor, ctx);
  });
