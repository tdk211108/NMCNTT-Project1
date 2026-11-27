import 'server-only';

import {
  CART_CPU_HIGH_POWER_W,
  CART_GPU_STANDALONE_WARN_TBP_W,
  CART_PAIR_SCORE_GAP_WARN,
  UPGRADE_GPU_LARGE_LENGTH_MM,
  UPGRADE_GPU_THICK_SLOT,
} from '@/shared/constants';
import type {
  CartAdvisoryItem,
  CartAdvisorySeverity,
  CartAdvisorySummary,
} from '@/shared/types';
import { estimatePsuWattage } from './psu';
import { classifyRamPlatform } from './upgrade-advisor';

export interface CartCpuSpecInput {
  category: 'cpu';
  productId: string;
  name: string;
  quantity: number;
  socket: string;
  ramSupport: string;
  psuPowerW: number;
  normalizedScore: number;
}

export interface CartGpuSpecInput {
  category: 'gpu';
  productId: string;
  name: string;
  quantity: number;
  seriesId: string;
  tbpW: number;
  lengthMm: number;
  slotThickness: number;
  normalizedScore: number;
}

export type CartAdvisorySpecInput = CartCpuSpecInput | CartGpuSpecInput;

export const EMPTY_CART_ADVISORIES: CartAdvisorySummary = {
  items: [],
  recommendedPsuTierW: null,
  recommendedPsuExactW: null,
  psuExceedsMaxTier: false,
};

const SEVERITY_ORDER: Record<CartAdvisorySeverity, number> = {
  high: 0,
  medium: 1,
  info: 2,
};

function pickMaxBy<T>(items: readonly T[], selector: (item: T) => number): T | null {
  if (items.length === 0) return null;
  let best = items[0]!;
  for (let i = 1; i < items.length; i += 1) {
    const candidate = items[i]!;
    if (selector(candidate) > selector(best)) {
      best = candidate;
    }
  }
  return best;
}

/**
 * Evaluates concise technical advisories (PSU wattage, socket/RAM platform,
 * multi-CPU/GPU conflicts, GPU clearance, and pair balance) for active cart lines.
 */
