import { describe, expect, it } from 'vitest';
import {
  buildCpuAwards,
  buildGpuAwards,
  type CpuAwardCandidate,
  type GpuAwardCandidate,
} from '@/server/domain/awards';

describe('domain/awards (CPU & GPU Hardware Awards)', () => {
  it('evaluates all 8 CPU awards, handles ties/fractional cache/budget filter, and merges multi-award winners', () => {
    expect(buildCpuAwards([])).toEqual([]);

    const candidates: CpuAwardCandidate[] = [
      {
        id: 'cpu-ignored-null',
        name: 'Null Score CPU',
        vendor: 'intel',
        priceVnd: 1_000_000,
        imageUrl: null,
        socket: 'LGA1700',
        coresTotal: 4,
        threadsTotal: 4,
        psuPowerW: 60,
        tdpW: 35,
        l3CacheMb: 8,
        boostClockGhz: 4.0,
        passmarkRaw: 8000,
        normalizedScore: null,
      },
      {
        id: 'cpu-budget-excluded',
        name: 'Over Budget Flagship',
        vendor: 'intel',
        priceVnd: 25_000_000,
        imageUrl: null,
        socket: 'LGA1851',
        coresTotal: 32,
        threadsTotal: 32,
        psuPowerW: 300,
        tdpW: 150,
        l3CacheMb: 64,
        boostClockGhz: 6.0,
        passmarkRaw: 75000,
        normalizedScore: 100,
      },
      {
        id: 'cpu-b-tie',
        name: 'Tie B',
        vendor: 'amd',
        priceVnd: 3_000_000,
        imageUrl: null,
        socket: 'AM5',
        coresTotal: 6,
        threadsTotal: 12,
        psuPowerW: 88,
        tdpW: 65,
        l3CacheMb: 32,
        boostClockGhz: 5.0,
        passmarkRaw: 25000,
        normalizedScore: 50.0,
      },
      {
        id: 'cpu-a-tie',
        name: 'Tie A',
        vendor: 'amd',
        priceVnd: 3_000_000,
        imageUrl: '/cpu-a.webp',
        socket: 'AM5',
        coresTotal: 6,
        threadsTotal: 12,
        psuPowerW: 88,
        tdpW: 65,
        l3CacheMb: 32,
        boostClockGhz: 5.0,
        passmarkRaw: 25000,
        normalizedScore: 50.0,
      },
      {
        id: 'cpu-c-tie',
        name: 'Tie C',
        vendor: 'intel',
        priceVnd: 3_000_000,
        imageUrl: null,
        socket: 'LGA1700',
        coresTotal: 6,
        threadsTotal: 12,
        psuPowerW: 88,
        tdpW: 65,
        l3CacheMb: 32,
        boostClockGhz: 5.0,
        passmarkRaw: 25000,
        normalizedScore: 50.0,
      },
      {
        id: 'cpu-cache-frac',
        name: 'Fractional Cache CPU',
        vendor: 'intel',
        priceVnd: 8_000_000,
        imageUrl: '/cpu-frac.webp',
        socket: 'LGA1700',
        coresTotal: 16,
        threadsTotal: 24,
        psuPowerW: 200,
        tdpW: 125,
        l3CacheMb: 128.5,
        boostClockGhz: 5.6,
        passmarkRaw: 45000,
        normalizedScore: 70.0,
      },
      {
        id: 'cpu-king',
        name: 'Efficiency & Power King',
        vendor: 'amd',
        priceVnd: 18_000_000,
        imageUrl: '/cpu-king.webp',
        socket: 'AM5',
        coresTotal: 24,
        threadsTotal: 48,
        psuPowerW: 160,
        tdpW: 120,
        l3CacheMb: 96,
        boostClockGhz: 5.7,
        passmarkRaw: 67200,
        normalizedScore: 95.0,
      },
      {
        id: 'cpu-eco',
        name: 'Lowest Watt CPU',
        vendor: 'intel',
        priceVnd: 4_500_000,
        imageUrl: null,
        socket: 'LGA1700',
        coresTotal: 4,
        threadsTotal: 8,
        psuPowerW: 70,
        tdpW: 58,
        l3CacheMb: 12,
        boostClockGhz: 4.5,
        passmarkRaw: 16000,
        normalizedScore: 28.0,
      },
    ];

    // Exceeds budget returns []
    expect(buildCpuAwards(candidates, 500_000)).toEqual([]);

    const winners = buildCpuAwards(candidates, 20_000_000);
    const totalAwards = winners.reduce((sum, w) => sum + w.awardCount, 0);
    expect(totalAwards).toBe(8);

    // cpu-king wins strongest, best_efficiency (67200/160 = 420), most_cores, most_expensive (4 awards)
    expect(winners[0].id).toBe('cpu-king');
    expect(winners[0].awardCount).toBe(4);
    expect(winners[0].awards.map((a) => a.key)).toEqual([
      'strongest',
      'best_efficiency',
      'most_cores',
      'most_expensive',
    ]);
    expect(winners[0].awards[0].metricDisplay).toBe('95,0 điểm');

    // cpu-a-tie beats cpu-b-tie & cpu-c-tie by id alphabetical tie-breaker on best_value & cheapest
    const tieWinner = winners.find((w) => w.id === 'cpu-a-tie');
    expect(tieWinner).toBeDefined();
    expect(tieWinner!.awards.map((a) => a.key)).toEqual(['best_value', 'cheapest']);
    expect(tieWinner!.awards[1].metricDisplay).toBe('3.000.000 đ');

    // Fractional L3 cache uses 1 decimal place
    const fracWinner = winners.find((w) => w.id === 'cpu-cache-frac');
    expect(fracWinner?.awards.map((a) => a.key)).toEqual(['largest_cache']);
    expect(fracWinner?.awards[0].metricDisplay).toBe('128,5 MB L3');

    const ecoWinner = winners.find((w) => w.id === 'cpu-eco');
    expect(ecoWinner?.awards.map((a) => a.key)).toEqual(['lowest_power']);
    expect(ecoWinner?.awards[0].metricDisplay).toBe('70 W đỉnh (TDP 58 W)');

    // Integer L3 cache formatting branch (no decimal)
    const intCacheWinners = buildCpuAwards(
      candidates.filter((c) => c.id === 'cpu-king'),
    );
    const largestCacheBadge = intCacheWinners[0].awards.find((a) => a.key === 'largest_cache');
    expect(largestCacheBadge?.metricDisplay).toBe('96 MB L3');
  });

  it('evaluates all 9 GPU awards, prefers non-limited variants on ties, and groups awards', () => {
    expect(buildGpuAwards([])).toEqual([]);

    const candidates: GpuAwardCandidate[] = [
      {
        id: 'gpu-limited-5090',
        seriesName: 'NVIDIA GeForce RTX 5090',
        name: 'ASUS ROG Matrix RTX 5090 Limited',
        vendor: 'nvidia',
        aibBrand: 'ASUS',
        isLimitedEdition: true,
        priceVnd: 220_000_000,
        imageUrl: '/limited.webp',
        vramGb: 32,
        tbpW: 575,
        lengthMm: 358,
        slotThickness: 3.8,
        passmarkRaw: 39031,
        normalizedScore: 100.0,
      },
      {
        id: 'gpu-standard-5090',
        seriesName: 'NVIDIA GeForce RTX 5090',
        name: 'GIGABYTE RTX 5090 Gaming OC',
        vendor: 'nvidia',
        aibBrand: 'Gigabyte',
        isLimitedEdition: false,
        priceVnd: 95_000_000,
        imageUrl: '/std.webp',
        vramGb: 32,
        tbpW: 575,
        lengthMm: 342,
        slotThickness: 3.5,
        passmarkRaw: 39031,
        normalizedScore: 100.0,
      },
      {
        id: 'gpu-efficient-5070',
        seriesName: 'NVIDIA GeForce RTX 5070',
        name: 'MSI RTX 5070 Ventus',
        vendor: 'nvidia',
        aibBrand: 'MSI',
        isLimitedEdition: false,
        priceVnd: 16_000_000,
        imageUrl: null,
        vramGb: 12,
        tbpW: 250,
        lengthMm: 236,
        slotThickness: 2.0,
        passmarkRaw: 28682,
        normalizedScore: 73.5,
      },
      {
        id: 'gpu-compact-5050',
        seriesName: 'NVIDIA GeForce RTX 5050',
        name: 'ZOTAC RTX 5050 Solo',
        vendor: 'nvidia',
        aibBrand: 'ZOTAC',
        isLimitedEdition: false,
        priceVnd: 7_200_000,
        imageUrl: '/solo.webp',
        vramGb: 8,
        tbpW: 130,
        lengthMm: 165,
        slotThickness: 2.0,
        passmarkRaw: 16696,
        normalizedScore: 42.8,
      },
      {
        id: 'gpu-value-rx9060',
        seriesName: 'AMD Radeon RX 9060 XT',
        name: 'Sapphire Pulse RX 9060 XT',
        vendor: 'amd',
        aibBrand: 'Sapphire',
        isLimitedEdition: false,
        priceVnd: 8_990_000,
        imageUrl: null,
        vramGb: 16,
        tbpW: 160,
        lengthMm: 240,
        slotThickness: 2.2,
        passmarkRaw: 22400,
        normalizedScore: 58.0,
      },
    ];

    const winners = buildGpuAwards(candidates);
    expect(winners.reduce((sum, w) => sum + w.awardCount, 0)).toBe(9);

    // Standard RTX 5090 beats Limited RTX 5090 on tie for strongest & most_vram
    const std5090 = winners.find((w) => w.id === 'gpu-standard-5090');
    expect(std5090?.awards.map((a) => a.key)).toEqual(['strongest', 'most_vram']);

    // Limited RTX 5090 takes largest_gpu (358 mm) & most_expensive
    const limited5090 = winners.find((w) => w.id === 'gpu-limited-5090');
    expect(limited5090?.awards.map((a) => a.key)).toEqual(['largest_gpu', 'most_expensive']);
    expect(limited5090?.awards[0].metricDisplay).toBe('358 mm (3,8 slot)');

    // Tie-break on equal length prefers thicker slot
    const sizeTieWinners = buildGpuAwards([
      { ...candidates[1], id: 'gpu-thin', lengthMm: 360, slotThickness: 3.2 },
      { ...candidates[1], id: 'gpu-thick', lengthMm: 360, slotThickness: 4.5 },
    ]);
    const largestTie = sizeTieWinners.find((w) => w.awards.some((a) => a.key === 'largest_gpu'));
    expect(largestTie?.id).toBe('gpu-thick');
    expect(largestTie?.awards.find((a) => a.key === 'largest_gpu')?.metricDisplay).toBe(
      '360 mm (4,5 slot)',
    );

    // ZOTAC RTX 5050 Solo wins most_compact, lowest_power, cheapest (3 awards) -> sorted first
    expect(winners[0].id).toBe('gpu-compact-5050');
    expect(winners[0].awardCount).toBe(3);
    expect(winners[0].awards.map((a) => a.key)).toEqual([
      'most_compact',
      'lowest_power',
      'cheapest',
    ]);
    expect(winners[0].awards[0].metricDisplay).toBe('165 mm (2,0 slot)');
    expect(winners[0].awards[1].metricDisplay).toBe('130 W TBP');

    // RX 9060 XT wins best_value (58 / 8.99 = 6.45) & best_efficiency (22400 / 160 = 140.0)
    const rx9060 = winners.find((w) => w.id === 'gpu-value-rx9060');
    expect(rx9060?.awards.map((a) => a.key)).toEqual(['best_value', 'best_efficiency']);
  });
});
