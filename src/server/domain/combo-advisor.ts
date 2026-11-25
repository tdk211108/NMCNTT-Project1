import 'server-only';

import {
  COMBO_STRETCH_MAX_RATIO,
  COMBO_STRETCH_MIN_SCORE_GAIN_RATIO,
} from '@/shared/constants';
import type {
  ComboCpuSummary,
  ComboGpuSummary,
  ComboPurpose,
  ComboRecommendation,
  ComboReferencePair,
  ComboRole,
  CpuVendor,
  GpuVendor,
} from '@/shared/types';
import { roundTo, selectRepresentativeGpuList } from './format';
import { estimatePsuWattage } from './psu';
import { calculatePerfPerPrice } from './scoring';

export interface ComboCpuInput {
  id: string;
  name: string;
  vendor: CpuVendor;
  socket: string;
  coresTotal: number;
  threadsTotal: number;
  psuPowerW: number;
  priceVnd: number;
  imageUrl: string | null;
  passmarkRaw: number;
  normalizedScore: number;
}

export interface ComboGpuVariantInput {
  id: string;
  seriesId: string;
  seriesName: string;
  name: string;
  vendor: GpuVendor;
  aibBrand: string;
  isLimitedEdition: boolean;
  vramGb: number;
  tbpW: number;
  priceVnd: number;
  imageUrl: string | null;
  passmarkRaw: number;
  normalizedScore: number;
}

export interface ComboPurposeProfile {
  targetGpuShare: number;
  targetCpuShare: number;
  gpuWeight: number;
  cpuWeight: number;
}

export const COMBO_PURPOSE_PROFILES: Record<ComboPurpose, ComboPurposeProfile> = {
  gaming_aaa: {
    targetGpuShare: 0.65,
    targetCpuShare: 0.35,
    gpuWeight: 0.65,
    cpuWeight: 0.35,
  },
  esport: {
    targetGpuShare: 0.5,
    targetCpuShare: 0.5,
    gpuWeight: 0.5,
    cpuWeight: 0.5,
  },
  work_ai: {
    targetGpuShare: 0.55,
    targetCpuShare: 0.45,
    gpuWeight: 0.55,
    cpuWeight: 0.45,
  },
};

interface EvaluatedPair {
  cpu: ComboCpuSummary;
  gpu: ComboGpuSummary;
  totalPriceVnd: number;
  budgetDeltaVnd: number;
  isOverBudget: boolean;
  overBudgetPct: number | null;
  actualGpuSharePct: number;
  actualCpuSharePct: number;
  compositeScore: number;
  rankScore: number;
  perfPerPrice: number;
  psu: ComboRecommendation['psu'];
}

export interface RecommendCombosInput {
  budgetVnd: number;
  purpose: ComboPurpose;
  cpus: readonly ComboCpuInput[];
  gpus: readonly ComboGpuVariantInput[];
}

export interface RecommendCombosOutput {
  targetGpuSharePct: number;
  targetCpuSharePct: number;
  combos: ComboRecommendation[];
  minAvailableComboPriceVnd: number | null;
  cheapestReferenceCombo: ComboReferencePair | null;
}

function computePurposeBonus(gpu: ComboGpuVariantInput, purpose: ComboPurpose): number {
  if (purpose === 'work_ai') {
    const vramBonus =
      gpu.vramGb >= 24 ? 10 : gpu.vramGb >= 16 ? 6 : gpu.vramGb >= 12 ? 3 : 0;
    const cudaBonus = gpu.vendor === 'nvidia' ? 8 : 0;
    return vramBonus + cudaBonus;
  }
  if (purpose === 'gaming_aaa') {
    return gpu.vramGb >= 16 ? 3 : gpu.vramGb >= 12 ? 1.5 : 0;
  }
  return 0;
}

/**
 * Collapses active AIB GPU variants down to one value-optimal representative per series
 * (cheapest active price, breaking exact price ties against Limited Edition SKUs).
 */
export function selectRepresentativeGpus(
  variants: readonly ComboGpuVariantInput[],
): ComboGpuVariantInput[] {
  return selectRepresentativeGpuList(variants);
}

