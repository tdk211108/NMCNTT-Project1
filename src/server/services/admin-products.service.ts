import 'server-only';

import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { PRODUCT_ID_MAX_LEN } from '@/shared/constants';
import {
  findCpuCrossFieldErrors,
  type AdminCpuInput,
  type AdminCpuPatch,
  type AdminGpuVariantInput,
  type AdminGpuVariantPatch,
  type ImageRef,
} from '@/shared/schemas/admin';
import type {
  AdminCpuListItem,
  AdminGpuVariantListItem,
  AdminProductListItem,
  AdminProductPageResponse,
  Category,
} from '@/shared/types';
import { getDb, type DbClient } from '../db/client';
import { cpuSpecs, gpuSeries, gpuVariants, products } from '../db/schema';
import { allocateUniqueSlug } from '../domain/slug';
import { AppError } from '../http/errors';
import { deleteUploadedImageBestEffort } from '../storage/supabase-storage';
import {
  assertCpuNameUniqueAcrossRetailAndLegacy,
  assertProductNameUnique,
  assertRetailGpuSeriesExists,
  canonicalizeAibBrand,
  canonicalizeSocket,
  resolveImageColumns,
  throwIfUniqueViolation,
} from './admin-catalog-helpers';

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

function resolveUpdatedImage(
  patchImage: ImageRef | undefined,
  existingProduct: typeof products.$inferSelect,
): { imageUrl: string | null; imageStoragePath: string | null; staleUploadPath: string | null } {
  const nextImage = patchImage
    ? resolveImageColumns(patchImage)
    : {
        imageUrl: existingProduct.imageUrl,
        imageStoragePath: existingProduct.imageStoragePath,
      };
  const staleUploadPath =
    patchImage &&
    existingProduct.imageStoragePath &&
    existingProduct.imageStoragePath !== nextImage.imageStoragePath
      ? existingProduct.imageStoragePath
      : null;

  return { ...nextImage, staleUploadPath };
}

export async function listAdminProductsPage(
  category: Category,
  page: number,
  pageSize: number,
  db: DbClient = getDb(),
): Promise<AdminProductPageResponse> {
  if (category === 'cpu') {
    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .innerJoin(cpuSpecs, eq(cpuSpecs.productId, products.id))
      .where(isNull(products.deletedAt));

    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const offset = (safePage - 1) * pageSize;

    const [rows, socketRows] = await Promise.all([
      db
        .select({ product: products, spec: cpuSpecs })
        .from(products)
        .innerJoin(cpuSpecs, eq(cpuSpecs.productId, products.id))
        .where(isNull(products.deletedAt))
        .orderBy(asc(cpuSpecs.vendor), asc(products.name), asc(products.id))
        .limit(pageSize)
        .offset(offset),
      db
        .selectDistinct({ socket: cpuSpecs.socket })
        .from(cpuSpecs)
        .innerJoin(products, eq(products.id, cpuSpecs.productId))
        .where(isNull(products.deletedAt))
        .orderBy(asc(cpuSpecs.socket)),
    ]);

    return {
      items: rows.map((r) => buildCpuItemFromRow(r.product, r.spec)),
      total,
      page: safePage,
      pageSize,
      totalPages,
      existingSockets: socketRows.map((r) => r.socket),
      existingAibBrands: [],
    };
  }

  const gpuActiveWhere = and(isNull(products.deletedAt), isNull(gpuSeries.deletedAt));
  const [{ count: total }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .innerJoin(gpuVariants, eq(gpuVariants.productId, products.id))
    .innerJoin(gpuSeries, eq(gpuSeries.id, gpuVariants.seriesId))
    .where(gpuActiveWhere);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const offset = (safePage - 1) * pageSize;

  const [rows, aibRows] = await Promise.all([
    db
      .select({ product: products, variant: gpuVariants, series: gpuSeries })
      .from(products)
      .innerJoin(gpuVariants, eq(gpuVariants.productId, products.id))
      .innerJoin(gpuSeries, eq(gpuSeries.id, gpuVariants.seriesId))
      .where(gpuActiveWhere)
      .orderBy(asc(gpuSeries.vendor), asc(products.name), asc(products.id))
      .limit(pageSize)
      .offset(offset),
    db
      .selectDistinct({ aibBrand: gpuVariants.aibBrand })
      .from(gpuVariants)
      .innerJoin(products, eq(products.id, gpuVariants.productId))
      .innerJoin(gpuSeries, eq(gpuSeries.id, gpuVariants.seriesId))
      .where(gpuActiveWhere)
      .orderBy(asc(gpuVariants.aibBrand)),
  ]);

  return {
    items: rows.map((r) => buildGpuItemFromRow(r.product, r.variant, r.series)),
    total,
    page: safePage,
    pageSize,
    totalPages,
    existingSockets: [],
    existingAibBrands: aibRows.map((r) => r.aibBrand),
  };
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

        const nextImage = resolveUpdatedImage(patch.image, existingProduct);
        oldUploadToDelete = nextImage.staleUploadPath;

        const [updatedProduct] = await tx
          .update(products)
          .set({
            name: merged.name,
            priceVnd: merged.priceVnd,
            imageUrl: nextImage.imageUrl,
            imageStoragePath: nextImage.imageStoragePath,
            isSeed: false,
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

      const nextImage = resolveUpdatedImage(patch.image, existingProduct);
      oldUploadToDelete = nextImage.staleUploadPath;

      const [updatedProduct] = await tx
        .update(products)
        .set({
          name: nextName,
          priceVnd: patch.priceVnd ?? existingProduct.priceVnd,
          imageUrl: nextImage.imageUrl,
          imageStoragePath: nextImage.imageStoragePath,
          isSeed: false,
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
