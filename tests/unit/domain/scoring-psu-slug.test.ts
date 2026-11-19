import { describe, expect, it } from 'vitest';
import {
  calculatePerfPerPrice,
  normalizeScore,
  rankByPerfPerPrice,
} from '@/server/domain/scoring';
import { estimatePsuWattage } from '@/server/domain/psu';
import {
  allocateNextLegacyId,
  allocateUniqueSlug,
  slugifyHardwareName,
} from '@/server/domain/slug';

describe('domain/scoring, psu, slug', () => {
  it('normalizes PassMark scores and computes performance-per-price rankings', () => {
    expect(normalizeScore(100, null)).toBeNull();
    expect(normalizeScore(100, 0)).toBeNull();
    expect(normalizeScore(0, 50000)).toBeNull();
    expect(normalizeScore(50000, 50000)).toBe(100);
    expect(normalizeScore(25000, 50000)).toBe(50);

    expect(calculatePerfPerPrice(87.3, 10_000_000)).toBe(8.73);

    const ranked = rankByPerfPerPrice(
      [
        {
          id: 'cpu-ignored',
          name: 'Null Score',
          vendor: 'intel',
          aibBrand: null,
          priceVnd: 1_000_000,
          passmarkRaw: 1000,
          normalizedScore: null,
        },
        {
          id: 'cpu-expensive',
          name: 'Expensive CPU',
          vendor: 'intel',
          aibBrand: null,
          priceVnd: 20_000_000,
          passmarkRaw: 60000,
          normalizedScore: 100,
        },
        {
          id: 'cpu-tie-cheaper',
          name: 'Tie Cheaper',
          vendor: 'amd',
          aibBrand: null,
          priceVnd: 5_000_000,
          passmarkRaw: 30000,
          normalizedScore: 50,
        },
        {
          id: 'cpu-tie-pricier-higher-raw',
          name: 'Tie Pricier',
          vendor: 'intel',
          aibBrand: null,
          priceVnd: 6_000_000,
          passmarkRaw: 36000,
          normalizedScore: 60,
        },
        {
          id: 'cpu-tie-same-price-higher-raw',
          name: 'Tie Same Price Higher Raw',
          vendor: 'amd',
          aibBrand: null,
          priceVnd: 6_000_000,
          passmarkRaw: 36050,
          normalizedScore: 60,
        },
      ],
      10_000_000,
    );

    expect(ranked.map((r) => r.id)).toEqual([
      'cpu-tie-cheaper',
      'cpu-tie-same-price-higher-raw',
      'cpu-tie-pricier-higher-raw',
    ]);
    expect(ranked.every((r) => r.bestValue)).toBe(true);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);

    expect(rankByPerfPerPrice([], 1_000_000)).toEqual([]);
    expect(
      rankByPerfPerPrice([
        {
          id: 'cpu-a',
          name: 'CPU A',
          vendor: 'intel',
          aibBrand: null,
          priceVnd: 5_000_000,
          passmarkRaw: 25000,
          normalizedScore: 50,
        },
        {
          id: 'cpu-b',
          name: 'CPU B',
          vendor: 'amd',
          aibBrand: null,
          priceVnd: 10_000_000,
          passmarkRaw: 25000,
          normalizedScore: 50,
        },
      ]).map((r) => ({ id: r.id, bestValue: r.bestValue })),
    ).toEqual([
      { id: 'cpu-a', bestValue: true },
      { id: 'cpu-b', bestValue: false },
    ]);
  });

  it('estimates PSU tiers across all boundaries', () => {
    // (65 + 115 + 100) * 1.25 = 350 -> 450W minimum
    expect(estimatePsuWattage(65, 115)).toEqual({
      baseSystemW: 100,
      headroomFactor: 1.25,
      exactW: 350,
      recommendedTierW: 450,
      exceedsMaxTier: false,
    });
    // Exact 450
    expect(estimatePsuWattage(140, 120).recommendedTierW).toBe(450);
    // (165 + 200 + 100) * 1.25 = 581.25 -> 650W
    expect(estimatePsuWattage(165, 200)).toMatchObject({
      exactW: 581.25,
      recommendedTierW: 650,
      exceedsMaxTier: false,
    });
    // Exact 1200: (285 + 575 + 100) * 1.25 = 1200 -> 1200W
    expect(estimatePsuWattage(285, 575)).toMatchObject({
      exactW: 1200,
      recommendedTierW: 1200,
      exceedsMaxTier: false,
    });
    // Above 1200: (290 + 575 + 100) * 1.25 = 1206.25 -> null + exceedsMaxTier
    expect(estimatePsuWattage(290, 575)).toEqual({
      baseSystemW: 100,
      headroomFactor: 1.25,
      exactW: 1206.25,
      recommendedTierW: null,
      exceedsMaxTier: true,
    });
  });

  it('slugifies hardware names and allocates unique product and legacy IDs', () => {
    expect(slugifyHardwareName('Đồ họa RTX 5070 Ti (OC)', 60)).toBe('do-hoa-rtx-5070-ti-oc');
    expect(slugifyHardwareName('!!!', 60)).toBe('item');

    expect(allocateUniqueSlug('cpu-', 'Ryzen 7 9800X3D', [], 80)).toBe('cpu-ryzen-7-9800x3d');
    expect(
      allocateUniqueSlug(
        'cpu-',
        'Ryzen 7 9800X3D',
        new Set(['cpu-ryzen-7-9800x3d', 'cpu-ryzen-7-9800x3d-2']),
        80,
      ),
    ).toBe('cpu-ryzen-7-9800x3d-3');

    expect(allocateUniqueSlug('gs-', 'A'.repeat(80), ['gs-' + 'a'.repeat(57)], 60)).toHaveLength(60);

    expect(allocateNextLegacyId('C', [])).toBe('C01');
    expect(allocateNextLegacyId('C', ['C24', 'C01', 'other'])).toBe('C25');
    expect(allocateNextLegacyId('G', ['G01', 'G33', 'G99'])).toBe('G100');
  });
});