function evaluatePair(
  cpu: ComboCpuInput,
  gpu: ComboGpuVariantInput,
  budgetVnd: number,
  purpose: ComboPurpose,
): EvaluatedPair {
  const profile = COMBO_PURPOSE_PROFILES[purpose];
  const totalPriceVnd = cpu.priceVnd + gpu.priceVnd;
  const actualGpuShare = gpu.priceVnd / totalPriceVnd;
  const actualGpuSharePct = Math.round(actualGpuShare * 100);
  const actualCpuSharePct = 100 - actualGpuSharePct;

  const compositeScore = roundTo(
    gpu.normalizedScore * profile.gpuWeight +
      cpu.normalizedScore * profile.cpuWeight +
      computePurposeBonus(gpu, purpose),
    2,
  );
  const balanceFactor = Math.max(
    0.75,
    1 - Math.abs(actualGpuShare - profile.targetGpuShare) * 0.55,
  );
  const utilFactor = 0.88 + 0.12 * Math.min(1, totalPriceVnd / budgetVnd);
  const rankScore = compositeScore * balanceFactor * utilFactor;
  const perfPerPrice = calculatePerfPerPrice(compositeScore, totalPriceVnd);

  const budgetDeltaVnd = budgetVnd - totalPriceVnd;
  const isOverBudget = totalPriceVnd > budgetVnd;
  const overBudgetPct = isOverBudget
    ? Math.max(0.1, roundTo(((totalPriceVnd - budgetVnd) / budgetVnd) * 100, 1))
    : null;

  const psuCalc = estimatePsuWattage(cpu.psuPowerW, gpu.tbpW);

  return {
    cpu: {
      id: cpu.id,
      name: cpu.name,
      vendor: cpu.vendor,
      socket: cpu.socket,
      coresTotal: cpu.coresTotal,
      threadsTotal: cpu.threadsTotal,
      psuPowerW: cpu.psuPowerW,
      priceVnd: cpu.priceVnd,
      imageUrl: cpu.imageUrl,
      score: { raw: cpu.passmarkRaw, normalized: cpu.normalizedScore },
    },
    gpu: {
      id: gpu.id,
      seriesId: gpu.seriesId,
      seriesName: gpu.seriesName,
      name: gpu.name,
      vendor: gpu.vendor,
      aibBrand: gpu.aibBrand,
      vramGb: gpu.vramGb,
      tbpW: gpu.tbpW,
      priceVnd: gpu.priceVnd,
      imageUrl: gpu.imageUrl,
      score: { raw: gpu.passmarkRaw, normalized: gpu.normalizedScore },
    },
    totalPriceVnd,
    budgetDeltaVnd,
    isOverBudget,
    overBudgetPct,
    actualGpuSharePct,
    actualCpuSharePct,
    compositeScore,
    rankScore,
    perfPerPrice,
    psu: {
      exactW: psuCalc.exactW,
      recommendedTierW: psuCalc.recommendedTierW,
      exceedsMaxTier: psuCalc.exceedsMaxTier,
      psuHref: `/tools/psu?cpu=${encodeURIComponent(`store:${cpu.id}`)}&gpu=${encodeURIComponent(gpu.seriesId)}`,
    },
  };
}

function pickDistinctPair(
  sortedCandidates: readonly EvaluatedPair[],
  usedSeriesIds: Set<string>,
  usedCpuIds: Set<string>,
): EvaluatedPair | null {
  const strict = sortedCandidates.find(
    (c) => !usedSeriesIds.has(c.gpu.seriesId) && !usedCpuIds.has(c.cpu.id),
  );
  if (strict) {
    return strict;
  }
  return sortedCandidates.find((c) => !usedSeriesIds.has(c.gpu.seriesId)) ?? null;
}

function toRecommendation(
  pair: EvaluatedPair,
  rank: number,
  role: ComboRole,
): ComboRecommendation {
  return {
    rank,
    role,
    cpu: pair.cpu,
    gpu: pair.gpu,
    totalPriceVnd: pair.totalPriceVnd,
    budgetDeltaVnd: pair.budgetDeltaVnd,
    isOverBudget: pair.isOverBudget,
    overBudgetPct: pair.overBudgetPct,
    actualGpuSharePct: pair.actualGpuSharePct,
    actualCpuSharePct: pair.actualCpuSharePct,
    compositeScore: pair.compositeScore,
    perfPerPrice: pair.perfPerPrice,
    psu: pair.psu,
  };
}

/**
 * Allocates budget across active CPU and GPU series combinations according to usage purpose,
 * allows up to +5% stretch for meaningful performance jumps, and returns up to 3 distinct combos.
 */
