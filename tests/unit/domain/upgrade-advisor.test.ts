import { describe, expect, it } from 'vitest';
import {
  classifyRamPlatform,
  recommendCpuUpgrades,
  recommendGpuUpgrades,
  type UpgradeCpuCandidateInput,
  type UpgradeGpuVariantCandidateInput,
} from '@/server/domain/upgrade-advisor';
import type { UpgradeCurrentSummary } from '@/shared/types';

const CURRENT_LGA1700_STORE: UpgradeCurrentSummary = {
  id: 'store:cpu-i5-12400f',
  retailProductId: 'cpu-i5-12400f',
  category: 'cpu',
  source: 'store',
  name: 'Intel Core i5-12400F',
  vendor: 'intel',
  socket: 'LGA1700',
  coresTotal: 6,
  threadsTotal: 12,
  psuPowerW: 117,
  ramSupport: 'DDR5-4800 / DDR4-3200',
  vramGb: null,
  tbpW: null,
  passmarkRaw: 19520,
  normalizedScore: 27.8,
  hasPassmark: true,
};

const CURRENT_AM4_LEGACY: UpgradeCurrentSummary = {
  id: 'legacy:C19',
  retailProductId: null,
  category: 'cpu',
  source: 'legacy',
  name: 'AMD Ryzen 5 5600',
  vendor: 'amd',
  socket: 'AM4',
  coresTotal: 6,
  threadsTotal: 12,
  psuPowerW: 88,
  ramSupport: null,
  vramGb: null,
  tbpW: null,
  passmarkRaw: 21500,
  normalizedScore: null,
  hasPassmark: true,
};

const CURRENT_LEGACY_NO_PASSMARK: UpgradeCurrentSummary = {
  id: 'legacy:C99',
  retailProductId: null,
  category: 'cpu',
  source: 'legacy',
  name: 'Custom Unknown CPU',
  vendor: 'intel',
  socket: null,
  coresTotal: null,
  threadsTotal: null,
  psuPowerW: 90,
  ramSupport: null,
  vramGb: null,
  tbpW: null,
  passmarkRaw: null,
  normalizedScore: null,
  hasPassmark: false,
};

const CPU_CANDIDATES: UpgradeCpuCandidateInput[] = [
  {
    id: 'cpu-i5-12400f',
    name: 'Intel Core i5-12400F',
    vendor: 'intel',
    priceVnd: 4_290_000,
    imageUrl: null,
    socket: 'LGA1700',
    coresTotal: 6,
    threadsTotal: 12,
    psuPowerW: 117,
    ramSupport: 'DDR5-4800 / DDR4-3200',
    passmarkRaw: 19520,
    normalizedScore: 27.8,
  },
  {
    // 21,390 / 19,520 = +9.58% -> strictly below +10% threshold, must be filtered out
    id: 'cpu-i5-below-threshold',
    name: 'Intel Sidegrade',
    vendor: 'intel',
    priceVnd: 4_990_000,
    imageUrl: null,
    socket: 'LGA1700',
    coresTotal: 6,
    threadsTotal: 12,
    psuPowerW: 125,
    ramSupport: 'DDR5-4800 / DDR4-3200',
    passmarkRaw: 21390,
    normalizedScore: 30.5,
  },
  {
    id: 'cpu-i5-14600k',
    name: 'Intel Core i5-14600K',
    vendor: 'intel',
    priceVnd: 7_690_000,
    imageUrl: null,
    socket: 'LGA1700',
    coresTotal: 14,
    threadsTotal: 20,
    psuPowerW: 181, // +64W over 117W -> triggers cpu_power_increase
    ramSupport: 'DDR5-5600 / DDR4-3200',
    passmarkRaw: 38341,
    normalizedScore: 54.7,
  },
  {
    id: 'cpu-r5-7500f',
    name: 'AMD Ryzen 5 7500F',
    vendor: 'amd',
    priceVnd: 3_890_000,
    imageUrl: null,
    socket: 'AM5',
    coresTotal: 6,
    threadsTotal: 12,
    psuPowerW: 88,
    ramSupport: 'DDR5-5200',
    passmarkRaw: 26487,
    normalizedScore: 37.8,
  },
  {
    id: 'cpu-r7-9800x3d',
    name: 'AMD Ryzen 7 9800X3D',
    vendor: 'amd',
    priceVnd: 14_390_000,
    imageUrl: null,
    socket: 'AM5',
    coresTotal: 8,
    threadsTotal: 16,
    psuPowerW: 162,
    ramSupport: 'DDR5-5600',
    passmarkRaw: 39911,
    normalizedScore: 56.9,
  },
];

