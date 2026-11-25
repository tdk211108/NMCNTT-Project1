import { describe, expect, it } from 'vitest';
import {
  formatCpuCoresThreads,
  formatViNumber,
  pickBetterRepresentativeGpu,
  resolveSingleGpuCoresLabel,
  roundTo,
  selectRepresentativeGpuList,
} from '@/server/domain/format';

describe('domain/format utilities', () => {
  it('rounds decimals, formats Vietnamese numbers, and formats CPU/GPU labels', () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(12.3456, 1)).toBe(12.3);

    expect(formatViNumber(1_250_000)).toBe((1_250_000).toLocaleString('vi-VN'));
    expect(formatViNumber(2.5, 2)).toBe(
      (2.5).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    );

    expect(formatCpuCoresThreads(8, 16)).toBe('8 nhân / 16 luồng');
    expect(formatCpuCoresThreads(20, 20, 8, 12)).toBe('20 nhân / 20 luồng (8 P-Core, 12 E-Core)');

    expect(resolveSingleGpuCoresLabel('nvidia')).toBe('CUDA Cores');
    expect(resolveSingleGpuCoresLabel('amd')).toBe('Stream Processors');
    expect(resolveSingleGpuCoresLabel('intel')).toBe('Shading Units');
  });

  it('picks deterministic representative GPUs across price, limited edition, and ID ties', () => {
    const base = { seriesId: 'gs-5070', isLimitedEdition: false, priceVnd: 15_000_000 };
    const first = { ...base, id: 'gpu-b' };
    const cheaper = { ...base, id: 'gpu-z', priceVnd: 14_000_000 };
    const pricier = { ...base, id: 'gpu-a', priceVnd: 16_000_000 };
    const limitedSamePrice = { ...base, id: 'gpu-a-le', isLimitedEdition: true };
    const lowerIdSamePrice = { ...base, id: 'gpu-a' };

    expect(pickBetterRepresentativeGpu(undefined, first)).toBe(first);
    expect(pickBetterRepresentativeGpu(first, cheaper)).toBe(cheaper);
    expect(pickBetterRepresentativeGpu(first, pricier)).toBe(first);
    expect(pickBetterRepresentativeGpu(limitedSamePrice, first)).toBe(first);
    expect(pickBetterRepresentativeGpu(first, limitedSamePrice)).toBe(first);
    expect(pickBetterRepresentativeGpu(first, lowerIdSamePrice)).toBe(lowerIdSamePrice);
    expect(pickBetterRepresentativeGpu(lowerIdSamePrice, first)).toBe(lowerIdSamePrice);

    const picked = selectRepresentativeGpuList([limitedSamePrice, first, lowerIdSamePrice]);
    expect(picked.map((p) => p.id)).toEqual(['gpu-a']);
  });
});
