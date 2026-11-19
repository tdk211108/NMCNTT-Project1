import { describe, expect, it } from 'vitest';
import { pickFeaturedCandidates, type FeaturedCandidate } from '@/server/domain/featured';

function makeCpuCandidates(): FeaturedCandidate[] {
  const intel = Array.from({ length: 10 }, (_, idx) => ({
    id: `cpu-intel-${idx}`,
    vendor: 'intel' as const,
    seriesId: null,
    normalizedScore: 100 - idx * 7,
    priceVnd: 15_000_000 - idx * 1_000_000,
  }));
  const amd = Array.from({ length: 8 }, (_, idx) => ({
    id: `cpu-amd-${idx}`,
    vendor: 'amd' as const,
    seriesId: null,
    normalizedScore: 95 - idx * 8,
    priceVnd: 14_000_000 - idx * 1_100_000,
  }));
  return [...intel, ...amd];
}

function makeGpuCandidates(): FeaturedCandidate[] {
  const items: FeaturedCandidate[] = [];
  for (let s = 0; s < 5; s++) {
    for (let v = 0; v < 2; v++) {
      items.push({
        id: `gpu-amd-s${s}-v${v}`,
        vendor: 'amd',
        seriesId: `gs-amd-${s}`,
        normalizedScore: 80 - s * 10,
        priceVnd: 20_000_000 - s * 2_000_000 + v * 250_000,
      });
    }
  }
  for (let s = 0; s < 8; s++) {
    for (let v = 0; v < 3; v++) {
      items.push({
        id: `gpu-nv-s${s}-v${v}`,
        vendor: 'nvidia',
        seriesId: `gs-nv-${s}`,
        normalizedScore: 100 - s * 9,
        priceVnd: 50_000_000 - s * 4_500_000 + v * 300_000,
      });
    }
  }
  return items;
}

describe('domain/featured', () => {
  it('handles empty lists, non-positive limits, and lists smaller than limit', () => {
    expect(pickFeaturedCandidates([], 12)).toEqual([]);
    const small = makeCpuCandidates().slice(0, 3);
    expect(pickFeaturedCandidates(small, 0)).toEqual([]);
    expect(pickFeaturedCandidates(small, 12).map((c) => c.id)).toEqual([
      'cpu-intel-0',
      'cpu-intel-1',
      'cpu-intel-2',
    ]);
  });

  it('picks balanced multi-vendor and multi-tier featured CPUs at default limit (8)', () => {
    const picked = pickFeaturedCandidates(makeCpuCandidates());
    expect(picked).toHaveLength(8);
    expect(picked.filter((c) => c.vendor === 'intel')).toHaveLength(4);
    expect(picked.filter((c) => c.vendor === 'amd')).toHaveLength(4);
    // Spans flagship down to entry tier cleanly
    expect(picked[0].id).toBe('cpu-intel-0');
    expect(picked.some((c) => c.id === 'cpu-amd-7')).toBe(true);
    expect(picked.some((c) => c.id === 'cpu-intel-9')).toBe(true);
  });

  it('deduplicates GPU series first across vendors and supports quota=1 single-item sampling', () => {
    const gpus = makeGpuCandidates();
    const picked8 = pickFeaturedCandidates(gpus);
    expect(picked8).toHaveLength(8);
    expect(picked8.filter((g) => g.vendor === 'amd')).toHaveLength(4);
    expect(picked8.filter((g) => g.vendor === 'nvidia')).toHaveLength(4);
    expect(new Set(picked8.map((g) => g.seriesId)).size).toBe(8);

    const picked2 = pickFeaturedCandidates(gpus, 2);
    expect(picked2).toHaveLength(2);
    expect(picked2.map((g) => g.vendor).sort()).toEqual(['amd', 'nvidia']);

    const picked1 = pickFeaturedCandidates(gpus, 1);
    expect(picked1).toHaveLength(1);
  });

  it('fills remaining slots from overflow AIB variants when unique series are fewer than limit', () => {
    const limitedSeries: FeaturedCandidate[] = [
      { id: 'v1', vendor: 'nvidia', seriesId: 's1', normalizedScore: 90, priceVnd: 10_000_000 },
      { id: 'v2', vendor: 'nvidia', seriesId: 's1', normalizedScore: 90, priceVnd: 10_500_000 },
      { id: 'v3', vendor: 'nvidia', seriesId: 's2', normalizedScore: 80, priceVnd: 8_000_000 },
      { id: 'v4', vendor: 'amd', seriesId: 's3', normalizedScore: 85, priceVnd: 9_000_000 },
      { id: 'v5', vendor: 'amd', seriesId: 's3', normalizedScore: 85, priceVnd: 9_500_000 },
    ];
    const picked = pickFeaturedCandidates(limitedSeries, 4);
    expect(picked).toHaveLength(4);
    expect(new Set(picked.map((i) => i.seriesId))).toEqual(new Set(['s1', 's2', 's3']));
  });
});
