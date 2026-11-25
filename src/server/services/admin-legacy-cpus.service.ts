import 'server-only';

import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { LEGACY_CPU_ID_REGEX } from '@/shared/constants';
import type { AdminLegacyCpuInput, AdminLegacyCpuPatch } from '@/shared/schemas/admin';
import type { AdminLegacyCpuItem } from '@/shared/types';
import { getDb, type DbClient } from '../db/client';
import { legacyCpus } from '../db/schema';
import { allocateNextLegacyId } from '../domain/slug';
import { AppError } from '../http/errors';
import {
  assertCpuNameUniqueAcrossRetailAndLegacy,
  resolveOptionalPassmark,
  throwIfUniqueViolation,
} from './admin-catalog-helpers';

function buildLegacyCpuItemFromRow(r: typeof legacyCpus.$inferSelect): AdminLegacyCpuItem {
  return {
    id: r.id,
    name: r.name,
    vendor: r.vendor,
    socket: r.socket,
    coresTotal: r.coresTotal,
    threadsTotal: r.threadsTotal,
    psuPowerW: r.psuPowerW,
    passmarkRaw: r.passmarkRaw,
    passmarkSource: r.passmarkSource,
    isSeed: r.isSeed,
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function listAdminLegacyCpus(
  db: DbClient = getDb(),
): Promise<AdminLegacyCpuItem[]> {
  const rows = await db
    .select()
    .from(legacyCpus)
    .where(isNull(legacyCpus.deletedAt))
    .orderBy(asc(legacyCpus.vendor), asc(legacyCpus.name));

  return rows.map(buildLegacyCpuItemFromRow);
}

export async function createAdminLegacyCpu(
  input: AdminLegacyCpuInput,
  db: DbClient = getDb(),
): Promise<AdminLegacyCpuItem> {
  try {
    return await db.transaction(async (tx) => {
      await assertCpuNameUniqueAcrossRetailAndLegacy(tx, input.name);
      const existingIds = (await tx.select({ id: legacyCpus.id }).from(legacyCpus)).map((r) => r.id);
      const id = allocateNextLegacyId('C', existingIds);

      if (!LEGACY_CPU_ID_REGEX.test(id)) {
        throw new AppError('VALIDATION_ERROR');
      }

      const passmark = resolveOptionalPassmark(
        input.passmarkRaw ?? null,
        input.passmarkSource,
        null,
      );

      const [created] = await tx
        .insert(legacyCpus)
        .values({
          id,
          name: input.name,
          vendor: input.vendor,
          socket: input.socket ?? null,
          coresTotal: input.coresTotal ?? null,
          threadsTotal: input.threadsTotal ?? null,
          psuPowerW: input.psuPowerW,
          passmarkRaw: passmark.passmarkRaw,
          passmarkSource: passmark.passmarkSource,
          isSeed: false,
        })
        .returning();

      return buildLegacyCpuItemFromRow(created);
    });
  } catch (error) {
    throwIfUniqueViolation(error);
  }
}

export async function updateAdminLegacyCpu(
  legacyId: string,
  patch: AdminLegacyCpuPatch,
  db: DbClient = getDb(),
): Promise<AdminLegacyCpuItem> {
  try {
    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(legacyCpus)
        .where(and(eq(legacyCpus.id, legacyId), isNull(legacyCpus.deletedAt)))
        .limit(1);

      if (!existing) {
        throw new AppError('NOT_FOUND');
      }

      const nextName = patch.name ?? existing.name;
      if (patch.name !== undefined) {
        await assertCpuNameUniqueAcrossRetailAndLegacy(tx, nextName, undefined, legacyId);
      }

      const nextCores = patch.coresTotal !== undefined ? patch.coresTotal : existing.coresTotal;
      const nextThreads =
        patch.threadsTotal !== undefined ? patch.threadsTotal : existing.threadsTotal;

      if (nextCores && nextThreads && nextThreads < nextCores) {
        throw new AppError('VALIDATION_ERROR', {
          details: { fieldErrors: { threadsTotal: ['threadsTotal >= coresTotal'] } },
        });
      }

      const nextPassmark = resolveOptionalPassmark(
        patch.passmarkRaw !== undefined ? patch.passmarkRaw : existing.passmarkRaw,
        patch.passmarkSource,
        existing.passmarkSource,
      );

      const [updated] = await tx
        .update(legacyCpus)
        .set({
          name: nextName,
          vendor: patch.vendor ?? existing.vendor,
          socket: patch.socket !== undefined ? patch.socket : existing.socket,
          coresTotal: nextCores,
          threadsTotal: nextThreads,
          psuPowerW: patch.psuPowerW ?? existing.psuPowerW,
          passmarkRaw: nextPassmark.passmarkRaw,
          passmarkSource: nextPassmark.passmarkSource,
          isSeed: false,
          updatedAt: sql`now()`,
        })
        .where(eq(legacyCpus.id, legacyId))
        .returning();

      return buildLegacyCpuItemFromRow(updated);
    });
  } catch (error) {
    throwIfUniqueViolation(error);
  }
}

export async function softDeleteAdminLegacyCpu(
  legacyId: string,
  db: DbClient = getDb(),
): Promise<void> {
  const updated = await db
    .update(legacyCpus)
    .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
    .where(and(eq(legacyCpus.id, legacyId), isNull(legacyCpus.deletedAt)))
    .returning({ id: legacyCpus.id });

  if (updated.length === 0) {
    throw new AppError('NOT_FOUND');
  }
}
