import 'server-only';

import { and, asc, eq, isNull, ne, sql } from 'drizzle-orm';
import {
  LEGACY_CPU_ID_REGEX,
  PRODUCT_ID_MAX_LEN,
  SERIES_ID_REGEX,
} from '@/shared/constants';
import {
  findCpuCrossFieldErrors,
  type AdminCpuInput,
  type AdminCpuPatch,
  type AdminGpuSeriesInput,
  type AdminGpuSeriesPatch,
  type AdminGpuVariantInput,
  type AdminGpuVariantPatch,
  type AdminLegacyCpuInput,
  type AdminLegacyCpuPatch,
  type ImageRef,
} from '@/shared/schemas/admin';
import type {
  AdminCpuListItem,
  AdminGpuSeriesItem,
  AdminGpuVariantListItem,
  AdminLegacyCpuItem,
  AdminProductListItem,
  Category,
  GpuSeriesKind,
} from '@/shared/types';
import { getDb, type DbClient, type DbExecutor } from '../db/client';
import { cpuSpecs, gpuSeries, gpuVariants, legacyCpus, products } from '../db/schema';
import { canonicalizeFacetValue } from '../domain/name';
import { allocateNextLegacyId, allocateUniqueSlug } from '../domain/slug';
import { AppError, extractPgError } from '../http/errors';
import {
  buildPublicObjectUrl,
  deleteUploadedImageBestEffort,
} from '../storage/supabase-storage';

