import 'server-only';

import type {
  CpuVendor,
  GpuVendor,
  HardwareAwardBadge,
  HardwareAwardKey,
  HardwareAwardWinner,
} from '@/shared/types';
import { formatCpuCoresThreads, roundTo } from './format';
import { calculatePerfPerPrice } from './scoring';

export interface CpuAwardCandidate {
  id: string;
  name: string;
  vendor: CpuVendor;
  priceVnd: number;
  imageUrl: string | null;
  socket: string;
  coresTotal: number;
  threadsTotal: number;
  psuPowerW: number;
  tdpW: number;
  l3CacheMb: number;
  boostClockGhz: number;
  passmarkRaw: number;
  normalizedScore: number | null;
}

export interface GpuAwardCandidate {
  id: string;
  seriesName: string;
  name: string;
  vendor: GpuVendor;
  aibBrand: string;
  isLimitedEdition: boolean;
  priceVnd: number;
  imageUrl: string | null;
  vramGb: number;
  tbpW: number;
  lengthMm: number;
  slotThickness: number;
  passmarkRaw: number;
  normalizedScore: number | null;
}

interface AwardSpec<T> {
  key: HardwareAwardKey;
  compare: (candidate: T, currentBest: T) => number;
  badge: (winner: T) => HardwareAwardBadge;
}

function formatViDecimal(value: number, decimals: number): string {
  const fixed = value.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');
  const groupedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decPart ? `${groupedInt},${decPart}` : groupedInt;
}

function formatVndCompact(priceVnd: number): string {
  return `${formatViDecimal(priceVnd, 0)} đ`;
}

function firstNonZero(diffs: readonly number[]): number {
  for (const diff of diffs) {
    if (diff !== 0) return diff;
  }
  return 0;
}

function pickWinner<T extends { id: string }>(
  list: readonly T[],
  compare: (candidate: T, currentBest: T) => number,
): T {
  let best = list[0];
  for (let i = 1; i < list.length; i += 1) {
    const candidate = list[i];
    const delta = compare(candidate, best);
    if (delta < 0 || (delta === 0 && candidate.id.localeCompare(best.id) < 0)) {
      best = candidate;
    }
  }
  return best;
}

function groupAwardWinners<T extends { id: string }>(
  enriched: readonly T[],
  specs: readonly AwardSpec<T>[],
  toBaseWinner: (item: T) => Omit<HardwareAwardWinner, 'awards' | 'awardCount'>,
): HardwareAwardWinner[] {
  const grouped = new Map<
    string,
    {
      topPriority: number;
      base: Omit<HardwareAwardWinner, 'awards' | 'awardCount'>;
      awards: HardwareAwardBadge[];
    }
  >();

  for (let priority = 0; priority < specs.length; priority += 1) {
    const spec = specs[priority];
    const winner = pickWinner(enriched, spec.compare);
    const badge = spec.badge(winner);
    const existing = grouped.get(winner.id);
    if (existing) {
      existing.awards.push(badge);
    } else {
      grouped.set(winner.id, {
        topPriority: priority,
        base: toBaseWinner(winner),
        awards: [badge],
      });
    }
  }

  return Array.from(grouped.values())
    .sort((a, b) => firstNonZero([b.awards.length - a.awards.length, a.topPriority - b.topPriority]))
    .map((entry) => ({
      ...entry.base,
      awards: entry.awards,
      awardCount: entry.awards.length,
    }));
}

function filterEligible<T extends { normalizedScore: number | null; priceVnd: number }>(
  candidates: readonly T[],
  maxPriceVnd?: number,
): T[] {
  return candidates.filter((item) => {
    if (item.normalizedScore === null) return false;
    if (maxPriceVnd !== undefined && item.priceVnd > maxPriceVnd) return false;
    return true;
  });
}

function preferStandardEdition(
  a: { isLimitedEdition: boolean },
  b: { isLimitedEdition: boolean },
): number {
  return Number(a.isLimitedEdition) - Number(b.isLimitedEdition);
}

/**
 * Evaluates 8 deterministic hardware awards for eligible retail CPUs and
 * merges multiple awards won by the same CPU onto a single winner card.
 */