const CURRENT_GPU_3060_12G: UpgradeCurrentSummary = {
  id: 'G13',
  retailProductId: null,
  category: 'gpu',
  source: 'legacy',
  name: 'NVIDIA RTX 3060',
  vendor: 'nvidia',
  socket: null,
  coresTotal: null,
  threadsTotal: null,
  psuPowerW: null,
  ramSupport: null,
  vramGb: 12,
  tbpW: 170,
  passmarkRaw: 17000,
  normalizedScore: null,
  hasPassmark: true,
};

const CURRENT_GPU_STORE_5070: UpgradeCurrentSummary = {
  id: 'gs-rtx-5070',
  retailProductId: 'gpu-zotac-rtx-5070',
  category: 'gpu',
  source: 'store',
  name: 'NVIDIA GeForce RTX 5070',
  vendor: 'nvidia',
  socket: null,
  coresTotal: null,
  threadsTotal: null,
  psuPowerW: null,
  ramSupport: null,
  vramGb: 12,
  tbpW: 250,
  passmarkRaw: 28682,
  normalizedScore: 73.5,
  hasPassmark: true,
};

const GPU_VARIANTS: UpgradeGpuVariantCandidateInput[] = [
  {
    id: 'gpu-rtx-5060-a',
    seriesId: 'gs-rtx-5060',
    seriesName: 'NVIDIA GeForce RTX 5060',
    name: 'RTX 5060 Limited',
    aibBrand: 'ASUS',
    isLimitedEdition: true,
    vendor: 'nvidia',
    priceVnd: 8_990_000,
    imageUrl: null,
    vramGb: 8, // lower than 12GB -> gpu_vram_decrease
    tbpW: 145,
    lengthMm: 220,
    slotThickness: 2.0,
    passmarkRaw: 20581,
    normalizedScore: 52.7,
  },
  {
    id: 'gpu-rtx-5060-b',
    seriesId: 'gs-rtx-5060',
    seriesName: 'NVIDIA GeForce RTX 5060',
    name: 'RTX 5060 Standard',
    aibBrand: 'ZOTAC',
    isLimitedEdition: false,
    vendor: 'nvidia',
    priceVnd: 8_990_000,
    imageUrl: null,
    vramGb: 8,
    tbpW: 145,
    lengthMm: 220,
    slotThickness: 2.0,
    passmarkRaw: 20581,
    normalizedScore: 52.7,
  },
  {
    id: 'gpu-rtx-5060-c',
    seriesId: 'gs-rtx-5060',
    seriesName: 'NVIDIA GeForce RTX 5060',
    name: 'RTX 5060 OC Expensive',
    aibBrand: 'MSI',
    isLimitedEdition: false,
    vendor: 'nvidia',
    priceVnd: 10_500_000,
    imageUrl: null,
    vramGb: 8,
    tbpW: 145,
    lengthMm: 250,
    slotThickness: 2.2,
    passmarkRaw: 20581,
    normalizedScore: 52.7,
  },
  {
    id: 'gpu-rx-9070',
    seriesId: 'gs-rx-9070',
    seriesName: 'AMD Radeon RX 9070',
    name: 'Gigabyte RX 9070',
    aibBrand: 'GIGABYTE',
    isLimitedEdition: false,
    vendor: 'amd',
    priceVnd: 16_500_000,
    imageUrl: null,
    vramGb: 16, // +4GB -> gpu_vram_increase
    tbpW: 215, // +45W over 170W -> gpu_tbp_moderate
    lengthMm: 280,
    slotThickness: 3.1, // >= 3.0 slot -> gpu_large_size
    passmarkRaw: 25373,
    normalizedScore: 65.0,
  },
  {
    id: 'gpu-rtx-5080',
    seriesId: 'gs-rtx-5080',
    seriesName: 'NVIDIA GeForce RTX 5080',
    name: 'ZOTAC RTX 5080 Solid',
    aibBrand: 'ZOTAC',
    isLimitedEdition: false,
    vendor: 'nvidia',
    priceVnd: 32_000_000,
    imageUrl: null,
    vramGb: 16,
    tbpW: 360, // +190W over 170W -> gpu_tbp_high
    lengthMm: 330, // >= 300mm -> gpu_large_size
    slotThickness: 3.5,
    passmarkRaw: 35660,
    normalizedScore: 91.4,
  },
  {
    id: 'gpu-zotac-rtx-5070',
    seriesId: 'gs-rtx-5070',
    seriesName: 'NVIDIA GeForce RTX 5070',
    name: 'ZOTAC RTX 5070',
    aibBrand: 'ZOTAC',
    isLimitedEdition: false,
    vendor: 'nvidia',
    priceVnd: 18_000_000,
    imageUrl: null,
    vramGb: 12,
    tbpW: 250,
    lengthMm: 290,
    slotThickness: 2.5,
    passmarkRaw: 28682,
    normalizedScore: 73.5,
  },
];