function resolveImageColumns(image: ImageRef): {
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

function throwIfUniqueViolation(error: unknown): never {
  const pg = extractPgError(error);
  if (pg.code === '23505') {
    throw new AppError('DUPLICATE_NAME');
  }
  throw error;
}

async function assertCpuNameUniqueAcrossRetailAndLegacy(
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

async function assertProductNameUnique(
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
  const [hit] = await tx.select({ id: products.id }).from(products).where(and(...conditions)).limit(1);
  if (hit) {
    throw new AppError('DUPLICATE_NAME');
  }
}

async function assertGpuSeriesNameUnique(
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
  const [hit] = await tx.select({ id: gpuSeries.id }).from(gpuSeries).where(and(...conditions)).limit(1);
  if (hit) {
    throw new AppError('DUPLICATE_NAME');
  }
}

async function canonicalizeSocket(tx: DbExecutor, rawSocket: string): Promise<string> {
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

async function canonicalizeAibBrand(tx: DbExecutor, rawBrand: string): Promise<string> {
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

async function assertRetailGpuSeriesExists(tx: DbExecutor, seriesId: string): Promise<void> {
  const [series] = await tx
    .select({ id: gpuSeries.id, kind: gpuSeries.kind })
    .from(gpuSeries)
    .where(and(eq(gpuSeries.id, seriesId), isNull(gpuSeries.deletedAt)))
    .limit(1);

  if (!series || series.kind !== 'retail') {
    throw new AppError('SERIES_NOT_RETAIL');
  }
}

function resolveOptionalPassmark(
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

function buildCpuItemFromRow(
  product: typeof products.$inferSelect,
  spec: typeof cpuSpecs.$inferSelect,
): AdminCpuListItem {
  return {
    id: product.id,
    category: 'cpu',
    name: product.name,
    priceVnd: product.priceVnd,
    imageUrl: product.imageUrl,
    imageStoragePath: product.imageStoragePath,
    isSeed: product.isSeed,
    updatedAt: product.updatedAt.toISOString(),
    vendor: spec.vendor,
    architecture: spec.architecture,
    socket: spec.socket,
    processNode: spec.processNode,
    coresTotal: spec.coresTotal,
    threadsTotal: spec.threadsTotal,
    pCores: spec.pCores,
    eCores: spec.eCores,
    baseClockGhz: spec.baseClockGhz,
    boostClockGhz: spec.boostClockGhz,
    cacheText: spec.cacheText,
    l3CacheMb: spec.l3CacheMb,
    tdpW: spec.tdpW,
    psuPowerW: spec.psuPowerW,
    ramSupport: spec.ramSupport,
    passmarkRaw: spec.passmarkRaw,
    passmarkSource: spec.passmarkSource,
  };
}

function buildGpuItemFromRow(
  product: typeof products.$inferSelect,
  variant: typeof gpuVariants.$inferSelect,
  series: typeof gpuSeries.$inferSelect,
): AdminGpuVariantListItem {
  return {
    id: product.id,
    category: 'gpu',
    name: product.name,
    priceVnd: product.priceVnd,
    imageUrl: product.imageUrl,
    imageStoragePath: product.imageStoragePath,
    isSeed: product.isSeed,
    updatedAt: product.updatedAt.toISOString(),
    seriesId: variant.seriesId,
    aibBrand: variant.aibBrand,
    isLimitedEdition: variant.isLimitedEdition,
    lengthMm: variant.lengthMm,
    slotThickness: variant.slotThickness,
    hdmiCount: variant.hdmiCount,
    dpCount: variant.dpCount,
    series: {
      id: series.id,
      name: series.name,
      vendor: series.vendor,
      vramGb: series.vramGb,
      tbpW: series.tbpW,
      cores: series.cores ?? 0,
      baseClockMhz: series.baseClockMhz ?? 0,
      boostClockMhz: series.boostClockMhz ?? 0,
      memoryType: series.memoryType ?? '',
      busWidthBit: series.busWidthBit ?? 0,
      passmarkRaw: series.passmarkRaw ?? 0,
      passmarkSource: series.passmarkSource ?? 'PassMark',
    },
  };
}

export async function listAdminProducts(
  category?: Category,
  db: DbClient = getDb(),
): Promise<AdminProductListItem[]> {
  const loadCpus = !category || category === 'cpu';
  const loadGpus = !category || category === 'gpu';

  const [cpuRows, gpuRows] = await Promise.all([
    loadCpus
      ? db
          .select({ product: products, spec: cpuSpecs })
          .from(products)
          .innerJoin(cpuSpecs, eq(cpuSpecs.productId, products.id))
          .where(isNull(products.deletedAt))
          .orderBy(asc(cpuSpecs.vendor), asc(products.name))
      : Promise.resolve([]),
    loadGpus
      ? db
          .select({ product: products, variant: gpuVariants, series: gpuSeries })
          .from(products)
          .innerJoin(gpuVariants, eq(gpuVariants.productId, products.id))
          .innerJoin(gpuSeries, eq(gpuSeries.id, gpuVariants.seriesId))
          .where(and(isNull(products.deletedAt), isNull(gpuSeries.deletedAt)))
          .orderBy(asc(gpuSeries.vendor), asc(products.name))
      : Promise.resolve([]),
  ]);

  return [
    ...cpuRows.map((r) => buildCpuItemFromRow(r.product, r.spec)),
    ...gpuRows.map((r) => buildGpuItemFromRow(r.product, r.variant, r.series)),
  ];
}

export async function createAdminProduct(
  input: AdminCpuInput | AdminGpuVariantInput,
  db: DbClient = getDb(),
): Promise<AdminProductListItem> {
  try {
    return await db.transaction(async (tx) => {
      const existingIds = (await tx.select({ id: products.id }).from(products)).map((r) => r.id);
      const imageCols = resolveImageColumns(input.image);

      if (input.category === 'cpu') {
        await assertProductNameUnique(tx, input.name);
        await assertCpuNameUniqueAcrossRetailAndLegacy(tx, input.name);
        const socket = await canonicalizeSocket(tx, input.socket);
        const id = allocateUniqueSlug('cpu-', input.name, existingIds, PRODUCT_ID_MAX_LEN);

        const [product] = await tx
          .insert(products)
          .values({
            id,
            category: 'cpu',
            name: input.name,
            priceVnd: input.priceVnd,
            imageUrl: imageCols.imageUrl,
            imageStoragePath: imageCols.imageStoragePath,
            isSeed: false,
          })
          .returning();

        const [spec] = await tx
          .insert(cpuSpecs)
          .values({
            productId: id,
            category: 'cpu',
            vendor: input.vendor,
            architecture: input.architecture,
            socket,
            processNode: input.processNode,
            coresTotal: input.coresTotal,
            threadsTotal: input.threadsTotal,
            pCores: input.pCores,
            eCores: input.eCores,
            baseClockGhz: input.baseClockGhz,
            boostClockGhz: input.boostClockGhz,
            cacheText: input.cacheText,
            l3CacheMb: input.l3CacheMb,
            tdpW: input.tdpW,
            psuPowerW: input.psuPowerW,
            ramSupport: input.ramSupport,
            passmarkRaw: input.passmarkRaw,
            passmarkSource: input.passmarkSource,
          })
          .returning();

        return buildCpuItemFromRow(product, spec);
      }

      await assertProductNameUnique(tx, input.name);
      await assertRetailGpuSeriesExists(tx, input.seriesId);
      const aibBrand = await canonicalizeAibBrand(tx, input.aibBrand);
      const id = allocateUniqueSlug('gpu-', input.name, existingIds, PRODUCT_ID_MAX_LEN);

      const [product] = await tx
        .insert(products)
        .values({
          id,
          category: 'gpu',
          name: input.name,
          priceVnd: input.priceVnd,
          imageUrl: imageCols.imageUrl,
          imageStoragePath: imageCols.imageStoragePath,
          isSeed: false,
        })
        .returning();

      const [variant] = await tx
        .insert(gpuVariants)
        .values({
          productId: id,
          category: 'gpu',
          seriesId: input.seriesId,
          seriesKind: 'retail',
          aibBrand,
          isLimitedEdition: input.isLimitedEdition ?? false,
          lengthMm: input.lengthMm,
          slotThickness: input.slotThickness,
          hdmiCount: input.hdmiCount,
          dpCount: input.dpCount,
        })
        .returning();

      const [series] = await tx
        .select()
        .from(gpuSeries)
        .where(eq(gpuSeries.id, input.seriesId))
        .limit(1);

      return buildGpuItemFromRow(product, variant, series);
    });
  } catch (error) {
    throwIfUniqueViolation(error);
  }
}

export async function updateAdminProduct(
  productId: string,
  rawPatch: AdminCpuPatch | AdminGpuVariantPatch,
  db: DbClient = getDb(),
  deleteOldUpload: (storagePath: string | null) => Promise<void> = deleteUploadedImageBestEffort,
): Promise<AdminProductListItem> {
  let oldUploadToDelete: string | null = null;

  try {
    const result = await db.transaction(async (tx) => {
      const [existingProduct] = await tx
        .select()
        .from(products)
        .where(and(eq(products.id, productId), isNull(products.deletedAt)))
        .limit(1);

      if (!existingProduct) {
        throw new AppError('NOT_FOUND');
      }

      if (existingProduct.category === 'cpu') {
        const patch = rawPatch as AdminCpuPatch;
        const [existingSpec] = await tx
          .select()
          .from(cpuSpecs)
          .where(eq(cpuSpecs.productId, productId))
          .limit(1);

        if (!existingSpec) {
          throw new AppError('NOT_FOUND');
        }

        const merged = {
          name: patch.name ?? existingProduct.name,
          priceVnd: patch.priceVnd ?? existingProduct.priceVnd,
          vendor: patch.vendor ?? existingSpec.vendor,
          architecture: patch.architecture ?? existingSpec.architecture,
          socket: patch.socket ? await canonicalizeSocket(tx, patch.socket) : existingSpec.socket,
          processNode: patch.processNode ?? existingSpec.processNode,
          coresTotal: patch.coresTotal ?? existingSpec.coresTotal,
          threadsTotal: patch.threadsTotal ?? existingSpec.threadsTotal,
          pCores: patch.pCores !== undefined ? patch.pCores : existingSpec.pCores,
          eCores: patch.eCores !== undefined ? patch.eCores : existingSpec.eCores,
          baseClockGhz: patch.baseClockGhz ?? existingSpec.baseClockGhz,
          boostClockGhz: patch.boostClockGhz ?? existingSpec.boostClockGhz,
          cacheText: patch.cacheText ?? existingSpec.cacheText,
          l3CacheMb: patch.l3CacheMb ?? existingSpec.l3CacheMb,
          tdpW: patch.tdpW ?? existingSpec.tdpW,
          psuPowerW: patch.psuPowerW ?? existingSpec.psuPowerW,
          ramSupport: patch.ramSupport ?? existingSpec.ramSupport,
          passmarkRaw: patch.passmarkRaw ?? existingSpec.passmarkRaw,
          passmarkSource: patch.passmarkSource ?? existingSpec.passmarkSource,
        };

        const crossIssues = findCpuCrossFieldErrors(merged);
        if (crossIssues.length > 0) {
          const fieldErrors: Record<string, string[]> = {};
          for (const issue of crossIssues) {
            fieldErrors[issue.path] = [...(fieldErrors[issue.path] ?? []), issue.message];
          }
          throw new AppError('VALIDATION_ERROR', { details: { fieldErrors } });
        }

        if (patch.name !== undefined) {
          await assertProductNameUnique(tx, merged.name, productId);
          await assertCpuNameUniqueAcrossRetailAndLegacy(tx, merged.name, productId);
        }

        const nextImage = patch.image
          ? resolveImageColumns(patch.image)
          : {
              imageUrl: existingProduct.imageUrl,
              imageStoragePath: existingProduct.imageStoragePath,
            };

        if (
          patch.image &&
          existingProduct.imageStoragePath &&
          existingProduct.imageStoragePath !== nextImage.imageStoragePath
        ) {
          oldUploadToDelete = existingProduct.imageStoragePath;
        }

        const [updatedProduct] = await tx
          .update(products)
          .set({
            name: merged.name,
            priceVnd: merged.priceVnd,
            imageUrl: nextImage.imageUrl,
            imageStoragePath: nextImage.imageStoragePath,
            updatedAt: sql`now()`,
          })
          .where(eq(products.id, productId))
          .returning();

        const [updatedSpec] = await tx
          .update(cpuSpecs)
          .set({
            vendor: merged.vendor,
            architecture: merged.architecture,
            socket: merged.socket,
            processNode: merged.processNode,
            coresTotal: merged.coresTotal,
            threadsTotal: merged.threadsTotal,
            pCores: merged.pCores,
            eCores: merged.eCores,
            baseClockGhz: merged.baseClockGhz,
            boostClockGhz: merged.boostClockGhz,
            cacheText: merged.cacheText,
            l3CacheMb: merged.l3CacheMb,
            tdpW: merged.tdpW,
            psuPowerW: merged.psuPowerW,
            ramSupport: merged.ramSupport,
            passmarkRaw: merged.passmarkRaw,
            passmarkSource: merged.passmarkSource,
          })
          .where(eq(cpuSpecs.productId, productId))
          .returning();

        return buildCpuItemFromRow(updatedProduct, updatedSpec);
      }

      const patch = rawPatch as AdminGpuVariantPatch;
      const [existingVariant] = await tx
        .select()
        .from(gpuVariants)
        .where(eq(gpuVariants.productId, productId))
        .limit(1);

      if (!existingVariant) {
        throw new AppError('NOT_FOUND');
      }

      const nextName = patch.name ?? existingProduct.name;
      if (patch.name !== undefined) {
        await assertProductNameUnique(tx, nextName, productId);
      }

      const nextSeriesId = patch.seriesId ?? existingVariant.seriesId;
      if (patch.seriesId !== undefined) {
        await assertRetailGpuSeriesExists(tx, nextSeriesId);
      }

      const nextAibBrand = patch.aibBrand
        ? await canonicalizeAibBrand(tx, patch.aibBrand)
        : existingVariant.aibBrand;

      const nextImage = patch.image
        ? resolveImageColumns(patch.image)
        : {
            imageUrl: existingProduct.imageUrl,
            imageStoragePath: existingProduct.imageStoragePath,
          };

      if (
        patch.image &&
        existingProduct.imageStoragePath &&
        existingProduct.imageStoragePath !== nextImage.imageStoragePath
      ) {
        oldUploadToDelete = existingProduct.imageStoragePath;
      }

      const [updatedProduct] = await tx
        .update(products)
        .set({
          name: nextName,
          priceVnd: patch.priceVnd ?? existingProduct.priceVnd,
          imageUrl: nextImage.imageUrl,
          imageStoragePath: nextImage.imageStoragePath,
          updatedAt: sql`now()`,
        })
        .where(eq(products.id, productId))
        .returning();

      const [updatedVariant] = await tx
        .update(gpuVariants)
        .set({
          seriesId: nextSeriesId,
          aibBrand: nextAibBrand,
          isLimitedEdition: patch.isLimitedEdition ?? existingVariant.isLimitedEdition,
          lengthMm: patch.lengthMm ?? existingVariant.lengthMm,
          slotThickness: patch.slotThickness ?? existingVariant.slotThickness,
          hdmiCount: patch.hdmiCount ?? existingVariant.hdmiCount,
          dpCount: patch.dpCount ?? existingVariant.dpCount,
        })
        .where(eq(gpuVariants.productId, productId))
        .returning();

      const [series] = await tx
        .select()
        .from(gpuSeries)
        .where(eq(gpuSeries.id, updatedVariant.seriesId))
        .limit(1);

      return buildGpuItemFromRow(updatedProduct, updatedVariant, series);
    });

    if (oldUploadToDelete) {
      await deleteOldUpload(oldUploadToDelete);
    }
    return result;
  } catch (error) {
    throwIfUniqueViolation(error);
  }
}

export async function getAdminProductCategory(
  productId: string,
  db: DbClient = getDb(),
): Promise<Category> {
  const [row] = await db
    .select({ category: products.category })
    .from(products)
    .where(and(eq(products.id, productId), isNull(products.deletedAt)))
    .limit(1);
  if (!row) {
    throw new AppError('NOT_FOUND');
  }
  return row.category;
}

export async function softDeleteAdminProduct(
  productId: string,
  db: DbClient = getDb(),
): Promise<void> {
  const updated = await db
    .update(products)
    .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
    .where(and(eq(products.id, productId), isNull(products.deletedAt)))
    .returning({ id: products.id });

  if (updated.length === 0) {
    throw new AppError('NOT_FOUND');
  }
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

  return seriesRows.map((s) => ({
    id: s.id,
    kind: s.kind,
    name: s.name,
    vendor: s.vendor,
    vramGb: s.vramGb,
    tbpW: s.tbpW,
    cores: s.cores,
    baseClockMhz: s.baseClockMhz,
    boostClockMhz: s.boostClockMhz,
    memoryType: s.memoryType,
    busWidthBit: s.busWidthBit,
    passmarkRaw: s.passmarkRaw,
    passmarkSource: s.passmarkSource,
    isSeed: s.isSeed,
    activeVariantCount: countBySeriesId.get(s.id) ?? 0,
    updatedAt: s.updatedAt.toISOString(),
  }));
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

      return {
        id: created.id,
        kind: created.kind,
        name: created.name,
        vendor: created.vendor,
        vramGb: created.vramGb,
        tbpW: created.tbpW,
        cores: created.cores,
        baseClockMhz: created.baseClockMhz,
        boostClockMhz: created.boostClockMhz,
        memoryType: created.memoryType,
        busWidthBit: created.busWidthBit,
        passmarkRaw: created.passmarkRaw,
        passmarkSource: created.passmarkSource,
        isSeed: created.isSeed,
        activeVariantCount: 0,
        updatedAt: created.updatedAt.toISOString(),
      };
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
          baseClockMhz:
            existing.kind === 'retail' ? nextBaseClock : existing.baseClockMhz,
          boostClockMhz:
            existing.kind === 'retail' ? nextBoostClock : existing.boostClockMhz,
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
          updatedAt: sql`now()`,
        })
        .where(eq(gpuSeries.id, seriesId))
        .returning();

      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(gpuVariants)
        .innerJoin(products, eq(products.id, gpuVariants.productId))
        .where(and(eq(gpuVariants.seriesId, seriesId), isNull(products.deletedAt)));

      return {
        id: updated.id,
        kind: updated.kind,
        name: updated.name,
        vendor: updated.vendor,
        vramGb: updated.vramGb,
        tbpW: updated.tbpW,
        cores: updated.cores,
        baseClockMhz: updated.baseClockMhz,
        boostClockMhz: updated.boostClockMhz,
        memoryType: updated.memoryType,
        busWidthBit: updated.busWidthBit,
        passmarkRaw: updated.passmarkRaw,
        passmarkSource: updated.passmarkSource,
        isSeed: updated.isSeed,
        activeVariantCount: count ?? 0,
        updatedAt: updated.updatedAt.toISOString(),
      };
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

export async function listAdminLegacyCpus(db: DbClient = getDb()): Promise<AdminLegacyCpuItem[]> {
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
