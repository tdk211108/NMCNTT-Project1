import { describe, expect, it } from 'vitest';
import {
  recommendCombos,
  selectRepresentativeGpus,
  type ComboCpuInput,
  type ComboGpuVariantInput,
} from '@/server/domain/combo-advisor';
import { estimatePsuWattage } from '@/server/domain/psu';

const CPU_LOW: ComboCpuInput = {
  id: 'cpu-low',
  name: 'Budget CPU',
  vendor: 'intel',
  socket: 'LGA1700',
  coresTotal: 4,
  threadsTotal: 8,
  psuPowerW: 89,
  priceVnd: 3_000_000,
  imageUrl: null,
  passmarkRaw: 14000,
  normalizedScore: 25,
};

const CPU_MID: ComboCpuInput = {
  id: 'cpu-mid',
  name: 'Balanced CPU',
  vendor: 'amd',
  socket: 'AM5',
  coresTotal: 8,
  threadsTotal: 16,
  psuPowerW: 120,
  priceVnd: 7_000_000,
  imageUrl: '/cpu-mid.webp',
  passmarkRaw: 35000,
  normalizedScore: 55,
};

const CPU_HIGH: ComboCpuInput = {
  id: 'cpu-high',
  name: 'High CPU',
  vendor: 'amd',
  socket: 'AM5',
  coresTotal: 16,
  threadsTotal: 32,
  psuPowerW: 200,
  priceVnd: 13_000_000,
  imageUrl: null,
  passmarkRaw: 65000,
  normalizedScore: 95,
};

const GPU_SERIES_A_LIMITED: ComboGpuVariantInput = {
  id: 'gpu-a-limited',
  seriesId: 'gs-a',
  seriesName: 'Series A 8GB',
  name: 'Series A Limited',
  vendor: 'amd',
  aibBrand: 'ASUS',
  isLimitedEdition: true,
  vramGb: 8,
  tbpW: 150,
  priceVnd: 8_000_000,
  imageUrl: null,
  passmarkRaw: 19000,
  normalizedScore: 45,
};

const GPU_SERIES_A_STD: ComboGpuVariantInput = {
  id: 'gpu-a-std',
  seriesId: 'gs-a',
  seriesName: 'Series A 8GB',
  name: 'Series A Standard',
  vendor: 'amd',
  aibBrand: 'GIGABYTE',
  isLimitedEdition: false,
  vramGb: 8,
  tbpW: 150,
  priceVnd: 8_000_000,
  imageUrl: null,
  passmarkRaw: 19000,
  normalizedScore: 45,
};

const GPU_SERIES_A_EXPENSIVE: ComboGpuVariantInput = {
  id: 'gpu-a-exp',
  seriesId: 'gs-a',
  seriesName: 'Series A 8GB',
  name: 'Series A OC',
  vendor: 'amd',
  aibBrand: 'MSI',
  isLimitedEdition: false,
  vramGb: 8,
  tbpW: 150,
  priceVnd: 9_500_000,
  imageUrl: null,
  passmarkRaw: 19000,
  normalizedScore: 45,
};

const GPU_SERIES_B_AMD_16GB: ComboGpuVariantInput = {
  id: 'gpu-b-amd',
  seriesId: 'gs-b',
  seriesName: 'Series B 16GB',
  name: 'Series B AMD 16GB',
  vendor: 'amd',
  aibBrand: 'Sapphire',
  isLimitedEdition: false,
  vramGb: 16,
  tbpW: 220,
  priceVnd: 12_500_000,
  imageUrl: null,
  passmarkRaw: 25000,
  normalizedScore: 65,
};

const GPU_SERIES_C_NV_12GB: ComboGpuVariantInput = {
  id: 'gpu-c-nv',
  seriesId: 'gs-c',
  seriesName: 'Series C 12GB',
  name: 'Series C NVIDIA 12GB',
  vendor: 'nvidia',
  aibBrand: 'MSI',
  isLimitedEdition: false,
  vramGb: 12,
  tbpW: 250,
  priceVnd: 13_000_000,
  imageUrl: null,
  passmarkRaw: 25000,
  normalizedScore: 65,
};

