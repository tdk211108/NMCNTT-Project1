import 'server-only';

import { and, asc, eq, isNull } from 'drizzle-orm';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type {
  Category,
  CpuVendor,
  GpuVendor,
  UpgradeCpuOption,
  UpgradeCurrentSummary,
  UpgradeGpuOption,
  UpgradeOptionsResponse,
  UpgradeQuery,
  UpgradeResponse,
} from '@/shared/types';
import { getDb, type DbClient } from '../db/client';
import { cpuSpecs, gpuSeries, gpuVariants, legacyCpus, products } from '../db/schema';
import { storefrontProductsV } from '../db/views';
import { recommendCpuUpgrades, recommendGpuUpgrades } from '../domain/upgrade-advisor';
import { AppError } from '../http/errors';

const STORE_CPU_PREFIX = 'store:';
const LEGACY_CPU_PREFIX = 'legacy:';

/**
 * Lists retail and legacy CPU/GPU options for the Upgrade Advisor selector,
 * keeping store/legacy IDs aligned with PSU Estimator and exposing `hasPassmark`.
 */
export async function getUpgradeOptions(
  category?: Category,
  db: DbClient = getDb(),
): Promise<UpgradeOptionsResponse> {
  const loadCpus = !category || category === 'cpu';
  const loadGpus = !category || category === 'gpu';

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

  const cpus: UpgradeCpuOption[] = [
    ...retailCpuRows.map((r) => ({
      id: `${STORE_CPU_PREFIX}${r.id}`,
      name: r.name,
      vendor: r.vendor,
      source: 'store' as const,
      socket: r.socket,
      hasPassmark: true,
    })),
    ...legacyCpuRows.map((r) => ({
      id: `${LEGACY_CPU_PREFIX}${r.id}`,
      name: r.name,
      vendor: r.vendor,
      source: 'legacy' as const,
      socket: r.socket,
      hasPassmark: r.passmarkRaw !== null,
    })),
  ];

  const gpus: UpgradeGpuOption[] = [
    ...retailGpuRows.map((r) => ({
      id: r.id,
      name: r.name,
      vendor: r.vendor,
      source: 'store' as const,
      vramGb: r.vramGb,
      hasPassmark: r.passmarkRaw !== null,
    })),
    ...legacyGpuRows.map((r) => ({
      id: r.id,
      name: r.name,
      vendor: r.vendor,
      source: 'legacy' as const,
      vramGb: r.vramGb,
      hasPassmark: r.passmarkRaw !== null,
    })),
  ];

  return { cpus, gpus };
}

async function resolveCurrentCpu(
  currentId: string,
  db: DbClient,
): Promise<UpgradeCurrentSummary | null> {
  if (currentId.startsWith(STORE_CPU_PREFIX)) {
    const productId = currentId.slice(STORE_CPU_PREFIX.length);
    if (!productId) return null;

    const [row] = await db
      .select({
        id: storefrontProductsV.id,
        name: storefrontProductsV.name,
        vendor: storefrontProductsV.vendor,
        socket: cpuSpecs.socket,
        coresTotal: cpuSpecs.coresTotal,
        threadsTotal: cpuSpecs.threadsTotal,
        psuPowerW: cpuSpecs.psuPowerW,
        ramSupport: cpuSpecs.ramSupport,
        passmarkRaw: storefrontProductsV.passmarkRaw,
        normalizedScore: storefrontProductsV.normalizedScore,
      })
      .from(storefrontProductsV)
      .innerJoin(cpuSpecs, eq(cpuSpecs.productId, storefrontProductsV.id))
      .where(and(eq(storefrontProductsV.id, productId), eq(storefrontProductsV.category, 'cpu')))
      .limit(1);

    if (!row) return null;
    return {
      id: currentId,
      retailProductId: row.id,
      category: 'cpu',
      source: 'store',
      name: row.name,
      vendor: row.vendor as CpuVendor,
      socket: row.socket,
      coresTotal: row.coresTotal,
      threadsTotal: row.threadsTotal,
      psuPowerW: row.psuPowerW,
      ramSupport: row.ramSupport,
      vramGb: null,
      tbpW: null,
      passmarkRaw: row.passmarkRaw,
      normalizedScore: row.normalizedScore,
      hasPassmark: true,
    };
  }

  if (currentId.startsWith(LEGACY_CPU_PREFIX)) {
    const legacyId = currentId.slice(LEGACY_CPU_PREFIX.length);
    if (!legacyId) return null;

    const [row] = await db
      .select()
      .from(legacyCpus)
      .where(and(eq(legacyCpus.id, legacyId), isNull(legacyCpus.deletedAt)))
      .limit(1);

    if (!row) return null;
    return {
      id: currentId,
      retailProductId: null,
      category: 'cpu',
      source: 'legacy',
      name: row.name,
      vendor: row.vendor,
      socket: row.socket,
      coresTotal: row.coresTotal,
      threadsTotal: row.threadsTotal,
      psuPowerW: row.psuPowerW,
      ramSupport: null,
      vramGb: null,
      tbpW: null,
      passmarkRaw: row.passmarkRaw,
      normalizedScore: null,
      hasPassmark: row.passmarkRaw !== null,
    };
  }

  return null;
}