export function buildCpuAwards(
  candidates: readonly CpuAwardCandidate[],
  maxPriceVnd?: number,
): HardwareAwardWinner[] {
  const eligible = filterEligible(candidates, maxPriceVnd);
  if (eligible.length === 0) {
    return [];
  }

  const enriched = eligible.map((item) => ({
    ...item,
    normalizedScore: item.normalizedScore!,
    perfPerPrice: calculatePerfPerPrice(item.normalizedScore!, item.priceVnd),
    perfPerWatt: roundTo(item.passmarkRaw / item.psuPowerW, 1),
  }));

  type EnrichedCpu = (typeof enriched)[number];

  const specs: readonly AwardSpec<EnrichedCpu>[] = [
    {
      key: 'strongest',
      compare: (a, b) => firstNonZero([b.passmarkRaw - a.passmarkRaw, a.priceVnd - b.priceVnd]),
      badge: (w) => ({
        key: 'strongest',
        metricValue: w.normalizedScore,
        metricDisplay: `${formatViDecimal(w.normalizedScore, 1)} điểm`,
      }),
    },
    {
      key: 'best_value',
      compare: (a, b) =>
        firstNonZero([
          b.perfPerPrice - a.perfPerPrice,
          a.priceVnd - b.priceVnd,
          b.passmarkRaw - a.passmarkRaw,
        ]),
      badge: (w) => ({
        key: 'best_value',
        metricValue: w.perfPerPrice,
        metricDisplay: `${formatViDecimal(w.perfPerPrice, 2)} điểm/triệu`,
      }),
    },
    {
      key: 'best_efficiency',
      compare: (a, b) =>
        firstNonZero([
          b.perfPerWatt - a.perfPerWatt,
          a.psuPowerW - b.psuPowerW,
          a.priceVnd - b.priceVnd,
        ]),
      badge: (w) => ({
        key: 'best_efficiency',
        metricValue: w.perfPerWatt,
        metricDisplay: `${formatViDecimal(w.perfPerWatt, 1)} điểm/W`,
      }),
    },
    {
      key: 'most_cores',
      compare: (a, b) =>
        firstNonZero([
          b.coresTotal - a.coresTotal,
          b.threadsTotal - a.threadsTotal,
          b.passmarkRaw - a.passmarkRaw,
          a.priceVnd - b.priceVnd,
        ]),
      badge: (w) => ({
        key: 'most_cores',
        metricValue: w.coresTotal,
        metricDisplay: formatCpuCoresThreads(w.coresTotal, w.threadsTotal),
      }),
    },
    {
      key: 'largest_cache',
      compare: (a, b) =>
        firstNonZero([
          b.l3CacheMb - a.l3CacheMb,
          b.passmarkRaw - a.passmarkRaw,
          a.priceVnd - b.priceVnd,
        ]),
      badge: (w) => ({
        key: 'largest_cache',
        metricValue: w.l3CacheMb,
        metricDisplay: `${formatViDecimal(w.l3CacheMb, Number.isInteger(w.l3CacheMb) ? 0 : 1)} MB L3`,
      }),
    },
    {
      key: 'lowest_power',
      compare: (a, b) =>
        firstNonZero([
          a.psuPowerW - b.psuPowerW,
          a.tdpW - b.tdpW,
          b.passmarkRaw - a.passmarkRaw,
          a.priceVnd - b.priceVnd,
        ]),
      badge: (w) => ({
        key: 'lowest_power',
        metricValue: w.psuPowerW,
        metricDisplay: `${w.psuPowerW} W đỉnh (TDP ${w.tdpW} W)`,
      }),
    },
    {
      key: 'cheapest',
      compare: (a, b) => firstNonZero([a.priceVnd - b.priceVnd, b.passmarkRaw - a.passmarkRaw]),
      badge: (w) => ({
        key: 'cheapest',
        metricValue: w.priceVnd,
        metricDisplay: formatVndCompact(w.priceVnd),
      }),
    },
    {
      key: 'most_expensive',
      compare: (a, b) => firstNonZero([b.priceVnd - a.priceVnd, b.passmarkRaw - a.passmarkRaw]),
      badge: (w) => ({
        key: 'most_expensive',
        metricValue: w.priceVnd,
        metricDisplay: formatVndCompact(w.priceVnd),
      }),
    },
  ];

  return groupAwardWinners(enriched, specs, (item) => ({
    id: item.id,
    category: 'cpu',
    name: item.name,
    vendor: item.vendor,
    aibBrand: null,
    isLimitedEdition: false,
    priceVnd: item.priceVnd,
    imageUrl: item.imageUrl,
    score: {
      raw: item.passmarkRaw,
      normalized: item.normalizedScore,
    },
    perfPerPrice: item.perfPerPrice,
    perfPerWatt: item.perfPerWatt,
    specs: {
      socket: item.socket,
      coresTotal: item.coresTotal,
      threadsTotal: item.threadsTotal,
      psuPowerW: item.psuPowerW,
      tdpW: item.tdpW,
      l3CacheMb: item.l3CacheMb,
      boostClockGhz: item.boostClockGhz,
      seriesName: null,
      vramGb: null,
      tbpW: null,
      lengthMm: null,
      slotThickness: null,
    },
  }));
}

/**
 * Evaluates 9 deterministic hardware awards for eligible retail GPUs and
 * merges multiple awards won by the same GPU onto a single winner card.
 */
