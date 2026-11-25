import 'server-only';

import {
  UPGRADE_CPU_POWER_WARN_DELTA_W,
  UPGRADE_GPU_LARGE_LENGTH_MM,
  UPGRADE_GPU_TBP_HIGH_DELTA_W,
  UPGRADE_GPU_TBP_LOW_DELTA_W,
  UPGRADE_GPU_THICK_SLOT,
  UPGRADE_MAX_RESULTS_PER_GROUP,
  UPGRADE_MIN_UPLIFT_PCT,
} from '@/shared/constants';
import type {
  CpuVendor,
  GpuVendor,
  UpgradeCpuItem,
  UpgradeCurrentSummary,
  UpgradeGpuItem,
  UpgradeSort,
  UpgradeWarning,
} from '@/shared/types';
import { pickBetterRepresentativeGpu } from './format';
import { calculatePerfPerPrice } from './scoring';

export type RamPlatform = 'ddr4_only' | 'ddr5_only' | 'ddr4_and_ddr5' | 'unknown';

export interface UpgradeCpuCandidateInput {
  id: string;
  name: string;
  vendor: CpuVendor;
  priceVnd: number;
  imageUrl: string | null;
  socket: string;
  coresTotal: number;
  threadsTotal: number;
  psuPowerW: number;
  ramSupport: string;
  passmarkRaw: number;
  normalizedScore: number;
}

export interface UpgradeGpuVariantCandidateInput {
  id: string;
  seriesId: string;
  seriesName: string;
  name: string;
  aibBrand: string;
  isLimitedEdition: boolean;
  vendor: GpuVendor;
  priceVnd: number;
  imageUrl: string | null;
  vramGb: number;
  tbpW: number;
  lengthMm: number;
  slotThickness: number;
  passmarkRaw: number;
  normalizedScore: number;
}

export interface RecommendCpuUpgradesInput {
  current: UpgradeCurrentSummary;
  candidates: readonly UpgradeCpuCandidateInput[];
  budgetVnd?: number;
  sameSocketOnly?: boolean;
  vendor?: readonly CpuVendor[];
  sort?: UpgradeSort;
}

export interface RecommendCpuUpgradesOutput {
  hasSameSocketInCatalog: boolean;
  isTopTier: boolean;
  minUpgradePriceVnd: number | null;
  sameSocketCpus: UpgradeCpuItem[];
  platformSwapCpus: UpgradeCpuItem[];
}

export interface RecommendGpuUpgradesInput {
  current: UpgradeCurrentSummary;
  variants: readonly UpgradeGpuVariantCandidateInput[];
  budgetVnd?: number;
  vendor?: readonly GpuVendor[];
  sort?: UpgradeSort;
}

export interface RecommendGpuUpgradesOutput {
  isTopTier: boolean;
  minUpgradePriceVnd: number | null;
  gpus: UpgradeGpuItem[];
}

/**
 * Classifies RAM generation constraints from explicit `ramSupport` strings first,
 * then falls back to known CoreRaster socket families for legacy CPUs.
 */
export function classifyRamPlatform(
  socket: string | null,
  ramSupport: string | null,
): RamPlatform {
  if (ramSupport) {
    const upper = ramSupport.toUpperCase();
    const hasDdr4 = upper.includes('DDR4');
    const hasDdr5 = upper.includes('DDR5');
    if (hasDdr4 && hasDdr5) return 'ddr4_and_ddr5';
    if (hasDdr5) return 'ddr5_only';
    if (hasDdr4) return 'ddr4_only';
  }
  const normalizedSocket = socket ? socket.toUpperCase() : '';
  if (normalizedSocket === 'AM4' || normalizedSocket === 'LGA1200' || normalizedSocket === 'LGA1151') {
    return 'ddr4_only';
  }
  if (normalizedSocket === 'LGA1700') {
    return 'ddr4_and_ddr5';
  }
  if (normalizedSocket === 'AM5' || normalizedSocket === 'LGA1851') {
    return 'ddr5_only';
  }
  return 'unknown';
}

