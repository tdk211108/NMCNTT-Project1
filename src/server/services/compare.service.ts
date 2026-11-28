import 'server-only';

import { and, eq, inArray } from 'drizzle-orm';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { ChipVendor, CompareResponse } from '@/shared/types';
import { getDb, type DbClient } from '../db/client';
import { cpuSpecs, gpuSeries, gpuVariants } from '../db/schema';
import { storefrontProductsV } from '../db/views';
import {
  buildCompareRows,
  parseCompareIds,
  validateCompareProducts,
  type CompareProductInput,
} from '../domain/compare';
import { AppError } from '../http/errors';

export async function compareProducts(
  rawIds: string | null | undefined,
  db: DbClient = getDb(),
): Promise<CompareResponse> {
  const parsed = parseCompareIds(rawIds);
  if (!parsed.ok) {
    throw new AppError('COMPARE_INVALID', {
      details: {
        reason: parsed.reason,
        ...(parsed.invalidIds ? { invalidIds: parsed.invalidIds } : {}),
      },
    });
  }

  const [cpuRows, gpuRows] = await Promise.all([
    db
      .select({
        id: storefrontProductsV.id,
        name: storefrontProductsV.name,
        priceVnd: storefrontProductsV.priceVnd,
        imageUrl: storefrontProductsV.imageUrl,
        vendor: storefrontProductsV.vendor,
        passmarkRaw: storefrontProductsV.passmarkRaw,
        normalizedScore: storefrontProductsV.normalizedScore,
        architecture: cpuSpecs.architecture,
        socket: cpuSpecs.socket,
        processNode: cpuSpecs.processNode,
        coresTotal: cpuSpecs.coresTotal,
        threadsTotal: cpuSpecs.threadsTotal,
        pCores: cpuSpecs.pCores,
        eCores: cpuSpecs.eCores,
        baseClockGhz: cpuSpecs.baseClockGhz,
        boostClockGhz: cpuSpecs.boostClockGhz,
        cacheText: cpuSpecs.cacheText,
        l3CacheMb: cpuSpecs.l3CacheMb,
        tdpW: cpuSpecs.tdpW,
        ramSupport: cpuSpecs.ramSupport,
      })
      .from(storefrontProductsV)
      .innerJoin(cpuSpecs, eq(cpuSpecs.productId, storefrontProductsV.id))
      .where(
        and(
          eq(storefrontProductsV.category, 'cpu'),
          inArray(storefrontProductsV.id, parsed.ids),
        ),
      ),
    db
      .select({
        id: storefrontProductsV.id,
        name: storefrontProductsV.name,
        priceVnd: storefrontProductsV.priceVnd,
        imageUrl: storefrontProductsV.imageUrl,
        vendor: storefrontProductsV.vendor,
        passmarkRaw: storefrontProductsV.passmarkRaw,
        normalizedScore: storefrontProductsV.normalizedScore,
        vramGb: gpuSeries.vramGb,
        cores: gpuSeries.cores,
        tbpW: gpuSeries.tbpW,
        baseClockMhz: gpuSeries.baseClockMhz,
        boostClockMhz: gpuSeries.boostClockMhz,
        memoryType: gpuSeries.memoryType,
        busWidthBit: gpuSeries.busWidthBit,
      })
      .from(storefrontProductsV)
      .innerJoin(gpuVariants, eq(gpuVariants.productId, storefrontProductsV.id))
      .innerJoin(gpuSeries, eq(gpuSeries.id, gpuVariants.seriesId))
      .where(
        and(
          eq(storefrontProductsV.category, 'gpu'),
          inArray(storefrontProductsV.id, parsed.ids),
        ),
      ),
  ]);

  const found: CompareProductInput[] = [
    ...cpuRows.map((c) => ({
      ...c,
      category: 'cpu' as const,
      vendor: c.vendor as ChipVendor,
    })),
    ...gpuRows.map((g) => ({
      ...g,
      category: 'gpu' as const,
      vendor: g.vendor as ChipVendor,
      cores: g.cores ?? 0,
      baseClockMhz: g.baseClockMhz ?? 0,
      boostClockMhz: g.boostClockMhz ?? 0,
      memoryType: g.memoryType ?? '',
      busWidthBit: g.busWidthBit ?? 0,
    })),
  ];

  const validated = validateCompareProducts(parsed.ids, found);
  if (!validated.ok) {
    throw new AppError('COMPARE_INVALID', {
      details: {
        reason: validated.reason,
        ...(validated.invalidIds ? { invalidIds: validated.invalidIds } : {}),
      },
    });
  }

  return {
    category: validated.category,
    products: validated.products.map((p) => ({
      id: p.id,
      name: p.name,
      priceVnd: p.priceVnd,
      imageUrl: p.imageUrl ?? null,
    })),
    rows: buildCompareRows(validated.category, validated.products),
    notes: [
      VI_MESSAGES.tools.disclaimers.passmark,
      VI_MESSAGES.tools.disclaimers.compare,
    ],
  };
}
