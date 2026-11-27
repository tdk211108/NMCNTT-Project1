import 'server-only';

import { formatNumberVi } from '@/lib/format';
import type { GpuVendor } from '@/shared/types';

export { formatNumberVi as formatViNumber };

export interface RepresentativeGpuCandidate {
  id: string;
  priceVnd: number;
  isLimitedEdition: boolean;
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  // Tiny bias avoids binary float artifacts such as 1.005 * 100 -> 100.49999999999999
  return Math.round((value + 1e-12) * factor) / factor;
}

export function formatCpuCoresThreads(
  coresTotal: number,
  threadsTotal: number,
  pCores?: number | null,
  eCores?: number | null,
): string {
  const base = `${coresTotal} nhân / ${threadsTotal} luồng`;
  if (pCores !== null && pCores !== undefined && eCores !== null && eCores !== undefined) {
    return `${base} (${pCores} P-Core, ${eCores} E-Core)`;
  }
  return base;
}

export function resolveSingleGpuCoresLabel(vendor: GpuVendor): string {
  if (vendor === 'nvidia') return 'CUDA Cores';
  if (vendor === 'intel') return 'Shading Units';
  return 'Stream Processors';
}

export function pickBetterRepresentativeGpu<T extends RepresentativeGpuCandidate>(
  current: T | undefined,
  candidate: T,
): T {
  if (!current) {
    return candidate;
  }
  if (candidate.priceVnd !== current.priceVnd) {
    return candidate.priceVnd < current.priceVnd ? candidate : current;
  }
  if (candidate.isLimitedEdition !== current.isLimitedEdition) {
    return !candidate.isLimitedEdition ? candidate : current;
  }
  return candidate.id.localeCompare(current.id) < 0 ? candidate : current;
}

export function selectRepresentativeGpuList<
  T extends RepresentativeGpuCandidate & { seriesId: string },
>(variants: readonly T[]): T[] {
  const bestBySeries = new Map<string, T>();
  for (const variant of variants) {
    bestBySeries.set(
      variant.seriesId,
      pickBetterRepresentativeGpu(bestBySeries.get(variant.seriesId), variant),
    );
  }
  return [...bestBySeries.values()];
}