const GPU_SERIES_D_NV_24GB: ComboGpuVariantInput = {
  id: 'gpu-d-nv',
  seriesId: 'gs-d',
  seriesName: 'Series D 24GB',
  name: 'Series D NVIDIA 24GB',
  vendor: 'nvidia',
  aibBrand: 'ASUS',
  isLimitedEdition: false,
  vramGb: 24,
  tbpW: 360,
  priceVnd: 17_900_000,
  imageUrl: null,
  passmarkRaw: 37000,
  normalizedScore: 95,
};

describe('domain/combo-advisor', () => {
  it('picks cheapest non-limited variant per GPU series', () => {
    const reps = selectRepresentativeGpus([
      GPU_SERIES_A_LIMITED,
      GPU_SERIES_A_EXPENSIVE,
      GPU_SERIES_A_STD,
      GPU_SERIES_B_AMD_16GB,
    ]);
    expect(reps).toHaveLength(2);
    expect(reps.find((g) => g.seriesId === 'gs-a')?.id).toBe('gpu-a-std');
  });

  it('handles empty catalog and below-minimum budget with cheapest reference pair', () => {
    const empty = recommendCombos({
      budgetVnd: 20_000_000,
      purpose: 'gaming_aaa',
      cpus: [],
      gpus: [GPU_SERIES_A_STD],
    });
    expect(empty.combos).toEqual([]);
    expect(empty.minAvailableComboPriceVnd).toBeNull();
    expect(empty.cheapestReferenceCombo).toBeNull();

    const tooLow = recommendCombos({
      budgetVnd: 9_000_000,
      purpose: 'gaming_aaa',
      cpus: [CPU_MID, CPU_LOW],
      gpus: [GPU_SERIES_B_AMD_16GB, GPU_SERIES_A_STD],
    });
    expect(tooLow.combos).toEqual([]);
    expect(tooLow.minAvailableComboPriceVnd).toBe(11_000_000);
    expect(tooLow.cheapestReferenceCombo).toMatchObject({
      cpuId: 'cpu-low',
      gpuId: 'gpu-a-std',
      totalPriceVnd: 11_000_000,
    });
  });

  it('applies distinct scoring profiles (work_ai prioritizes NVIDIA + high VRAM, esport splits 50/50)', () => {
    // At equal GPU normalizedScore=65, gaming_aaa gives 16GB slightly more bonus than 12GB,
    // while work_ai gives NVIDIA CUDA +8 so NVIDIA 12GB (3+8=+11) beats AMD 16GB (+6).
    const gamingAaa12vs16 = recommendCombos({
      budgetVnd: 22_000_000,
      purpose: 'gaming_aaa',
      cpus: [CPU_MID],
      gpus: [GPU_SERIES_B_AMD_16GB, GPU_SERIES_C_NV_12GB],
    });
    expect(gamingAaa12vs16.combos).toHaveLength(2);
    expect(gamingAaa12vs16.combos[0].gpu.seriesId).toBe('gs-b');

    const workAi = recommendCombos({
      budgetVnd: 22_000_000,
      purpose: 'work_ai',
      cpus: [CPU_MID],
      gpus: [GPU_SERIES_B_AMD_16GB, GPU_SERIES_C_NV_12GB],
    });
    expect(workAi.targetGpuSharePct).toBe(55);
    expect(workAi.targetCpuSharePct).toBe(45);
    expect(workAi.combos[0].gpu.seriesId).toBe('gs-c');

    const esport = recommendCombos({
      budgetVnd: 21_000_000,
      purpose: 'esport',
      cpus: [CPU_LOW, CPU_MID, CPU_HIGH],
      gpus: [GPU_SERIES_A_STD, GPU_SERIES_B_AMD_16GB, GPU_SERIES_C_NV_12GB],
    });
    expect(esport.targetGpuSharePct).toBe(50);
    expect(esport.targetCpuSharePct).toBe(50);
    expect(esport.combos.length).toBeGreaterThan(0);

    // 24GB NVIDIA tier in work_ai
    const highWorkAi = recommendCombos({
      budgetVnd: 40_000_000,
      purpose: 'work_ai',
      cpus: [CPU_MID, CPU_HIGH],
      gpus: [GPU_SERIES_D_NV_24GB, GPU_SERIES_B_AMD_16GB, GPU_SERIES_A_STD],
    });
    expect(highWorkAi.combos[0].gpu.seriesId).toBe('gs-d');
  });

  it('recommends +5% stretch combo when performance gain exceeds threshold and deduplicates GPU series', () => {
    // Budget 20,000,000 allows stretch up to 21,000,000.
    // CPU_LOW (3M) + GPU_SERIES_D_NV_24GB (17.9M) = 20.9M (+4.5% stretch) with much higher GPU score!
    const result = recommendCombos({
      budgetVnd: 20_000_000,
      purpose: 'gaming_aaa',
      cpus: [CPU_LOW, CPU_MID],
      gpus: [GPU_SERIES_A_STD, GPU_SERIES_B_AMD_16GB, GPU_SERIES_D_NV_24GB],
    });

    expect(result.combos).toHaveLength(3);
    const seriesIds = result.combos.map((c) => c.gpu.seriesId);
    expect(new Set(seriesIds).size).toBe(3);

    expect(result.combos[0].role).toBe('best_overall');
    expect(result.combos[0].isOverBudget).toBe(false);

    const stretchCard = result.combos.find((c) => c.role === 'performance_stretch');
    expect(stretchCard).toBeDefined();
    expect(stretchCard?.isOverBudget).toBe(true);
    expect(stretchCard?.overBudgetPct).toBe(4.5);
    expect(stretchCard?.budgetDeltaVnd).toBe(-900_000);

    expect(result.combos[2].role).toBe('best_value');

    // PSU summary must match estimatePsuWattage strictly
    for (const combo of result.combos) {
      const expectedPsu = estimatePsuWattage(combo.cpu.psuPowerW, combo.gpu.tbpW);
      expect(combo.psu.exactW).toBe(expectedPsu.exactW);
      expect(combo.psu.recommendedTierW).toBe(expectedPsu.recommendedTierW);
      expect(combo.psu.exceedsMaxTier).toBe(expectedPsu.exceedsMaxTier);
    }
  });

  it('fills slots gracefully when only stretch fits or when only 1-2 series exist', () => {
    // Budget 10,600,000: CPU_LOW (3M) + GPU_A (8M) = 11M (+3.8% stretch), nothing strictly <= 10.6M
    const onlyStretch = recommendCombos({
      budgetVnd: 10_600_000,
      purpose: 'gaming_aaa',
      cpus: [CPU_LOW],
      gpus: [GPU_SERIES_A_STD],
    });
    expect(onlyStretch.combos).toHaveLength(1);
    expect(onlyStretch.combos[0].role).toBe('performance_stretch');

    // Multiple distinct series only inside stretch -> fills up to 3 stretch cards reusing CPU_LOW cleanly
    const threeStretch = recommendCombos({
      budgetVnd: 16_000_000,
      purpose: 'esport',
      cpus: [CPU_LOW],
      gpus: [
        { ...GPU_SERIES_A_STD, seriesId: 's1', priceVnd: 13_200_000 },
        { ...GPU_SERIES_B_AMD_16GB, seriesId: 's2', priceVnd: 13_400_000 },
        { ...GPU_SERIES_C_NV_12GB, seriesId: 's3', priceVnd: 13_600_000 },
      ],
    });
    expect(threeStretch.combos).toHaveLength(3);
    expect(threeStretch.combos.every((c) => c.role === 'performance_stretch')).toBe(true);

    // Mix: 1 in-budget + 1 stretch (below +8% jump so no stretch slot2) + 1 GPU focus fallback
    const oneInBudgetOneStretch = recommendCombos({
      budgetVnd: 15_000_000,
      purpose: 'esport',
      cpus: [CPU_LOW],
      gpus: [
        { ...GPU_SERIES_A_STD, seriesId: 's-in', priceVnd: 12_000_000, normalizedScore: 60 },
        { ...GPU_SERIES_C_NV_12GB, seriesId: 's-out', priceVnd: 12_400_000, normalizedScore: 61 },
      ],
    });
    expect(oneInBudgetOneStretch.combos).toHaveLength(2);
    expect(oneInBudgetOneStretch.combos[0].role).toBe('best_overall');
    expect(oneInBudgetOneStretch.combos[1].role).toBe('performance_stretch');
  });
});
