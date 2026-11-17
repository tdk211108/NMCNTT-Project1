import { z } from 'zod';
import { MAX_PRICE_VND, SERIES_ID_REGEX } from '../constants';
import { normalizeWhitespaceNfc } from './checkout';

export const imageRefSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('url'),
    url: z.url().refine((u) => u.startsWith('https://'), 'URL ảnh phải dùng https://'),
  }),
  z.object({
    kind: z.literal('upload'),
    storagePath: z.string().regex(/^uploads\/[0-9a-f-]{36}\.(jpg|png|webp)$/),
  }),
  z.object({ kind: z.literal('none') }),
]);

const priceVndSchema = z.number().int().positive().max(MAX_PRICE_VND);

export const adminLoginSchema = z.object({
  password: z.string().min(1).max(200),
});

export const adminCpuInputSchema = z
  .object({
    category: z.literal('cpu'),
    name: z.string().transform(normalizeWhitespaceNfc).pipe(z.string().min(2).max(150)),
    priceVnd: priceVndSchema,
    image: imageRefSchema,
    vendor: z.enum(['intel', 'amd']),
    architecture: z.string().transform(normalizeWhitespaceNfc).pipe(z.string().min(1)),
    socket: z.string().transform(normalizeWhitespaceNfc).pipe(z.string().min(2).max(20)),
    processNode: z.string().transform(normalizeWhitespaceNfc).pipe(z.string().min(1)),
    coresTotal: z.number().int().positive(),
    threadsTotal: z.number().int().positive(),
    pCores: z.number().int().positive().nullable(),
    eCores: z.number().int().nonnegative().nullable(),
    baseClockGhz: z.number().positive(),
    boostClockGhz: z.number().positive(),
    cacheText: z.string().transform(normalizeWhitespaceNfc).pipe(z.string().min(2)),
    l3CacheMb: z.number().positive(),
    tdpW: z.number().int().positive(),
    psuPowerW: z.number().int().positive(),
    ramSupport: z.string().transform(normalizeWhitespaceNfc).pipe(z.string().min(2)),
    passmarkRaw: z.number().int().positive(),
    passmarkSource: z.string().transform(normalizeWhitespaceNfc).default('PassMark'),
  })
  .superRefine((v, ctx) => {
    if (v.threadsTotal < v.coresTotal) {
      ctx.addIssue({ code: 'custom', path: ['threadsTotal'], message: 'threadsTotal >= coresTotal' });
    }
    if (v.boostClockGhz < v.baseClockGhz) {
      ctx.addIssue({ code: 'custom', path: ['boostClockGhz'], message: 'boostClockGhz >= baseClockGhz' });
    }
    if (v.psuPowerW < v.tdpW) {
      ctx.addIssue({ code: 'custom', path: ['psuPowerW'], message: 'psuPowerW >= tdpW' });
    }
    const bothNull = v.pCores === null && v.eCores === null;
    const bothSetValid =
      v.pCores !== null && v.eCores !== null && v.pCores + v.eCores === v.coresTotal;
    if (!bothNull && !bothSetValid) {
      ctx.addIssue({
        code: 'custom',
        path: ['pCores'],
        message: 'pCores and eCores must both be null or sum to coresTotal',
      });
    }
  });

export const adminGpuVariantInputSchema = z.object({
  category: z.literal('gpu'),
  seriesId: z.string().trim().regex(SERIES_ID_REGEX),
  name: z.string().transform(normalizeWhitespaceNfc).pipe(z.string().min(2).max(150)),
  aibBrand: z.string().transform(normalizeWhitespaceNfc).pipe(z.string().min(2).max(40)),
  priceVnd: priceVndSchema,
  image: imageRefSchema,
  lengthMm: z.number().int().min(100).max(450),
  slotThickness: z.number().min(1).max(5),
  hdmiCount: z.number().int().min(0).max(8),
  dpCount: z.number().int().min(0).max(8),
});

export const adminCreateProductSchema = z.discriminatedUnion('category', [
  adminCpuInputSchema,
  adminGpuVariantInputSchema,
]);

export const adminGpuSeriesInputSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('retail'),
      name: z.string().transform(normalizeWhitespaceNfc).pipe(z.string().min(2).max(100)),
      vendor: z.enum(['nvidia', 'amd']),
      vramGb: z.number().int().positive(),
      tbpW: z.number().int().positive(),
      cores: z.number().int().positive(),
      baseClockMhz: z.number().int().positive(),
      boostClockMhz: z.number().int().positive(),
      memoryType: z.string().transform(normalizeWhitespaceNfc).pipe(z.string().min(2)),
      busWidthBit: z.number().int().positive(),
      passmarkRaw: z.number().int().positive(),
      passmarkSource: z.string().transform(normalizeWhitespaceNfc).default('PassMark'),
    })
    .superRefine((v, ctx) => {
      if (v.boostClockMhz < v.baseClockMhz) {
        ctx.addIssue({
          code: 'custom',
          path: ['boostClockMhz'],
          message: 'boostClockMhz >= baseClockMhz',
        });
      }
    }),
  z.object({
    kind: z.literal('legacy'),
    name: z.string().transform(normalizeWhitespaceNfc).pipe(z.string().min(2).max(100)),
    vendor: z.enum(['nvidia', 'amd']),
    vramGb: z.number().int().positive(),
    tbpW: z.number().int().positive(),
  }),
]);

export const adminLegacyCpuInputSchema = z
  .object({
    name: z.string().transform(normalizeWhitespaceNfc).pipe(z.string().min(2).max(100)),
    vendor: z.enum(['intel', 'amd']),
    socket: z.string().transform(normalizeWhitespaceNfc).pipe(z.string().min(2).max(20)).nullable().optional(),
    coresTotal: z.number().int().positive().nullable().optional(),
    threadsTotal: z.number().int().positive().nullable().optional(),
    psuPowerW: z.number().int().positive(),
  })
  .superRefine((v, ctx) => {
    if (v.coresTotal && v.threadsTotal && v.threadsTotal < v.coresTotal) {
      ctx.addIssue({
        code: 'custom',
        path: ['threadsTotal'],
        message: 'threadsTotal >= coresTotal',
      });
    }
  });
