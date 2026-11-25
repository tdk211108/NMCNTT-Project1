import 'server-only';

import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import type { CpuVendor, GpuVendor } from '@/shared/types';
import type { DbClient } from '../db/client';
import { cpuSpecs, gpuSeries, gpuVariants, legacyCpus, products } from '../db/schema';

export const STORE_CPU_PREFIX = 'store:';
export const LEGACY_CPU_PREFIX = 'legacy:';

export interface HardwareSelectorRows {
  retailCpus: Array<{ id: string; name: string; vendor: CpuVendor; socket: string }>;
  legacyCpus: Array<{
    id: string;
    name: string;
    vendor: CpuVendor;
    socket: string | null;
    passmarkRaw: number | null;
  }>;
  retailGpus: Array<{
    id: string;
    name: string;
    vendor: GpuVendor;
    vramGb: number;
    passmarkRaw: number | null;
  }>;
  legacyGpus: Array<{
    id: string;
    name: string;
    vendor: GpuVendor;
    vramGb: number;
    passmarkRaw: number | null;
  }>;
}

export async function loadHardwareSelectorRows(
  db: DbClient,
  options: { loadCpus?: boolean; loadGpus?: boolean } = {},
): Promise<HardwareSelectorRows> {
  const loadCpus = options.loadCpus ?? true;
  const loadGpus = options.loadGpus ?? true;

  const [retailCpuRows, legacyCpuRows, retailGpuRows, legacyGpuRows] = await Promise.all([
    loadCpus
      ? db
          .select({
            id: products.id,
            name: products.name,
            vendor: cpuSpecs.vendor,
            socket: cpuSpecs.socket,
          })
          .from(products)
          .innerJoin(cpuSpecs, eq(cpuSpecs.productId, products.id))
          .where(isNull(products.deletedAt))
          .orderBy(asc(cpuSpecs.vendor), asc(products.name))
      : Promise.resolve([]),
    loadCpus
      ? db
          .select({
            id: legacyCpus.id,
            name: legacyCpus.name,
            vendor: legacyCpus.vendor,
            socket: legacyCpus.socket,
            passmarkRaw: legacyCpus.passmarkRaw,
          })
          .from(legacyCpus)
          .where(isNull(legacyCpus.deletedAt))
          .orderBy(asc(legacyCpus.vendor), asc(legacyCpus.name))
      : Promise.resolve([]),
    loadGpus
      ? db
          .selectDistinct({
            id: gpuSeries.id,
            name: gpuSeries.name,
            vendor: gpuSeries.vendor,
            vramGb: gpuSeries.vramGb,
            passmarkRaw: gpuSeries.passmarkRaw,
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
          .orderBy(asc(gpuSeries.vendor), asc(gpuSeries.name))
      : Promise.resolve([]),
    loadGpus
      ? db
          .select({
            id: gpuSeries.id,
            name: gpuSeries.name,
            vendor: gpuSeries.vendor,
            vramGb: gpuSeries.vramGb,
            passmarkRaw: gpuSeries.passmarkRaw,
          })
          .from(gpuSeries)
          .where(and(eq(gpuSeries.kind, 'legacy'), isNull(gpuSeries.deletedAt)))
          .orderBy(asc(gpuSeries.vendor), asc(gpuSeries.name))
      : Promise.resolve([]),
  ]);

  return {
    retailCpus: retailCpuRows,
    legacyCpus: legacyCpuRows,
    retailGpus: retailGpuRows,
    legacyGpus: legacyGpuRows,
  };
}

export function parsePrefixedCpuId(
  cpuOptionId: string,
): { source: 'store'; productId: string } | { source: 'legacy'; legacyId: string } | null {
  if (cpuOptionId.startsWith(STORE_CPU_PREFIX)) {
    const productId = cpuOptionId.slice(STORE_CPU_PREFIX.length);
    return productId ? { source: 'store', productId } : null;
  }
  if (cpuOptionId.startsWith(LEGACY_CPU_PREFIX)) {
    const legacyId = cpuOptionId.slice(LEGACY_CPU_PREFIX.length);
    return legacyId ? { source: 'legacy', legacyId } : null;
  }
  return null;
}

export async function hasActiveRetailGpuVariant(
  seriesId: string,
  db: DbClient,
): Promise<boolean> {
  const [activeVariant] = await db
    .select({ one: sql<number>`1` })
    .from(gpuVariants)
    .innerJoin(products, eq(products.id, gpuVariants.productId))
    .where(and(eq(gpuVariants.seriesId, seriesId), isNull(products.deletedAt)))
    .limit(1);

  return Boolean(activeVariant);
}
