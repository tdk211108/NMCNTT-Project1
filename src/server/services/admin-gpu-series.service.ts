import 'server-only';

import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { SERIES_ID_REGEX } from '@/shared/constants';
import type { AdminGpuSeriesInput, AdminGpuSeriesPatch } from '@/shared/schemas/admin';
import type { AdminGpuSeriesItem, GpuSeriesKind } from '@/shared/types';
import { getDb, type DbClient } from '../db/client';
import { gpuSeries, gpuVariants, products } from '../db/schema';
import { allocateNextLegacyId, allocateUniqueSlug } from '../domain/slug';
import { AppError } from '../http/errors';
import {
  assertGpuSeriesNameUnique,
  resolveOptionalPassmark,
  throwIfUniqueViolation,
} from './admin-catalog-helpers';

function buildGpuSeriesItemFromRow(
  row: typeof gpuSeries.$inferSelect,
  activeVariantCount: number,
): AdminGpuSeriesItem {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    vendor: row.vendor,
    vramGb: row.vramGb,
    tbpW: row.tbpW,
    cores: row.cores,
    baseClockMhz: row.baseClockMhz,
    boostClockMhz: row.boostClockMhz,
    memoryType: row.memoryType,
    busWidthBit: row.busWidthBit,
    passmarkRaw: row.passmarkRaw,
    passmarkSource: row.passmarkSource,
    isSeed: row.isSeed,
    activeVariantCount,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listAdminGpuSeries(
  kind?: GpuSeriesKind,
  db: DbClient = getDb(),
): Promise<AdminGpuSeriesItem[]> {
  const conditions = [isNull(gpuSeries.deletedAt)];
  if (kind) {
    conditions.push(eq(gpuSeries.kind, kind));
  }

  const [seriesRows, activeVariantCounts] = await Promise.all([
    db
      .select()
      .from(gpuSeries)
      .where(and(...conditions))
      .orderBy(asc(gpuSeries.kind), asc(gpuSeries.vendor), asc(gpuSeries.name)),
    db
      .select({
        seriesId: gpuVariants.seriesId,
        count: sql<number>`count(*)::int`,
      })
      .from(gpuVariants)
      .innerJoin(products, eq(products.id, gpuVariants.productId))
      .where(isNull(products.deletedAt))
      .groupBy(gpuVariants.seriesId),
  ]);

  const countBySeriesId = new Map(activeVariantCounts.map((r) => [r.seriesId, r.count]));
  return seriesRows.map((s) => buildGpuSeriesItemFromRow(s, countBySeriesId.get(s.id) ?? 0));
}

export async function createAdminGpuSeries(
  input: AdminGpuSeriesInput,
  db: DbClient = getDb(),
): Promise<AdminGpuSeriesItem> {
  try {
    return await db.transaction(async (tx) => {
      await assertGpuSeriesNameUnique(tx, input.name);
      const existingIds = (await tx.select({ id: gpuSeries.id }).from(gpuSeries)).map((r) => r.id);

      const id =
        input.kind === 'retail'
          ? allocateUniqueSlug('gs-', input.name, existingIds, 60)
          : allocateNextLegacyId('G', existingIds);

      if (!SERIES_ID_REGEX.test(id)) {
        throw new AppError('VALIDATION_ERROR');
      }

      const legacyPassmark =
        input.kind === 'legacy'
          ? resolveOptionalPassmark(input.passmarkRaw ?? null, input.passmarkSource, null)
          : null;

      const [created] = await tx
        .insert(gpuSeries)
        .values(
          input.kind === 'retail'
            ? {
                id,
                kind: 'retail',
                name: input.name,
                vendor: input.vendor,
                vramGb: input.vramGb,
                tbpW: input.tbpW,
                cores: input.cores,
                baseClockMhz: input.baseClockMhz,
                boostClockMhz: input.boostClockMhz,
                memoryType: input.memoryType,
                busWidthBit: input.busWidthBit,
                passmarkRaw: input.passmarkRaw,
                passmarkSource: input.passmarkSource,
                isSeed: false,
              }
            : {
                id,
                kind: 'legacy',
                name: input.name,
                vendor: input.vendor,
                vramGb: input.vramGb,
                tbpW: input.tbpW,
                passmarkRaw: legacyPassmark?.passmarkRaw ?? null,
                passmarkSource: legacyPassmark?.passmarkSource ?? null,
                isSeed: false,
              },
        )
        .returning();

      return buildGpuSeriesItemFromRow(created, 0);
    });
  } catch (error) {
    throwIfUniqueViolation(error);
  }
}

export async function updateAdminGpuSeries(
  seriesId: string,
  patch: AdminGpuSeriesPatch,
  db: DbClient = getDb(),
): Promise<AdminGpuSeriesItem> {
  try {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(gpuSeries)
        .where(and(eq(gpuSeries.id, seriesId), isNull(gpuSeries.deletedAt)))
        .limit(1);

      if (!existing) {
        throw new AppError('NOT_FOUND');
      }

      if (
        existing.kind === 'legacy' &&
        (patch.cores !== undefined ||
          patch.baseClockMhz !== undefined ||
          patch.boostClockMhz !== undefined ||
          patch.memoryType !== undefined ||
          patch.busWidthBit !== undefined)
      ) {
        throw new AppError('VALIDATION_ERROR', {
          message: 'Dòng GPU tham khảo không sử dụng thông số bán lẻ.',
        });
      }

      if (
        existing.kind === 'retail' &&
        (patch.passmarkRaw === null || patch.passmarkSource === null)
      ) {
        throw new AppError('VALIDATION_ERROR', {
          details: { fieldErrors: { passmarkRaw: ['passmarkRaw is required for retail series'] } },
        });
      }

      const nextName = patch.name ?? existing.name;
      if (patch.name !== undefined) {
        await assertGpuSeriesNameUnique(tx, nextName, seriesId);
      }

      const nextBaseClock = patch.baseClockMhz ?? existing.baseClockMhz;
      const nextBoostClock = patch.boostClockMhz ?? existing.boostClockMhz;
      if (
        existing.kind === 'retail' &&
        nextBaseClock !== null &&
        nextBoostClock !== null &&
        nextBoostClock < nextBaseClock
      ) {
        throw new AppError('VALIDATION_ERROR', {
          details: { fieldErrors: { boostClockMhz: ['boostClockMhz >= baseClockMhz'] } },
        });
      }

      const nextPassmark =
        existing.kind === 'retail'
          ? {
              passmarkRaw: patch.passmarkRaw ?? existing.passmarkRaw,
              passmarkSource: patch.passmarkSource ?? existing.passmarkSource,
            }
          : resolveOptionalPassmark(
              patch.passmarkRaw !== undefined ? patch.passmarkRaw : existing.passmarkRaw,
              patch.passmarkSource,
              existing.passmarkSource,
            );

      const [updated] = await tx
        .update(gpuSeries)
        .set({
          name: nextName,
          vendor: patch.vendor ?? existing.vendor,
          vramGb: patch.vramGb ?? existing.vramGb,
          tbpW: patch.tbpW ?? existing.tbpW,
          cores: existing.kind === 'retail' ? (patch.cores ?? existing.cores) : existing.cores,
          baseClockMhz: existing.kind === 'retail' ? nextBaseClock : existing.baseClockMhz,
          boostClockMhz: existing.kind === 'retail' ? nextBoostClock : existing.boostClockMhz,
          memoryType:
            existing.kind === 'retail'
              ? (patch.memoryType ?? existing.memoryType)
              : existing.memoryType,
          busWidthBit:
            existing.kind === 'retail'
              ? (patch.busWidthBit ?? existing.busWidthBit)
              : existing.busWidthBit,
          passmarkRaw: nextPassmark.passmarkRaw,
          passmarkSource: nextPassmark.passmarkSource,
          isSeed: false,
          updatedAt: sql`now()`,
        })
        .where(eq(gpuSeries.id, seriesId))
        .returning();

      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(gpuVariants)
        .innerJoin(products, eq(products.id, gpuVariants.productId))
        .where(and(eq(gpuVariants.seriesId, seriesId), isNull(products.deletedAt)));

      return buildGpuSeriesItemFromRow(updated, count ?? 0);
    });
  } catch (error) {
    throwIfUniqueViolation(error);
  }
}

export async function softDeleteAdminGpuSeries(
  seriesId: string,
  db: DbClient = getDb(),
): Promise<void> {
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: gpuSeries.id })
      .from(gpuSeries)
      .where(and(eq(gpuSeries.id, seriesId), isNull(gpuSeries.deletedAt)))
      .limit(1);

    if (!existing) {
      throw new AppError('NOT_FOUND');
    }

    const [activeVariant] = await tx
      .select({ productId: gpuVariants.productId })
      .from(gpuVariants)
      .innerJoin(products, eq(products.id, gpuVariants.productId))
      .where(and(eq(gpuVariants.seriesId, seriesId), isNull(products.deletedAt)))
      .limit(1);

    if (activeVariant) {
      throw new AppError('HAS_VARIANTS');
    }

    await tx
      .update(gpuSeries)
      .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
      .where(eq(gpuSeries.id, seriesId));
  });
}