export function buildGpuAwards(
  candidates: readonly GpuAwardCandidate[],
  maxPriceVnd?: number,
): HardwareAwardWinner[] {
  const eligible = filterEligible(candidates, maxPriceVnd);
  if (eligible.length === 0) {
    return [];
  }

  const enriched = eligible.map((item) => ({
    ...item,
    normalizedScore: item.normalizedScore!,
    perfPerPrice: calculatePerfPerPrice(item.normalizedScore!, item.priceVnd),
    perfPerWatt: roundTo(item.passmarkRaw / item.tbpW, 1),
  }));

  type EnrichedGpu = (typeof enriched)[number];

  const specs: readonly AwardSpec<EnrichedGpu>[] = [
    {
      key: 'strongest',
      compare: (a, b) =>
        firstNonZero([
          b.passmarkRaw - a.passmarkRaw,
          preferStandardEdition(a, b),
          a.priceVnd - b.priceVnd,
        ]),
      badge: (w) => ({
        key: 'strongest',
        metricValue: w.normalizedScore,
        metricDisplay: `${formatViDecimal(w.normalizedScore, 1)} điểm`,
      }),
    },
    {
      key: 'best_value',
      compare: (a, b) =>
        firstNonZero([
          b.perfPerPrice - a.perfPerPrice,
          a.priceVnd - b.priceVnd,
          b.passmarkRaw - a.passmarkRaw,
        ]),
      badge: (w) => ({
        key: 'best_value',
        metricValue: w.perfPerPrice,
        metricDisplay: `${formatViDecimal(w.perfPerPrice, 2)} điểm/triệu`,
      }),
    },
    {
      key: 'best_efficiency',
      compare: (a, b) =>
        firstNonZero([
          b.perfPerWatt - a.perfPerWatt,
          a.tbpW - b.tbpW,
          preferStandardEdition(a, b),
          a.priceVnd - b.priceVnd,
        ]),
      badge: (w) => ({
        key: 'best_efficiency',
        metricValue: w.perfPerWatt,
        metricDisplay: `${formatViDecimal(w.perfPerWatt, 1)} điểm/W`,
      }),
    },
    {
      key: 'most_vram',
      compare: (a, b) =>
        firstNonZero([
          b.vramGb - a.vramGb,
          b.passmarkRaw - a.passmarkRaw,
          preferStandardEdition(a, b),
          a.priceVnd - b.priceVnd,
        ]),
      badge: (w) => ({
        key: 'most_vram',
        metricValue: w.vramGb,
        metricDisplay: `${w.vramGb} GB VRAM`,
      }),
    },
    {
      key: 'most_compact',
      compare: (a, b) =>
        firstNonZero([
          a.lengthMm - b.lengthMm,
          a.slotThickness - b.slotThickness,
          b.passmarkRaw - a.passmarkRaw,
          a.priceVnd - b.priceVnd,
        ]),
      badge: (w) => ({
        key: 'most_compact',
        metricValue: w.lengthMm,
        metricDisplay: `${w.lengthMm} mm (${formatViDecimal(w.slotThickness, 1)} slot)`,
      }),
    },
    {
      key: 'largest_gpu',
      compare: (a, b) =>
        firstNonZero([
          b.lengthMm - a.lengthMm,
          b.slotThickness - a.slotThickness,
          b.passmarkRaw - a.passmarkRaw,
          preferStandardEdition(a, b),
          a.priceVnd - b.priceVnd,
        ]),
      badge: (w) => ({
        key: 'largest_gpu',
        metricValue: w.lengthMm,
        metricDisplay: `${w.lengthMm} mm (${formatViDecimal(w.slotThickness, 1)} slot)`,
      }),
    },
    {
      key: 'lowest_power',
      compare: (a, b) =>
        firstNonZero([
          a.tbpW - b.tbpW,
          b.passmarkRaw - a.passmarkRaw,
          preferStandardEdition(a, b),
          a.priceVnd - b.priceVnd,
        ]),
      badge: (w) => ({
        key: 'lowest_power',
        metricValue: w.tbpW,
        metricDisplay: `${w.tbpW} W TBP`,
      }),
    },
    {
      key: 'cheapest',
      compare: (a, b) => firstNonZero([a.priceVnd - b.priceVnd, b.passmarkRaw - a.passmarkRaw]),
      badge: (w) => ({
        key: 'cheapest',
        metricValue: w.priceVnd,
        metricDisplay: formatVndCompact(w.priceVnd),
      }),
    },
    {
      key: 'most_expensive',
      compare: (a, b) => firstNonZero([b.priceVnd - a.priceVnd, b.passmarkRaw - a.passmarkRaw]),
      badge: (w) => ({
        key: 'most_expensive',
        metricValue: w.priceVnd,
        metricDisplay: formatVndCompact(w.priceVnd),
      }),
    },
  ];

  return groupAwardWinners(enriched, specs, (item) => ({
    id: item.id,
    category: 'gpu',
    name: item.name,
    vendor: item.vendor,
    aibBrand: item.aibBrand,
    isLimitedEdition: item.isLimitedEdition,
    priceVnd: item.priceVnd,
    imageUrl: item.imageUrl,
    score: {
      raw: item.passmarkRaw,
      normalized: item.normalizedScore,
    },
    perfPerPrice: item.perfPerPrice,
    perfPerWatt: item.perfPerWatt,
    specs: {
      socket: null,
      coresTotal: null,
      threadsTotal: null,
      psuPowerW: null,
      tdpW: null,
      l3CacheMb: null,
      boostClockGhz: null,
      seriesName: item.seriesName,
      vramGb: item.vramGb,
      tbpW: item.tbpW,
      lengthMm: item.lengthMm,
      slotThickness: item.slotThickness,
    },
  }));
}
