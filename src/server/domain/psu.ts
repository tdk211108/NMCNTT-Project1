import 'server-only';

import { PSU_BASE_SYSTEM_W, PSU_HEADROOM_FACTOR, PSU_TIERS_W } from '@/shared/constants';
import type { PsuTierW } from '@/shared/types';

export interface PsuWattageCalculation {
  baseSystemW: 100;
  headroomFactor: 1.25;
  exactW: number;
  recommendedTierW: PsuTierW | null;
  exceedsMaxTier: boolean;
}

/**
 * Computes `(cpuPsuPowerW + gpuTbpW + 100) * 1.25` and rounds up to the nearest
 * standard PSU tier (`450`..`1200` W), or signals `exceedsMaxTier` above 1200 W.
 */
export function estimatePsuWattage(cpuPsuPowerW: number, gpuTbpW: number): PsuWattageCalculation {
  const exactW = (cpuPsuPowerW + gpuTbpW + PSU_BASE_SYSTEM_W) * PSU_HEADROOM_FACTOR;
  const matchedTier = PSU_TIERS_W.find((tier) => tier >= exactW) ?? null;

  return {
    baseSystemW: PSU_BASE_SYSTEM_W,
    headroomFactor: PSU_HEADROOM_FACTOR,
    exactW,
    recommendedTierW: matchedTier,
    exceedsMaxTier: matchedTier === null,
  };
}