export function recommendCombos(input: RecommendCombosInput): RecommendCombosOutput {
  const profile = COMBO_PURPOSE_PROFILES[input.purpose];
  const targetGpuSharePct = Math.round(profile.targetGpuShare * 100);
  const targetCpuSharePct = 100 - targetGpuSharePct;

  const repGpus = selectRepresentativeGpus(input.gpus);
  if (input.cpus.length === 0 || repGpus.length === 0) {
    return {
      targetGpuSharePct,
      targetCpuSharePct,
      combos: [],
      minAvailableComboPriceVnd: null,
      cheapestReferenceCombo: null,
    };
  }

  const cheapestCpu = [...input.cpus].sort((a, b) => a.priceVnd - b.priceVnd)[0];
  const cheapestGpu = [...repGpus].sort((a, b) => a.priceVnd - b.priceVnd)[0];
  const minAvailableComboPriceVnd = cheapestCpu.priceVnd + cheapestGpu.priceVnd;
  const cheapestReferenceCombo: ComboReferencePair = {
    cpuId: cheapestCpu.id,
    cpuName: cheapestCpu.name,
    gpuId: cheapestGpu.id,
    gpuSeriesId: cheapestGpu.seriesId,
    gpuName: cheapestGpu.name,
    totalPriceVnd: minAvailableComboPriceVnd,
  };

  const maxCeilingVnd = Math.floor(input.budgetVnd * (1 + COMBO_STRETCH_MAX_RATIO));
  const inBudget: EvaluatedPair[] = [];
  const stretch: EvaluatedPair[] = [];

  for (const cpu of input.cpus) {
    for (const gpu of repGpus) {
      if (cpu.priceVnd + gpu.priceVnd > maxCeilingVnd) continue;
      const evaluated = evaluatePair(cpu, gpu, input.budgetVnd, input.purpose);
      if (evaluated.isOverBudget) {
        stretch.push(evaluated);
      } else {
        inBudget.push(evaluated);
      }
    }
  }

  if (inBudget.length === 0 && stretch.length === 0) {
    return {
      targetGpuSharePct,
      targetCpuSharePct,
      combos: [],
      minAvailableComboPriceVnd,
      cheapestReferenceCombo,
    };
  }

  const byRankScore = (a: EvaluatedPair, b: EvaluatedPair) => b.rankScore - a.rankScore;
  const inBudgetByRank = [...inBudget].sort(byRankScore);
  const stretchByRank = [...stretch].sort(byRankScore);
  const inBudgetByGpuFocus = [...inBudget].sort(
    (a, b) =>
      b.gpu.score.raw - a.gpu.score.raw ||
      b.gpu.vramGb - a.gpu.vramGb ||
      b.rankScore - a.rankScore,
  );
  const inBudgetByValue = [...inBudget].sort((a, b) => b.perfPerPrice - a.perfPerPrice);

  const selected: Array<{ pair: EvaluatedPair; role: ComboRole }> = [];
  const usedSeriesIds = new Set<string>();
  const usedCpuIds = new Set<string>();

  const hasInBudget = inBudgetByRank.length > 0;
  const first = hasInBudget ? inBudgetByRank[0] : stretchByRank[0];
  selected.push({ pair: first, role: hasInBudget ? 'best_overall' : 'performance_stretch' });
  usedSeriesIds.add(first.gpu.seriesId);
  usedCpuIds.add(first.cpu.id);

  // Slot 2: prefer significant +5% stretch upgrade over best in-budget pair, else GPU-focused in-budget
  const stretchFloorScore = first.compositeScore * (1 + COMBO_STRETCH_MIN_SCORE_GAIN_RATIO);
  const stretchSecond = hasInBudget
    ? pickDistinctPair(
        stretchByRank.filter((c) => c.compositeScore >= stretchFloorScore),
        usedSeriesIds,
        usedCpuIds,
      )
    : null;

  if (stretchSecond) {
    selected.push({ pair: stretchSecond, role: 'performance_stretch' });
    usedSeriesIds.add(stretchSecond.gpu.seriesId);
    usedCpuIds.add(stretchSecond.cpu.id);
  } else {
    const gpuSecond = pickDistinctPair(inBudgetByGpuFocus, usedSeriesIds, usedCpuIds);
    const fallbackSecond = gpuSecond
      ? { pair: gpuSecond, role: 'gpu_focused' as const }
      : (() => {
          const s = pickDistinctPair(stretchByRank, usedSeriesIds, usedCpuIds);
          return s ? { pair: s, role: 'performance_stretch' as const } : null;
        })();
    if (fallbackSecond) {
      selected.push(fallbackSecond);
      usedSeriesIds.add(fallbackSecond.pair.gpu.seriesId);
      usedCpuIds.add(fallbackSecond.pair.cpu.id);
    }
  }

  // Slot 3: highest perfPerPrice distinct combo in budget, else remaining stretch
  const valueThird = pickDistinctPair(inBudgetByValue, usedSeriesIds, usedCpuIds);
  if (valueThird) {
    selected.push({ pair: valueThird, role: 'best_value' });
  } else {
    const stretchThird = pickDistinctPair(stretchByRank, usedSeriesIds, usedCpuIds);
    if (stretchThird) {
      selected.push({ pair: stretchThird, role: 'performance_stretch' });
    }
  }

  return {
    targetGpuSharePct,
    targetCpuSharePct,
    combos: selected.map((entry, idx) => toRecommendation(entry.pair, idx + 1, entry.role)),
    minAvailableComboPriceVnd,
    cheapestReferenceCombo,
  };
}