function evaluateUplift(
  currentPassmark: number | null,
  candidatePassmark: number,
): { eligible: boolean; upliftPct: number | null } {
  if (currentPassmark === null) {
    return { eligible: true, upliftPct: null };
  }
  const rawPct = ((candidatePassmark - currentPassmark) / currentPassmark) * 100;
  return {
    eligible: rawPct >= UPGRADE_MIN_UPLIFT_PCT,
    upliftPct: Math.round(rawPct),
  };
}

export function buildCpuUpgradeWarnings(
  current: UpgradeCurrentSummary,
  candidate: UpgradeCpuCandidateInput,
): { sameSocket: boolean; warnings: UpgradeWarning[] } {
  const sameSocket =
    current.socket !== null && current.socket.toUpperCase() === candidate.socket.toUpperCase();
  const warnings: UpgradeWarning[] = [];

  if (!sameSocket) {
    warnings.push({
      code: 'socket_change',
      severity: 'high',
      fromLabel: current.socket ?? '',
      toLabel: candidate.socket,
    });
    const currentRam = classifyRamPlatform(current.socket, current.ramSupport);
    const nextRam = classifyRamPlatform(candidate.socket, candidate.ramSupport);
    if (currentRam === 'ddr4_only' && nextRam === 'ddr5_only') {
      warnings.push({ code: 'ram_ddr5_required', severity: 'high' });
    } else if (currentRam === 'ddr4_only' && nextRam === 'ddr4_and_ddr5') {
      warnings.push({ code: 'ram_ddr4_or_ddr5', severity: 'medium' });
    }
  }

  if (current.psuPowerW !== null) {
    const powerDelta = candidate.psuPowerW - current.psuPowerW;
    if (powerDelta >= UPGRADE_CPU_POWER_WARN_DELTA_W) {
      warnings.push({
        code: 'cpu_power_increase',
        severity: 'medium',
        deltaValue: powerDelta,
        fromWatt: current.psuPowerW,
        toWatt: candidate.psuPowerW,
      });
    }
  }

  return { sameSocket, warnings };
}

export function buildGpuUpgradeWarnings(
  current: UpgradeCurrentSummary,
  candidateSeries: { tbpW: number; vramGb: number },
  rep: { lengthMm: number; slotThickness: number },
): UpgradeWarning[] {
  const warnings: UpgradeWarning[] = [];

  if (current.tbpW !== null) {
    const tbpDelta = candidateSeries.tbpW - current.tbpW;
    if (tbpDelta >= UPGRADE_GPU_TBP_HIGH_DELTA_W) {
      warnings.push({
        code: 'gpu_tbp_high',
        severity: 'high',
        deltaValue: tbpDelta,
        fromWatt: current.tbpW,
        toWatt: candidateSeries.tbpW,
      });
    } else if (tbpDelta >= UPGRADE_GPU_TBP_LOW_DELTA_W) {
      warnings.push({
        code: 'gpu_tbp_moderate',
        severity: 'low',
        deltaValue: tbpDelta,
      });
    }
  }

  if (
    rep.lengthMm >= UPGRADE_GPU_LARGE_LENGTH_MM ||
    rep.slotThickness >= UPGRADE_GPU_THICK_SLOT
  ) {
    warnings.push({
      code: 'gpu_large_size',
      severity: 'medium',
      lengthMm: rep.lengthMm,
      slotThickness: rep.slotThickness,
    });
  }

  if (current.vramGb !== null) {
    const vramDelta = candidateSeries.vramGb - current.vramGb;
    if (vramDelta < 0) {
      warnings.push({
        code: 'gpu_vram_decrease',
        severity: 'medium',
        fromVramGb: current.vramGb,
        toVramGb: candidateSeries.vramGb,
      });
    } else if (vramDelta > 0) {
      warnings.push({
        code: 'gpu_vram_increase',
        severity: 'positive',
        deltaValue: vramDelta,
        fromVramGb: current.vramGb,
        toVramGb: candidateSeries.vramGb,
      });
    }
  }

  return warnings;
}