export function evaluateCartAdvisories(
  specs: readonly CartAdvisorySpecInput[],
): CartAdvisorySummary {
  if (specs.length === 0) {
    return EMPTY_CART_ADVISORIES;
  }

  const cpus = specs.filter((item): item is CartCpuSpecInput => item.category === 'cpu');
  const gpus = specs.filter((item): item is CartGpuSpecInput => item.category === 'gpu');
  const items: CartAdvisoryItem[] = [];

  // 1. Multi-CPU and multi-GPU checks.
  const distinctSockets: string[] = [];
  for (const cpu of cpus) {
    if (cpu.socket && !distinctSockets.includes(cpu.socket)) {
      distinctSockets.push(cpu.socket);
    }
  }
  const totalCpuQty = cpus.reduce((sum, cpu) => sum + cpu.quantity, 0);
  if (distinctSockets.length > 1) {
    items.push({
      code: 'multi_cpu_conflict',
      severity: 'high',
      sockets: distinctSockets,
      count: totalCpuQty,
    });
  } else if (totalCpuQty > 1) {
    items.push({
      code: 'multi_cpu_conflict',
      severity: 'high',
      count: totalCpuQty,
    });
  }

  const totalGpuQty = gpus.reduce((sum, gpu) => sum + gpu.quantity, 0);
  if (totalGpuQty > 1) {
    items.push({
      code: 'multi_gpu_conflict',
      severity: 'medium',
      count: totalGpuQty,
      distinctModels: gpus.length,
    });
  }

  // 2. Socket + RAM generation notice for each distinct CPU platform in the cart.
  const seenPlatforms = new Set<string>();
  for (const cpu of cpus) {
    if (!cpu.socket) continue;
    const ramPlatform = classifyRamPlatform(cpu.socket, cpu.ramSupport);
    if (ramPlatform === 'unknown') continue;
    const platformKey = `${cpu.socket}:${ramPlatform}`;
    if (seenPlatforms.has(platformKey)) continue;
    seenPlatforms.add(platformKey);
    items.push({
      code: 'cpu_ram_platform',
      severity: ramPlatform === 'ddr5_only' ? 'medium' : 'info',
      sockets: [cpu.socket],
      ramKind: ramPlatform,
    });
  }

  // 3. Combined PSU recommendation (highest-load pair) or standalone high-wattage notices.
  const maxCpu = pickMaxBy(cpus, (item) => item.psuPowerW);
  const maxGpu = pickMaxBy(gpus, (item) => item.tbpW);
  const isMultiHardware = totalCpuQty > 1 || totalGpuQty > 1;
  let recommendedPsuTierW: number | null = null;
  let recommendedPsuExactW: number | null = null;
  let psuExceedsMaxTier = false;

  if (maxCpu && maxGpu) {
    const psu = estimatePsuWattage(maxCpu.psuPowerW, maxGpu.tbpW);
    recommendedPsuTierW = psu.recommendedTierW;
    recommendedPsuExactW = Math.round(psu.exactW);
    psuExceedsMaxTier = psu.exceedsMaxTier;

    items.push({
      code: 'psu_recommendation',
      severity: psu.exceedsMaxTier
        ? 'high'
        : psu.recommendedTierW! >= 850
          ? 'medium'
          : 'info',
      psuTierW: recommendedPsuTierW,
      psuExactW: recommendedPsuExactW,
      psuExceedsMaxTier,
      ...(isMultiHardware
        ? {
            cpuName: maxCpu.name,
            gpuName: maxGpu.name,
            isMultiHardware: true,
          }
        : {}),
      actionKind: 'psu',
      actionHref: `/tools/psu?cpu=${encodeURIComponent(`store:${maxCpu.productId}`)}&gpu=${encodeURIComponent(maxGpu.seriesId)}`,
    });
  } else if (gpus.length > 0) {
    const highPowerGpus = gpus.filter((gpu) => gpu.tbpW >= CART_GPU_STANDALONE_WARN_TBP_W);
    const topGpu = pickMaxBy(highPowerGpus, (gpu) => gpu.tbpW);
    if (topGpu) {
      items.push({
        code: 'psu_recommendation',
        severity: 'medium',
        productName: topGpu.name,
        wattageW: topGpu.tbpW,
        ...(highPowerGpus.length > 1 ? { otherCount: highPowerGpus.length - 1 } : {}),
        actionKind: 'psu',
        actionHref: `/tools/psu?gpu=${encodeURIComponent(topGpu.seriesId)}`,
      });
    }
  } else {
    const highPowerCpus = cpus.filter((cpu) => cpu.psuPowerW >= CART_CPU_HIGH_POWER_W);
    const topCpu = pickMaxBy(highPowerCpus, (cpu) => cpu.psuPowerW);
    if (topCpu) {
      items.push({
        code: 'psu_recommendation',
        severity: 'info',
        productName: topCpu.name,
        wattageW: topCpu.psuPowerW,
        ...(highPowerCpus.length > 1 ? { otherCount: highPowerCpus.length - 1 } : {}),
        actionKind: 'psu',
        actionHref: `/tools/psu?cpu=${encodeURIComponent(`store:${topCpu.productId}`)}`,
      });
    }
  }

  // 4. Physical chassis clearance notice for every oversized GPU model in the cart.
  const oversizedGpus = gpus
    .filter(
      (gpu) =>
        gpu.lengthMm >= UPGRADE_GPU_LARGE_LENGTH_MM ||
        gpu.slotThickness >= UPGRADE_GPU_THICK_SLOT,
    )
    .sort(
      (a, b) =>
        b.lengthMm * 100 + b.slotThickness - (a.lengthMm * 100 + a.slotThickness),
    );
  for (const gpu of oversizedGpus) {
    items.push({
      code: 'gpu_large_size',
      severity: 'medium',
      productName: gpu.name,
      lengthMm: gpu.lengthMm,
      slotThickness: gpu.slotThickness,
    });
  }

  // 5. Pair balance requires one CPU and one GPU model to avoid guessing pairings in multi-part carts.
  if (cpus.length === 1 && gpus.length === 1) {
    const cpuScore = Math.round(cpus[0]!.normalizedScore);
    const gpuScore = Math.round(gpus[0]!.normalizedScore);
    if (Math.abs(cpuScore - gpuScore) >= CART_PAIR_SCORE_GAP_WARN) {
      items.push({
        code: 'pair_imbalance',
        severity: 'info',
        cpuScore,
        gpuScore,
        actionKind: 'combo',
        actionHref: '/tools/combo',
      });
    }
  }

  items.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return {
    items,
    recommendedPsuTierW,
    recommendedPsuExactW,
    psuExceedsMaxTier,
  };
}
