import 'server-only';

import type { ChipVendor, PerfPerPriceItem } from '@/shared/types';

export interface PerfPerPriceCandidate {
  id: string;
  name: string;
  vendor: ChipVendor;
  aibBrand: string | null;
  priceVnd: number;
  passmarkRaw: number;
  normalizedScore: number | null;
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  // Tiny bias avoids binary float artifacts such as 1.005 * 100 -> 100.49999999999999
  return Math.round((value + 1e-12) * factor) / factor;
}

/**
 * Normalizes a raw PassMark score onto a base-100 scale rounded to 1 decimal.
 */
export function normalizeScore(raw: number, maxRawInCategory: number | null): number | null {
  if (!maxRawInCategory || maxRawInCategory <= 0 || raw <= 0) {
    return null;
  }
  return roundTo((100 * raw) / maxRawInCategory, 1);
}

/**
 * Computes Performance-per-Price using the displayed 1-decimal normalized score.
 */
export function calculatePerfPerPrice(normalizedScore: number, priceVnd: number): number {
  return roundTo(normalizedScore / (priceVnd / 1_000_000), 2);
}

/**
 * Filters by optional `maxPriceVnd`, sorts by `perfPerPrice` desc, `priceVnd` asc,
 * `passmarkRaw` desc, assigns 1-based rank, and marks ties at the top as `bestValue`.
 */
export function rankByPerfPerPrice(
  items: readonly PerfPerPriceCandidate[],
  maxPriceVnd?: number,
): PerfPerPriceItem[] {
  const filtered = items.filter((item) => {
    if (item.normalizedScore === null) return false;
    if (maxPriceVnd !== undefined && item.priceVnd > maxPriceVnd) return false;
    return true;
  });

  if (filtered.length === 0) {
    return [];
  }

  const scored = filtered.map((item) => ({
    item,
    perfPerPrice: calculatePerfPerPrice(item.normalizedScore!, item.priceVnd),
  }));

  scored.sort((a, b) => {
    if (b.perfPerPrice !== a.perfPerPrice) return b.perfPerPrice - a.perfPerPrice;
    if (a.item.priceVnd !== b.item.priceVnd) return a.item.priceVnd - b.item.priceVnd;
    return b.item.passmarkRaw - a.item.passmarkRaw;
  });

  const topScore = scored[0].perfPerPrice;

  return scored.map(({ item, perfPerPrice }, index) => ({
    rank: index + 1,
    id: item.id,
    name: item.name,
    vendor: item.vendor,
    aibBrand: item.aibBrand,
    priceVnd: item.priceVnd,
    score: {
      raw: item.passmarkRaw,
      normalized: item.normalizedScore,
    },
    perfPerPrice,
    bestValue: perfPerPrice === topScore,
  }));
}
