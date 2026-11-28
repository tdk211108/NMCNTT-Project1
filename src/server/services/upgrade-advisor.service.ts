import 'server-only';

import { and, eq, isNull } from 'drizzle-orm';
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
import { cpuSpecs, gpuSeries, gpuVariants, legacyCpus } from '../db/schema';
import { storefrontProductsV } from '../db/views';
import { pickBetterRepresentativeGpu } from '../domain/format';
import { recommendCpuUpgrades, recommendGpuUpgrades } from '../domain/upgrade-advisor';
import { AppError } from '../http/errors';
import {
  LEGACY_CPU_PREFIX,
  loadHardwareSelectorRows,
  parsePrefixedCpuId,
  STORE_CPU_PREFIX,
} from './hardware-options';

/**
 * Lists retail and legacy CPU/GPU options for the Upgrade Advisor selector,
 * keeping store/legacy IDs aligned with PSU Estimator and exposing `hasPassmark`.
 */
export async function getUpgradeOptions(
  category?: Category,
  db: DbClient = getDb(),
): Promise<UpgradeOptionsResponse> {
  const rows = await loadHardwareSelectorRows(db, {
    loadCpus: !category || category === 'cpu',
    loadGpus: !category || category === 'gpu',
  });

  const cpus: UpgradeCpuOption[] = [
    ...rows.retailCpus.map((r) => ({
      id: `${STORE_CPU_PREFIX}${r.id}`,
      name: r.name,
      vendor: r.vendor,
      source: 'store' as const,
      socket: r.socket,
      hasPassmark: true,
    })),
    ...rows.legacyCpus.map((r) => ({
      id: `${LEGACY_CPU_PREFIX}${r.id}`,
      name: r.name,
      vendor: r.vendor,
      source: 'legacy' as const,
      socket: r.socket,
      hasPassmark: r.passmarkRaw !== null,
    })),
  ];

  const gpus: UpgradeGpuOption[] = [
    ...rows.retailGpus.map((r) => ({
      id: r.id,
      name: r.name,
      vendor: r.vendor,
      source: 'store' as const,
      vramGb: r.vramGb,
      hasPassmark: r.passmarkRaw !== null,
    })),
    ...rows.legacyGpus.map((r) => ({
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
  const parsed = parsePrefixedCpuId(currentId);
  if (!parsed) {
    return null;
  }

  if (parsed.source === 'store') {
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
      .where(
        and(eq(storefrontProductsV.id, parsed.productId), eq(storefrontProductsV.category, 'cpu')),
      )
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

  const [row] = await db
    .select()
    .from(legacyCpus)
    .where(and(eq(legacyCpus.id, parsed.legacyId), isNull(legacyCpus.deletedAt)))
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

    const bestRep = repRows.reduce((best, row) => pickBetterRepresentativeGpu(best, row));
    retailProductId = bestRep.id;
    normalizedScore = bestRep.normalizedScore;
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
    VI_MESSAGES.tools.disclaimers.upgrade,
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