function getMetricForUpliftSort(item: {
  upliftPct: number | null;
  score: { normalized: number | null };
}): number {
  return item.upliftPct ?? item.score.normalized!;
}

function sortUpgradeList<
  T extends {
    upliftPct: number | null;
    score: { normalized: number | null };
    perfPerPrice: number;
    priceVnd: number;
  },
>(items: readonly T[], sort: UpgradeSort): T[] {
  const copy = [...items];
  switch (sort) {
    case 'uplift_desc':
      return copy.sort((a, b) => getMetricForUpliftSort(b) - getMetricForUpliftSort(a));
    case 'perf_per_price_desc':
      return copy.sort((a, b) => b.perfPerPrice - a.perfPerPrice);
    case 'price_asc':
      return copy.sort((a, b) => a.priceVnd - b.priceVnd);
    case 'recommended':
    default:
      return copy.sort(
        (a, b) =>
          getMetricForUpliftSort(b) - getMetricForUpliftSort(a) ||
          b.perfPerPrice - a.perfPerPrice,
      );
  }
}

/**
 * Evaluates all active retail CPUs against the user's current CPU, enforces the +10%
 * PassMark uplift floor when baseline data exists, separates same-socket upgrades
 * from platform-swap upgrades, and generates compatibility warnings.
 */
export function recommendCpuUpgrades(
  input: RecommendCpuUpgradesInput,
): RecommendCpuUpgradesOutput {
  const { current, budgetVnd, sameSocketOnly = false, sort = 'recommended' } = input;
  const vendorFilter = input.vendor?.length ? new Set(input.vendor) : null;

  const catalogEligible: UpgradeCpuItem[] = [];
  for (const candidate of input.candidates) {
    if (candidate.id === current.retailProductId) continue;

    const { eligible, upliftPct } = evaluateUplift(current.passmarkRaw, candidate.passmarkRaw);
    if (!eligible) continue;

    const { sameSocket, warnings } = buildCpuUpgradeWarnings(current, candidate);
    catalogEligible.push({
      id: candidate.id,
      name: candidate.name,
      vendor: candidate.vendor,
      priceVnd: candidate.priceVnd,
      imageUrl: candidate.imageUrl,
      socket: candidate.socket,
      coresTotal: candidate.coresTotal,
      threadsTotal: candidate.threadsTotal,
      psuPowerW: candidate.psuPowerW,
      ramSupport: candidate.ramSupport,
      score: { raw: candidate.passmarkRaw, normalized: candidate.normalizedScore },
      perfPerPrice: calculatePerfPerPrice(candidate.normalizedScore, candidate.priceVnd),
      upliftPct,
      sameSocket,
      warnings,
      psuHref: `/tools/psu?cpu=${encodeURIComponent(`store:${candidate.id}`)}`,
      compareHref: current.retailProductId
        ? `/compare?ids=${encodeURIComponent(`${current.retailProductId},${candidate.id}`)}`
        : null,
    });
  }

  const isTopTier = current.hasPassmark && catalogEligible.length === 0;
  const hasSameSocketInCatalog = catalogEligible.some((item) => item.sameSocket);

  const scopeFiltered = catalogEligible.filter((item) => {
    if (vendorFilter && !vendorFilter.has(item.vendor)) return false;
    if (sameSocketOnly && !item.sameSocket) return false;
    return true;
  });

  const minUpgradePriceVnd =
    scopeFiltered.length > 0 ? Math.min(...scopeFiltered.map((item) => item.priceVnd)) : null;

  const budgetFiltered =
    budgetVnd !== undefined
      ? scopeFiltered.filter((item) => item.priceVnd <= budgetVnd)
      : scopeFiltered;

  const sameSocketCpus = sortUpgradeList(
    budgetFiltered.filter((item) => item.sameSocket),
    sort,
  ).slice(0, UPGRADE_MAX_RESULTS_PER_GROUP);
  const platformSwapCpus = sameSocketOnly
    ? []
    : sortUpgradeList(
        budgetFiltered.filter((item) => !item.sameSocket),
        sort,
      ).slice(0, UPGRADE_MAX_RESULTS_PER_GROUP);

  return {
    hasSameSocketInCatalog,
    isTopTier,
    minUpgradePriceVnd,
    sameSocketCpus,
    platformSwapCpus,
  };
}

