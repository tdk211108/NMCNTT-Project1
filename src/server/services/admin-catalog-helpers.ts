import 'server-only';

import { and, eq, isNull, ne, sql } from 'drizzle-orm';
import type { ImageRef } from '@/shared/schemas/admin';
import type { DbExecutor } from '../db/client';
import { cpuSpecs, gpuSeries, gpuVariants, legacyCpus, products } from '../db/schema';
import { canonicalizeFacetValue } from '../domain/name';
import { AppError, extractPgError } from '../http/errors';
import { buildPublicObjectUrl } from '../storage/supabase-storage';

export function resolveImageColumns(image: ImageRef): {
  imageUrl: string | null;
  imageStoragePath: string | null;
} {
  if (image.kind === 'none') {
    return { imageUrl: null, imageStoragePath: null };
  }
  if (image.kind === 'url') {
    return { imageUrl: image.url, imageStoragePath: null };
  }
  return {
    imageUrl: buildPublicObjectUrl(image.storagePath),
    imageStoragePath: image.storagePath,
  };
}

export function throwIfUniqueViolation(error: unknown): never {
  const pg = extractPgError(error);
  if (pg.code === '23505') {
    throw new AppError('DUPLICATE_NAME');
  }
  throw error;
}

export async function assertCpuNameUniqueAcrossRetailAndLegacy(
  tx: DbExecutor,
  name: string,
  excludeRetailProductId?: string,
  excludeLegacyCpuId?: string,
): Promise<void> {
  const lowerTarget = name.toLowerCase();

  const retailConditions = [
    eq(products.category, 'cpu'),
    isNull(products.deletedAt),
    sql`lower(${products.name}) = ${lowerTarget}`,
  ];
  if (excludeRetailProductId) {
    retailConditions.push(ne(products.id, excludeRetailProductId));
  }

  const legacyConditions = [
    isNull(legacyCpus.deletedAt),
    sql`lower(${legacyCpus.name}) = ${lowerTarget}`,
  ];
  if (excludeLegacyCpuId) {
    legacyConditions.push(ne(legacyCpus.id, excludeLegacyCpuId));
  }

  const [[retailHit], [legacyHit]] = await Promise.all([
    tx.select({ id: products.id }).from(products).where(and(...retailConditions)).limit(1),
    tx.select({ id: legacyCpus.id }).from(legacyCpus).where(and(...legacyConditions)).limit(1),
  ]);

  if (retailHit || legacyHit) {
    throw new AppError('DUPLICATE_NAME');
  }
}

export async function assertProductNameUnique(
  tx: DbExecutor,
  name: string,
  excludeProductId?: string,
): Promise<void> {
  const conditions = [
    isNull(products.deletedAt),
    sql`lower(${products.name}) = ${name.toLowerCase()}`,
  ];
  if (excludeProductId) {
    conditions.push(ne(products.id, excludeProductId));
  }
  const [hit] = await tx
    .select({ id: products.id })
    .from(products)
    .where(and(...conditions))
    .limit(1);
  if (hit) {
    throw new AppError('DUPLICATE_NAME');
  }
}

export async function assertGpuSeriesNameUnique(
  tx: DbExecutor,
  name: string,
  excludeSeriesId?: string,
): Promise<void> {
  const conditions = [
    isNull(gpuSeries.deletedAt),
    sql`lower(${gpuSeries.name}) = ${name.toLowerCase()}`,
  ];
  if (excludeSeriesId) {
    conditions.push(ne(gpuSeries.id, excludeSeriesId));
  }
  const [hit] = await tx
    .select({ id: gpuSeries.id })
    .from(gpuSeries)
    .where(and(...conditions))
    .limit(1);
  if (hit) {
    throw new AppError('DUPLICATE_NAME');
  }
}

export async function canonicalizeSocket(tx: DbExecutor, rawSocket: string): Promise<string> {
  const activeRows = await tx
    .selectDistinct({ socket: cpuSpecs.socket })
    .from(cpuSpecs)
    .innerJoin(products, eq(products.id, cpuSpecs.productId))
    .where(isNull(products.deletedAt));
  return canonicalizeFacetValue(
    rawSocket,
    activeRows.map((r) => r.socket),
  );
}

export async function canonicalizeAibBrand(tx: DbExecutor, rawBrand: string): Promise<string> {
  const activeRows = await tx
    .selectDistinct({ aibBrand: gpuVariants.aibBrand })
    .from(gpuVariants)
    .innerJoin(products, eq(products.id, gpuVariants.productId))
    .where(isNull(products.deletedAt));
  return canonicalizeFacetValue(
    rawBrand,
    activeRows.map((r) => r.aibBrand),
  );
}

export async function assertRetailGpuSeriesExists(
  tx: DbExecutor,
  seriesId: string,
): Promise<void> {
  const [series] = await tx
    .select({ id: gpuSeries.id, kind: gpuSeries.kind })
    .from(gpuSeries)
    .where(and(eq(gpuSeries.id, seriesId), isNull(gpuSeries.deletedAt)))
    .limit(1);

  if (!series || series.kind !== 'retail') {
    throw new AppError('SERIES_NOT_RETAIL');
  }
}

export function resolveOptionalPassmark(
  nextRaw: number | null,
  patchSource: string | null | undefined,
  existingSource: string | null,
): { passmarkRaw: number | null; passmarkSource: string | null } {
  if (nextRaw === null) {
    return { passmarkRaw: null, passmarkSource: null };
  }
  const candidateSource = patchSource !== undefined ? patchSource : existingSource;
  return {
    passmarkRaw: nextRaw,
    passmarkSource: candidateSource && candidateSource.length > 0 ? candidateSource : 'PassMark',
  };
}
