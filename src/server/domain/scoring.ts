import 'server-only';

import type { ChipVendor, PerfPerPriceItem } from '@/shared/types';
import { roundTo } from './format';

export interface PerfPerPriceCandidate {
  id: string;
  name: string;
  vendor: ChipVendor;
  aibBrand: string | null;
  priceVnd: number;
  passmarkRaw: number;
  normalizedScore: number | null;
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