describe('domain/upgrade-advisor', () => {
  it('classifies RAM generation from ramSupport and legacy socket fallbacks', () => {
    expect(classifyRamPlatform('LGA1700', 'DDR5-5600 / DDR4-3200')).toBe('ddr4_and_ddr5');
    expect(classifyRamPlatform('AM5', 'DDR5-5600')).toBe('ddr5_only');
    expect(classifyRamPlatform('LGA1200', 'DDR4-3200')).toBe('ddr4_only');
    expect(classifyRamPlatform('LGA1151', 'LPDDR3')).toBe('ddr4_only');
    expect(classifyRamPlatform('AM4', null)).toBe('ddr4_only');
    expect(classifyRamPlatform('LGA1700', null)).toBe('ddr4_and_ddr5');
    expect(classifyRamPlatform('LGA1851', null)).toBe('ddr5_only');
    expect(classifyRamPlatform(null, null)).toBe('unknown');
  });

  it('splits same-socket and platform-swap CPU upgrades and respects +10% uplift threshold', () => {
    const storeRes = recommendCpuUpgrades({
      current: CURRENT_LGA1700_STORE,
      candidates: CPU_CANDIDATES,
    });

    expect(storeRes.isTopTier).toBe(false);
    expect(storeRes.hasSameSocketInCatalog).toBe(true);
    expect(storeRes.sameSocketCpus.map((c) => c.id)).toEqual(['cpu-i5-14600k']);
    expect(storeRes.sameSocketCpus[0].upliftPct).toBe(96);
    expect(storeRes.sameSocketCpus[0].compareHref).toBe(
      '/compare?ids=cpu-i5-12400f%2Ccpu-i5-14600k',
    );
    expect(storeRes.sameSocketCpus[0].warnings.map((w) => w.code)).toEqual([
      'cpu_power_increase',
    ]);
    expect(storeRes.platformSwapCpus.map((c) => c.id)).toEqual([
      'cpu-r7-9800x3d',
      'cpu-r5-7500f',
    ]);
    expect(storeRes.platformSwapCpus[0].warnings.map((w) => w.code)).toEqual([
      'socket_change',
      'cpu_power_increase',
    ]);

    const sameSocketFiltered = recommendCpuUpgrades({
      current: CURRENT_LGA1700_STORE,
      candidates: CPU_CANDIDATES,
      sameSocketOnly: true,
    });
    expect(sameSocketFiltered.platformSwapCpus).toEqual([]);
    expect(sameSocketFiltered.sameSocketCpus).toHaveLength(1);
  });

  it('generates DDR5 and LGA1700 DDR4/DDR5 RAM warnings for AM4 legacy CPUs and handles missing PassMark', () => {
    const legacyRes = recommendCpuUpgrades({
      current: CURRENT_AM4_LEGACY,
      candidates: CPU_CANDIDATES,
      sort: 'uplift_desc',
    });

    expect(legacyRes.hasSameSocketInCatalog).toBe(false);
    expect(legacyRes.sameSocketCpus).toEqual([]);
    const i5_14600k = legacyRes.platformSwapCpus.find((c) => c.id === 'cpu-i5-14600k');
    const r7_9800x3d = legacyRes.platformSwapCpus.find((c) => c.id === 'cpu-r7-9800x3d');
    expect(i5_14600k?.warnings.map((w) => w.code)).toEqual([
      'socket_change',
      'ram_ddr4_or_ddr5',
      'cpu_power_increase',
    ]);
    expect(r7_9800x3d?.warnings.map((w) => w.code)).toEqual([
      'socket_change',
      'ram_ddr5_required',
      'cpu_power_increase',
    ]);

    // Missing PassMark degrades gracefully: shows all candidates with upliftPct = null
    // Also psuPowerW = null skips CPU power delta warning cleanly
    const noPassmark = recommendCpuUpgrades({
      current: { ...CURRENT_LEGACY_NO_PASSMARK, psuPowerW: null },
      candidates: CPU_CANDIDATES,
      vendor: ['amd'],
      budgetVnd: 20_000_000,
      sort: 'perf_per_price_desc',
    });
    expect(noPassmark.isTopTier).toBe(false);
    expect(noPassmark.platformSwapCpus).toHaveLength(2);
    expect(noPassmark.platformSwapCpus.every((c) => c.upliftPct === null)).toBe(true);
    expect(noPassmark.minUpgradePriceVnd).toBe(3_890_000);

    // Top-tier / zero eligible
    const topTier = recommendCpuUpgrades({
      current: { ...CURRENT_LGA1700_STORE, passmarkRaw: 99_000 },
      candidates: CPU_CANDIDATES,
    });
    expect(topTier.isTopTier).toBe(true);
    expect(topTier.minUpgradePriceVnd).toBeNull();
  });

  it('groups GPU upgrades by series, computes VRAM/TBP/size warnings, and handles sorts & missing fields', () => {
    const gpuRes = recommendGpuUpgrades({
      current: CURRENT_GPU_3060_12G,
      variants: GPU_VARIANTS,
      sort: 'price_asc',
    });

    // 4 eligible GPU series exist -> capped to top 3 sorted by price_asc; gs-rtx-5080 is verified via uplift_desc below
    expect(gpuRes.gpus.map((g) => g.seriesId)).toEqual([
      'gs-rtx-5060',
      'gs-rx-9070',
      'gs-rtx-5070',
    ]);

    const rep5060 = gpuRes.gpus[0];
    expect(rep5060.id).toBe('gpu-rtx-5060-b'); // non-limited tie-break winner
    expect(rep5060.variantCount).toBe(3);
    expect(rep5060.aibVariantsHref).toBe('/gpu?series=gs-rtx-5060');
    expect(rep5060.warnings.map((w) => w.code)).toEqual(['gpu_vram_decrease']);

    const rep9070 = gpuRes.gpus[1];
    expect(rep9070.warnings.map((w) => w.code)).toEqual([
      'gpu_tbp_moderate',
      'gpu_large_size',
      'gpu_vram_increase',
    ]);

    const topUpliftGpuRes = recommendGpuUpgrades({
      current: CURRENT_GPU_3060_12G,
      variants: GPU_VARIANTS,
      sort: 'uplift_desc',
    });
    expect(topUpliftGpuRes.gpus).toHaveLength(3);
    expect(topUpliftGpuRes.gpus[0].seriesId).toBe('gs-rtx-5080');
    expect(topUpliftGpuRes.gpus[0].warnings.map((w) => w.code)).toEqual([
      'gpu_tbp_high',
      'gpu_large_size',
      'gpu_vram_increase',
    ]);

    // Caps both CPU groups at max 3 results while keeping minUpgradePriceVnd over full eligible pool
    const extraCpuCandidates: UpgradeCpuCandidateInput[] = [
      ...CPU_CANDIDATES,
      { ...CPU_CANDIDATES[2], id: 'cpu-lga-2', name: 'LGA 2', priceVnd: 8_200_000, passmarkRaw: 39000, normalizedScore: 56 },
      { ...CPU_CANDIDATES[2], id: 'cpu-lga-3', name: 'LGA 3', priceVnd: 9_000_000, passmarkRaw: 41000, normalizedScore: 59 },
      { ...CPU_CANDIDATES[2], id: 'cpu-lga-4', name: 'LGA 4', priceVnd: 6_500_000, passmarkRaw: 36000, normalizedScore: 51 },
      { ...CPU_CANDIDATES[3], id: 'cpu-am5-2', name: 'AM5 2', priceVnd: 3_500_000, passmarkRaw: 27000, normalizedScore: 39 },
      { ...CPU_CANDIDATES[3], id: 'cpu-am5-3', name: 'AM5 3', priceVnd: 11_000_000, passmarkRaw: 43000, normalizedScore: 62 },
    ];
    const cappedCpuRes = recommendCpuUpgrades({
      current: CURRENT_LGA1700_STORE,
      candidates: extraCpuCandidates,
    });
    expect(cappedCpuRes.sameSocketCpus).toHaveLength(3);
    expect(cappedCpuRes.platformSwapCpus).toHaveLength(3);
    expect(cappedCpuRes.minUpgradePriceVnd).toBe(3_500_000);

    // Store GPU as current excludes its own series and builds compareHref
    const storeGpuRes = recommendGpuUpgrades({
      current: CURRENT_GPU_STORE_5070,
      variants: [
        ...GPU_VARIANTS,
        {
          // Tie on PassMark/uplift with gs-rtx-5080 but cheaper -> hits tie-breaker + cheaper rep
          ...GPU_VARIANTS[4],
          id: 'gpu-rtx-5080-tie',
          seriesId: 'gs-rtx-5080-tie',
          seriesName: 'Series Tie 5080',
          priceVnd: 29_000_000,
        },
        {
          ...GPU_VARIANTS[4],
          id: 'gpu-rtx-5080-tie-cheaper',
          seriesId: 'gs-rtx-5080-tie',
          seriesName: 'Series Tie 5080',
          priceVnd: 28_000_000,
        },
      ],
      vendor: ['nvidia'],
      budgetVnd: 10_000_000, // lower than 28M
      sort: 'recommended',
    });
    expect(storeGpuRes.isTopTier).toBe(false);
    expect(storeGpuRes.minUpgradePriceVnd).toBe(28_000_000);
    expect(storeGpuRes.gpus).toEqual([]);

    // Recommended sort with equal upliftPct falls back to perfPerPrice desc
    const tieSortRes = recommendGpuUpgrades({
      current: CURRENT_GPU_STORE_5070,
      variants: [
        GPU_VARIANTS[4],
        {
          ...GPU_VARIANTS[4],
          id: 'gpu-rtx-5080-tie-2',
          seriesId: 'gs-rtx-5080-tie',
          seriesName: 'Series Tie 5080',
          priceVnd: 28_000_000,
        },
      ],
      sort: 'recommended',
    });
    expect(tieSortRes.gpus.map((g) => g.seriesId)).toEqual(['gs-rtx-5080-tie', 'gs-rtx-5080']);

    // Top tier GPU & null-current power path
    const gpuTopTier = recommendGpuUpgrades({
      current: { ...CURRENT_GPU_STORE_5070, passmarkRaw: 99_000 },
      variants: GPU_VARIANTS,
    });
    expect(gpuTopTier.isTopTier).toBe(true);
    expect(gpuTopTier.minUpgradePriceVnd).toBeNull();

    const gpuNoPassmark = recommendGpuUpgrades({
      current: { ...CURRENT_GPU_STORE_5070, passmarkRaw: null, hasPassmark: false, vramGb: null, tbpW: null },
      variants: GPU_VARIANTS,
      sort: 'uplift_desc',
    });
    expect(gpuNoPassmark.gpus.length).toBeGreaterThan(0);
    expect(gpuNoPassmark.gpus[0].compareHref).toContain('/compare?ids=');
    expect(gpuNoPassmark.gpus[0].upliftPct).toBeNull();
  });
});