/**
 * Evaluates active retail GPU series against the user's current GPU series,
 * picking the best-priced non-limited AIB card as representative per series and
 * annotating TBP, physical case fit, and VRAM warnings.
 */
export function recommendGpuUpgrades(
  input: RecommendGpuUpgradesInput,
): RecommendGpuUpgradesOutput {
  const { current, budgetVnd, sort = 'recommended' } = input;
  const vendorFilter = input.vendor?.length ? new Set(input.vendor) : null;

  const groupedBySeries = new Map<
    string,
    { rep: UpgradeGpuVariantCandidateInput; count: number }
  >();
  for (const variant of input.variants) {
    if (variant.seriesId === current.id) continue;
    const entry = groupedBySeries.get(variant.seriesId);
    if (!entry) {
      groupedBySeries.set(variant.seriesId, { rep: variant, count: 1 });
    } else {
      entry.count += 1;
      entry.rep = pickBetterRepresentativeGpu(entry.rep, variant);
    }
  }

  const catalogEligible: UpgradeGpuItem[] = [];
  for (const { rep, count } of groupedBySeries.values()) {
    const { eligible, upliftPct } = evaluateUplift(current.passmarkRaw, rep.passmarkRaw);
    if (!eligible) continue;

    const warnings = buildGpuUpgradeWarnings(
      current,
      { tbpW: rep.tbpW, vramGb: rep.vramGb },
      { lengthMm: rep.lengthMm, slotThickness: rep.slotThickness },
    );

    catalogEligible.push({
      id: rep.id,
      seriesId: rep.seriesId,
      seriesName: rep.seriesName,
      name: rep.name,
      aibBrand: rep.aibBrand,
      vendor: rep.vendor,
      priceVnd: rep.priceVnd,
      imageUrl: rep.imageUrl,
      vramGb: rep.vramGb,
      tbpW: rep.tbpW,
      lengthMm: rep.lengthMm,
      slotThickness: rep.slotThickness,
      variantCount: count,
      score: { raw: rep.passmarkRaw, normalized: rep.normalizedScore },
      perfPerPrice: calculatePerfPerPrice(rep.normalizedScore, rep.priceVnd),
      upliftPct,
      warnings,
      psuHref: `/tools/psu?gpu=${encodeURIComponent(rep.seriesId)}`,
      compareHref: current.retailProductId
        ? `/compare?ids=${encodeURIComponent(`${current.retailProductId},${rep.id}`)}`
        : null,
      aibVariantsHref: `/gpu?series=${encodeURIComponent(rep.seriesId)}`,
    });
  }

  const isTopTier = current.hasPassmark && catalogEligible.length === 0;
  const vendorFiltered = vendorFilter
    ? catalogEligible.filter((item) => vendorFilter.has(item.vendor))
    : catalogEligible;

  const minUpgradePriceVnd =
    vendorFiltered.length > 0 ? Math.min(...vendorFiltered.map((item) => item.priceVnd)) : null;

  const budgetFiltered =
    budgetVnd !== undefined
      ? vendorFiltered.filter((item) => item.priceVnd <= budgetVnd)
      : vendorFiltered;

  return {
    isTopTier,
    minUpgradePriceVnd,
    gpus: sortUpgradeList(budgetFiltered, sort).slice(0, UPGRADE_MAX_RESULTS_PER_GROUP),
  };
}