async function resolveCurrentGpu(
  seriesId: string,
  db: DbClient,
): Promise<UpgradeCurrentSummary | null> {
  const [series] = await db
    .select()
    .from(gpuSeries)
    .where(and(eq(gpuSeries.id, seriesId), isNull(gpuSeries.deletedAt)))
    .limit(1);

  if (!series) return null;

  let retailProductId: string | null = null;
  let normalizedScore: number | null = null;

  if (series.kind === 'retail') {
    const repRows = await db
      .select({
        id: storefrontProductsV.id,
        priceVnd: storefrontProductsV.priceVnd,
        isLimitedEdition: storefrontProductsV.isLimitedEdition,
        normalizedScore: storefrontProductsV.normalizedScore,
      })
      .from(storefrontProductsV)
      .where(and(eq(storefrontProductsV.category, 'gpu'), eq(storefrontProductsV.seriesId, series.id)));

    if (repRows.length === 0) {
      return null;
    }

    repRows.sort((a, b) => {
      if (a.priceVnd !== b.priceVnd) return a.priceVnd - b.priceVnd;
      if (a.isLimitedEdition !== b.isLimitedEdition) return a.isLimitedEdition ? 1 : -1;
      return a.id.localeCompare(b.id);
    });

    retailProductId = repRows[0].id;
    normalizedScore = repRows[0].normalizedScore;
  }

  return {
    id: series.id,
    retailProductId,
    category: 'gpu',
    source: series.kind === 'retail' ? 'store' : 'legacy',
    name: series.name,
    vendor: series.vendor,
    socket: null,
    coresTotal: null,
    threadsTotal: null,
    psuPowerW: null,
    ramSupport: null,
    vramGb: series.vramGb,
    tbpW: series.tbpW,
    passmarkRaw: series.passmarkRaw,
    normalizedScore,
    hasPassmark: series.passmarkRaw !== null,
  };
}

/**
 * Resolves the user's current hardware (store or legacy), evaluates all eligible
 * active retail upgrades via pure domain logic, and returns grouped recommendations + warnings.
 */
export async function getUpgradeRecommendations(
  query: UpgradeQuery,
  db: DbClient = getDb(),
): Promise<UpgradeResponse> {
  const notes: string[] = [
    VI_MESSAGES.tools.disclaimers.passmark,
    VI_MESSAGES.tools.disclaimers.estimation,
  ];

  if (query.category === 'cpu') {
    const [current, candidateRows] = await Promise.all([
      resolveCurrentCpu(query.current, db),
      db
        .select({
          id: storefrontProductsV.id,
          name: storefrontProductsV.name,
          vendor: storefrontProductsV.vendor,
          priceVnd: storefrontProductsV.priceVnd,
          imageUrl: storefrontProductsV.imageUrl,
          socket: cpuSpecs.socket,
          coresTotal: cpuSpecs.coresTotal,
          threadsTotal: cpuSpecs.threadsTotal,
          psuPowerW: cpuSpecs.psuPowerW,
          ramSupport: cpuSpecs.ramSupport,
          passmarkRaw: storefrontProductsV.passmarkRaw,
          normalizedScore: storefrontProductsV.normalizedScore,
        })
        .from(storefrontProductsV)
        .innerJoin(cpuSpecs, eq(cpuSpecs.productId, storefrontProductsV.id))
        .where(eq(storefrontProductsV.category, 'cpu')),
    ]);

    if (!current) {
      throw new AppError('NOT_FOUND');
    }

    if (!current.hasPassmark) {
      notes.unshift(VI_MESSAGES.tools.upgrade.missingPassmarkNote);
    }

    const result = recommendCpuUpgrades({
      current,
      candidates: candidateRows.map((row) => ({
        ...row,
        vendor: row.vendor as CpuVendor,
      })),
      budgetVnd: query.budgetVnd,
      sameSocketOnly: query.sameSocketOnly,
      vendor: query.vendor as CpuVendor[] | undefined,
      sort: query.sort,
    });

    return {
      category: 'cpu',
      current,
      hasSameSocketInCatalog: result.hasSameSocketInCatalog,
      isTopTier: result.isTopTier,
      minUpgradePriceVnd: result.minUpgradePriceVnd,
      sameSocketCpus: result.sameSocketCpus,
      platformSwapCpus: result.platformSwapCpus,
      gpus: [],
      notes,
    };
  }

  const [current, variantRows] = await Promise.all([
    resolveCurrentGpu(query.current, db),
    db
      .select({
        id: storefrontProductsV.id,
        seriesId: gpuSeries.id,
        seriesName: gpuSeries.name,
        name: storefrontProductsV.name,
        aibBrand: gpuVariants.aibBrand,
        isLimitedEdition: gpuVariants.isLimitedEdition,
        vendor: gpuSeries.vendor,
        priceVnd: storefrontProductsV.priceVnd,
        imageUrl: storefrontProductsV.imageUrl,
        vramGb: gpuSeries.vramGb,
        tbpW: gpuSeries.tbpW,
        lengthMm: gpuVariants.lengthMm,
        slotThickness: gpuVariants.slotThickness,
        passmarkRaw: storefrontProductsV.passmarkRaw,
        normalizedScore: storefrontProductsV.normalizedScore,
      })
      .from(storefrontProductsV)
      .innerJoin(gpuVariants, eq(gpuVariants.productId, storefrontProductsV.id))
      .innerJoin(gpuSeries, eq(gpuSeries.id, gpuVariants.seriesId))
      .where(eq(storefrontProductsV.category, 'gpu')),
  ]);

  if (!current) {
    throw new AppError('NOT_FOUND');
  }

  if (!current.hasPassmark) {
    notes.unshift(VI_MESSAGES.tools.upgrade.missingPassmarkNote);
  }

  const result = recommendGpuUpgrades({
    current,
    variants: variantRows,
    budgetVnd: query.budgetVnd,
    vendor: query.vendor as GpuVendor[] | undefined,
    sort: query.sort,
  });

  return {
    category: 'gpu',
    current,
    hasSameSocketInCatalog: false,
    isTopTier: result.isTopTier,
    minUpgradePriceVnd: result.minUpgradePriceVnd,
    sameSocketCpus: [],
    platformSwapCpus: [],
    gpus: result.gpus,
    notes,
  };
}
