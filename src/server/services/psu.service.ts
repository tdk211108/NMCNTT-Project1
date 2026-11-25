import 'server-only';

import { and, eq, isNull } from 'drizzle-orm';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { PsuEstimate, PsuOption, PsuOptions } from '@/shared/types';
import { getDb, type DbClient } from '../db/client';
import { cpuSpecs, gpuSeries, legacyCpus, products } from '../db/schema';
import { estimatePsuWattage } from '../domain/psu';
import { AppError } from '../http/errors';
import {
  hasActiveRetailGpuVariant,
  LEGACY_CPU_PREFIX,
  loadHardwareSelectorRows,
  parsePrefixedCpuId,
  STORE_CPU_PREFIX,
} from './hardware-options';

export async function getPsuOptions(db: DbClient = getDb()): Promise<PsuOptions> {
  const rows = await loadHardwareSelectorRows(db);

  const cpus: PsuOption[] = [
    ...rows.retailCpus.map((r) => ({
      id: `${STORE_CPU_PREFIX}${r.id}`,
      name: r.name,
      vendor: r.vendor,
      source: 'store' as const,
    })),
    ...rows.legacyCpus.map((r) => ({
      id: `${LEGACY_CPU_PREFIX}${r.id}`,
      name: r.name,
      vendor: r.vendor,
      source: 'legacy' as const,
    })),
  ];

  const gpus: PsuOption[] = [
    ...rows.retailGpus.map((r) => ({
      id: r.id,
      name: r.name,
      vendor: r.vendor,
      source: 'store' as const,
    })),
    ...rows.legacyGpus.map((r) => ({
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
  const parsed = parsePrefixedCpuId(cpuOptionId);
  if (!parsed) {
    return null;
  }

  if (parsed.source === 'store') {
    const [row] = await db
      .select({
        name: products.name,
        psuPowerW: cpuSpecs.psuPowerW,
      })
      .from(products)
      .innerJoin(cpuSpecs, eq(cpuSpecs.productId, products.id))
      .where(and(eq(products.id, parsed.productId), isNull(products.deletedAt)))
      .limit(1);

    return row ? { id: cpuOptionId, name: row.name, psuPowerW: row.psuPowerW } : null;
  }

  const [row] = await db
    .select({
      name: legacyCpus.name,
      psuPowerW: legacyCpus.psuPowerW,
    })
    .from(legacyCpus)
    .where(and(eq(legacyCpus.id, parsed.legacyId), isNull(legacyCpus.deletedAt)))
    .limit(1);

  return row ? { id: cpuOptionId, name: row.name, psuPowerW: row.psuPowerW } : null;
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

  if (series.kind === 'retail' && !(await hasActiveRetailGpuVariant(series.id, db))) {
    return null;
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
