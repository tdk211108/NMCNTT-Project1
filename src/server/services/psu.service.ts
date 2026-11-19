import 'server-only';

import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { PsuEstimate, PsuOption, PsuOptions } from '@/shared/types';
import { getDb, type DbClient } from '../db/client';
import { cpuSpecs, gpuSeries, gpuVariants, legacyCpus, products } from '../db/schema';
import { estimatePsuWattage } from '../domain/psu';
import { AppError } from '../http/errors';

const STORE_CPU_PREFIX = 'store:';
const LEGACY_CPU_PREFIX = 'legacy:';

export async function getPsuOptions(db: DbClient = getDb()): Promise<PsuOptions> {
  const [retailCpuRows, legacyCpuRows, retailGpuRows, legacyGpuRows] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        vendor: cpuSpecs.vendor,
      })
      .from(products)
      .innerJoin(cpuSpecs, eq(cpuSpecs.productId, products.id))
      .where(isNull(products.deletedAt))
      .orderBy(asc(cpuSpecs.vendor), asc(products.name)),
    db
      .select({
        id: legacyCpus.id,
        name: legacyCpus.name,
        vendor: legacyCpus.vendor,
      })
      .from(legacyCpus)
      .where(isNull(legacyCpus.deletedAt))
      .orderBy(asc(legacyCpus.vendor), asc(legacyCpus.name)),
    db
      .selectDistinct({
        id: gpuSeries.id,
        name: gpuSeries.name,
        vendor: gpuSeries.vendor,
      })
      .from(gpuSeries)
      .innerJoin(gpuVariants, eq(gpuVariants.seriesId, gpuSeries.id))
      .innerJoin(products, eq(products.id, gpuVariants.productId))
      .where(
        and(
          eq(gpuSeries.kind, 'retail'),
          isNull(gpuSeries.deletedAt),
          isNull(products.deletedAt),
        ),
      )
      .orderBy(asc(gpuSeries.vendor), asc(gpuSeries.name)),
    db
      .select({
        id: gpuSeries.id,
        name: gpuSeries.name,
        vendor: gpuSeries.vendor,
      })
      .from(gpuSeries)
      .where(and(eq(gpuSeries.kind, 'legacy'), isNull(gpuSeries.deletedAt)))
      .orderBy(asc(gpuSeries.vendor), asc(gpuSeries.name)),
  ]);

  const cpus: PsuOption[] = [
    ...retailCpuRows.map((r) => ({
      id: `${STORE_CPU_PREFIX}${r.id}`,
      name: r.name,
      vendor: r.vendor,
      source: 'store' as const,
    })),
    ...legacyCpuRows.map((r) => ({
      id: `${LEGACY_CPU_PREFIX}${r.id}`,
      name: r.name,
      vendor: r.vendor,
      source: 'legacy' as const,
    })),
  ];

  const gpus: PsuOption[] = [
    ...retailGpuRows.map((r) => ({
      id: r.id,
      name: r.name,
      vendor: r.vendor,
      source: 'store' as const,
    })),
    ...legacyGpuRows.map((r) => ({
      id: r.id,
      name: r.name,
      vendor: r.vendor,
      source: 'legacy' as const,
    })),
  ];

  return { cpus, gpus };
}

async function resolveCpuPsuEntry(
  cpuOptionId: string,
  db: DbClient,
): Promise<{ id: string; name: string; psuPowerW: number } | null> {
  if (cpuOptionId.startsWith(STORE_CPU_PREFIX)) {
    const productId = cpuOptionId.slice(STORE_CPU_PREFIX.length);
    if (!productId) return null;

    const [row] = await db
      .select({
        name: products.name,
        psuPowerW: cpuSpecs.psuPowerW,
      })
      .from(products)
      .innerJoin(cpuSpecs, eq(cpuSpecs.productId, products.id))
      .where(and(eq(products.id, productId), isNull(products.deletedAt)))
      .limit(1);

    return row ? { id: cpuOptionId, name: row.name, psuPowerW: row.psuPowerW } : null;
  }

  if (cpuOptionId.startsWith(LEGACY_CPU_PREFIX)) {
    const legacyId = cpuOptionId.slice(LEGACY_CPU_PREFIX.length);
    if (!legacyId) return null;

    const [row] = await db
      .select({
        name: legacyCpus.name,
        psuPowerW: legacyCpus.psuPowerW,
      })
      .from(legacyCpus)
      .where(and(eq(legacyCpus.id, legacyId), isNull(legacyCpus.deletedAt)))
      .limit(1);

    return row ? { id: cpuOptionId, name: row.name, psuPowerW: row.psuPowerW } : null;
  }

  return null;
}

async function resolveGpuPsuEntry(
  gpuSeriesId: string,
  db: DbClient,
): Promise<{ id: string; name: string; tbpW: number } | null> {
  const [series] = await db
    .select({
      id: gpuSeries.id,
      kind: gpuSeries.kind,
      name: gpuSeries.name,
      tbpW: gpuSeries.tbpW,
    })
    .from(gpuSeries)
    .where(and(eq(gpuSeries.id, gpuSeriesId), isNull(gpuSeries.deletedAt)))
    .limit(1);

  if (!series) {
    return null;
  }

  if (series.kind === 'retail') {
    const [activeVariant] = await db
      .select({ one: sql<number>`1` })
      .from(gpuVariants)
      .innerJoin(products, eq(products.id, gpuVariants.productId))
      .where(and(eq(gpuVariants.seriesId, series.id), isNull(products.deletedAt)))
      .limit(1);

    if (!activeVariant) {
      return null;
    }
  }

  return { id: series.id, name: series.name, tbpW: series.tbpW };
}

export async function estimatePsu(
  cpuOptionId: string,
  gpuSeriesId: string,
  db: DbClient = getDb(),
): Promise<PsuEstimate> {
  const [cpu, gpu] = await Promise.all([
    resolveCpuPsuEntry(cpuOptionId, db),
    resolveGpuPsuEntry(gpuSeriesId, db),
  ]);

  if (!cpu || !gpu) {
    throw new AppError('NOT_FOUND');
  }

  const calc = estimatePsuWattage(cpu.psuPowerW, gpu.tbpW);
  const notes: string[] = [
    VI_MESSAGES.tools.psu.noProductRecommendationNote,
    VI_MESSAGES.tools.disclaimers.estimation,
  ];
  if (calc.exceedsMaxTier) {
    notes.unshift(VI_MESSAGES.tools.psu.exceedsMaxTierNote);
  }

  return {
    cpu,
    gpu,
    baseSystemW: calc.baseSystemW,
    headroomFactor: calc.headroomFactor,
    exactW: calc.exactW,
    recommendedTierW: calc.recommendedTierW,
    exceedsMaxTier: calc.exceedsMaxTier,
    notes,
  };
}
