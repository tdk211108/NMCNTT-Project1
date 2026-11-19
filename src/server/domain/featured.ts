import 'server-only';

import { FEATURED_PER_CATEGORY } from '@/shared/constants';
import type { ChipVendor } from '@/shared/types';

export interface FeaturedCandidate {
  id: string;
  vendor: ChipVendor;
  seriesId: string | null;
  normalizedScore: number;
  priceVnd: number;
}

function compareByScoreDesc<T extends FeaturedCandidate>(a: T, b: T): number {
  return (
    b.normalizedScore - a.normalizedScore ||
    a.priceVnd - b.priceVnd ||
    a.id.localeCompare(b.id)
  );
}

function sampleEvenly<T>(items: readonly T[], count: number): T[] {
  if (count >= items.length) {
    return [...items];
  }
  if (count === 1) {
    return [items[0]];
  }
  const sampled: T[] = [];
  for (let i = 0; i < count; i++) {
    const index = Math.round((i * (items.length - 1)) / (count - 1));
    sampled.push(items[index]);
  }
  return sampled;
}

function splitVendorRepresentatives<T extends FeaturedCandidate>(items: readonly T[]): {
  representatives: T[];
  overflow: T[];
} {
  const seriesOrder: string[] = [];
  const buckets = new Map<string, T[]>();

  for (const item of items) {
    const key = item.seriesId ?? item.id;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      seriesOrder.push(key);
      buckets.set(key, [item]);
    }
  }

  const representatives: T[] = [];
  const overflow: T[] = [];

  seriesOrder.forEach((key, seriesIdx) => {
    const bucket = buckets.get(key)!.slice().sort((a, b) => a.priceVnd - b.priceVnd || a.id.localeCompare(b.id));
    const chosenIndex = seriesIdx % bucket.length;
    representatives.push(bucket[chosenIndex]);
    bucket.forEach((item, idx) => {
      if (idx !== chosenIndex) {
        overflow.push(item);
      }
    });
  });

  return {
    representatives: representatives.sort(compareByScoreDesc),
    overflow,
  };
}

/**
 * Picks up to `limit` featured candidates balanced across chip vendors and performance/price tiers,
 * preferring one distinct model/GPU series per slot before repeating any series.
 */
export function pickFeaturedCandidates<T extends FeaturedCandidate>(
  candidates: readonly T[],
  limit = FEATURED_PER_CATEGORY,
): T[] {
  if (limit <= 0 || candidates.length === 0) {
    return [];
  }

  const sorted = [...candidates].sort(compareByScoreDesc);
  if (sorted.length <= limit) {
    return sorted;
  }

  const byVendor = new Map<ChipVendor, T[]>();
  for (const item of sorted) {
    const group = byVendor.get(item.vendor);
    if (group) {
      group.push(item);
    } else {
      byVendor.set(item.vendor, [item]);
    }
  }

  const vendors = [...byVendor.keys()].sort((a, b) => a.localeCompare(b));
  const pools = vendors.map((vendor) => splitVendorRepresentatives(byVendor.get(vendor)!));

  const quotas = new Array<number>(pools.length).fill(0);
  let remaining = limit;
  while (remaining > 0) {
    let allocatedInRound = false;
    for (let i = 0; i < pools.length && remaining > 0; i++) {
      if (quotas[i] < pools[i].representatives.length) {
        quotas[i] += 1;
        remaining -= 1;
        allocatedInRound = true;
      }
    }
    if (!allocatedInRound) {
      break;
    }
  }

  const selected: T[] = [];
  pools.forEach((pool, i) => {
    if (quotas[i] > 0) {
      selected.push(...sampleEvenly(pool.representatives, quotas[i]));
    }
  });

  if (selected.length < limit) {
    const overflow = pools.flatMap((pool) => pool.overflow).sort(compareByScoreDesc);
    selected.push(...overflow.slice(0, limit - selected.length));
  }

  return selected.sort(compareByScoreDesc);
}
