import { describe, expect, it } from 'vitest';
import {
  buildCompareRows,
  parseCompareIds,
  validateCompareProducts,
  type CompareCpuInput,
  type CompareGpuInput,
} from '@/server/domain/compare';

const cpuHybrid: CompareCpuInput = {
  id: 'cpu-intel-265k',
  category: 'cpu',
  name: 'Intel Core Ultra 7 265K',
  priceVnd: 10_490_000,
  vendor: 'intel',
  passmarkRaw: 58569,
  normalizedScore: 85.5,
  architecture: 'Arrow Lake-S',
  socket: 'LGA1851',
  processNode: 'TSMC N3B',
  coresTotal: 20,
  threadsTotal: 20,
  pCores: 8,
  eCores: 12,
  baseClockGhz: 3.9,
  boostClockGhz: 5.5,
  cacheText: 'L1 2048 KB, L2 36 MB, L3 30 MB',
  l3CacheMb: 30,
  tdpW: 125,
  ramSupport: 'DDR5-6400',
};

const cpuAmd: CompareCpuInput = {
  id: 'cpu-amd-9800x3d',
  category: 'cpu',
  name: 'AMD Ryzen 7 9800X3D',
  priceVnd: 12_990_000,
  vendor: 'amd',
  passmarkRaw: 40000,
  normalizedScore: 58.4,
  architecture: 'Zen 5',
  socket: 'AM5',
  processNode: 'TSMC 4nm',
  coresTotal: 8,
  threadsTotal: 16,
  pCores: null,
  eCores: null,
  baseClockGhz: 4.7,
  boostClockGhz: 5.2,
  cacheText: 'L1 640 KB, L2 8 MB, L3 96 MB',
  l3CacheMb: 96,
  tdpW: 120,
  ramSupport: 'DDR5-5600',
};

const gpuNvidia: CompareGpuInput = {
  id: 'gpu-asus-5070',
  category: 'gpu',
  name: 'ASUS RTX 5070',
  priceVnd: 18_000_000,
  vendor: 'nvidia',
  passmarkRaw: 28682,
  normalizedScore: 73.5,
  vramGb: 12,
  cores: 6144,
  tbpW: 250,
  baseClockMhz: 2160,
  boostClockMhz: 2510,
  memoryType: 'GDDR7',
  busWidthBit: 192,
};

const gpuNvidiaSameSeries: CompareGpuInput = {
  ...gpuNvidia,
  id: 'gpu-msi-5070',
  name: 'MSI RTX 5070',
  priceVnd: 17_500_000,
};

const gpuAmd: CompareGpuInput = {
  id: 'gpu-sapphire-9070',
  category: 'gpu',
  name: 'Sapphire RX 9070',
  priceVnd: 17_500_000,
  vendor: 'amd',
  passmarkRaw: 26000,
  normalizedScore: null,
  vramGb: 16,
  cores: 3584,
  tbpW: 220,
  baseClockMhz: 2070,
  boostClockMhz: 2520,
  memoryType: 'GDDR6',
  busWidthBit: 256,
};

const gpuIntel: CompareGpuInput = {
  id: 'gpu-intel-b580',
  category: 'gpu',
  name: 'Intel Arc B580 Limited Edition',
  priceVnd: 7_250_000,
  vendor: 'intel',
  passmarkRaw: 16097,
  normalizedScore: 41.2,
  vramGb: 12,
  cores: 2560,
  tbpW: 190,
  baseClockMhz: 2670,
  boostClockMhz: 2670,
  memoryType: 'GDDR6',
  busWidthBit: 192,
};

describe('domain/compare', () => {
  it('parses compare query IDs in validation order', () => {
    expect(parseCompareIds(undefined)).toEqual({ ok: false, reason: 'NO_IDS' });
    expect(parseCompareIds(' , , ')).toEqual({ ok: false, reason: 'NO_IDS' });
    expect(parseCompareIds('a, b, c, d')).toEqual({ ok: false, reason: 'TOO_MANY' });
    expect(parseCompareIds('cpu-1, bad!id, cpu-1')).toEqual({
      ok: false,
      reason: 'NOT_FOUND',
      invalidIds: ['bad!id'],
    });
    expect(parseCompareIds('cpu-1, cpu-2, cpu-1')).toEqual({
      ok: true,
      ids: ['cpu-1', 'cpu-2'],
    });
  });

  it('validates found products against missing, mixed category, and minimum count', () => {
    expect(validateCompareProducts(['cpu-a', 'cpu-b'], [cpuHybrid])).toEqual({
      ok: false,
      reason: 'NOT_FOUND',
      invalidIds: ['cpu-a', 'cpu-b'],
    });
    expect(
      validateCompareProducts([cpuHybrid.id, gpuNvidia.id], [cpuHybrid, gpuNvidia]),
    ).toEqual({ ok: false, reason: 'MIXED_CATEGORY' });
    expect(validateCompareProducts([cpuHybrid.id], [cpuHybrid])).toEqual({
      ok: false,
      reason: 'TOO_FEW',
    });
    expect(validateCompareProducts([cpuAmd.id, cpuHybrid.id], [cpuHybrid, cpuAmd])).toEqual({
      ok: true,
      category: 'cpu',
      products: [cpuAmd, cpuHybrid],
    });
  });

  it('builds 11 CPU compare rows and highlights only price, benchmark score, and cores/threads', () => {
    const rows = buildCompareRows('cpu', [cpuHybrid, cpuAmd]);
    expect(rows).toHaveLength(11);
    expect(rows.map((r) => r.key)).toEqual([
      'price',
      'score',
      'architecture',
      'socket',
      'processNode',
      'coresThreads',
      'baseClock',
      'boostClock',
      'cache',
      'tdp',
      'ramSupport',
    ]);
    expect(rows[0].cells.map((c) => c.highlighted)).toEqual([true, false]);
    expect(rows[1].cells.map((c) => c.highlighted)).toEqual([true, false]);
    expect(rows[5].cells[0].display).toContain('(8 P-Core, 12 E-Core)');
    expect(rows[5].cells[1].display).toBe('8 nhân / 16 luồng');
    expect(rows[5].cells.map((c) => c.highlighted)).toEqual([true, false]);

    // Architecture, socket, processNode, clocks, L3 cache, TDP, and RAM support are never highlighted.
    for (const idx of [2, 3, 4, 6, 7, 8, 9, 10]) {
      expect(rows[idx].rule).toBe('none');
      expect(rows[idx].cells.every((c) => !c.highlighted)).toBe(true);
    }
  });

  it('builds 9 GPU compare rows, highlights only price, score, VRAM, cores, and bus width, and suppresses ties', () => {
    const sameSeriesRows = buildCompareRows('gpu', [gpuNvidia, gpuNvidiaSameSeries]);
    expect(sameSeriesRows).toHaveLength(9);
    expect(sameSeriesRows[0].cells.map((c) => c.highlighted)).toEqual([false, true]);
    // Inherited specs tie across all products -> no highlights
    expect(sameSeriesRows[2].cells.every((c) => !c.highlighted)).toBe(true);
    expect(sameSeriesRows[3].label).toBe('CUDA Cores');

    const amdRows = buildCompareRows('gpu', [gpuAmd, gpuAmd]);
    expect(amdRows[3].label).toBe('Stream Processors');
    expect(amdRows[1].cells[0].display).toBe('Chưa có dữ liệu');
    expect(amdRows[1].cells.every((c) => !c.highlighted)).toBe(true);

    const intelRows = buildCompareRows('gpu', [gpuIntel, gpuIntel]);
    expect(intelRows[3].label).toBe('Shading Units');

    const allVendorsRows = buildCompareRows('gpu', [gpuNvidia, gpuAmd, gpuIntel]);
    expect(allVendorsRows[3].label).toBe('CUDA Cores / Stream Processors / Shading Units');

    const amdIntelRows = buildCompareRows('gpu', [gpuAmd, gpuIntel]);
    expect(amdIntelRows[3].label).toBe('Stream Processors / Shading Units');

    const nvidiaIntelRows = buildCompareRows('gpu', [gpuNvidia, gpuIntel]);
    expect(nvidiaIntelRows[3].label).toBe('CUDA Cores / Shading Units');

    const mixedVendorRows = buildCompareRows('gpu', [gpuNvidia, gpuAmd]);
    expect(mixedVendorRows[3].label).toBe('CUDA Cores / Stream Processors');
    expect(mixedVendorRows[0].cells.map((c) => c.highlighted)).toEqual([false, true]); // lower price
    expect(mixedVendorRows[1].cells.map((c) => c.highlighted)).toEqual([true, false]); // higher normalized score
    expect(mixedVendorRows[2].cells.map((c) => c.highlighted)).toEqual([false, true]); // higher VRAM
    expect(mixedVendorRows[3].cells.map((c) => c.highlighted)).toEqual([true, false]); // higher cores
    expect(mixedVendorRows[8].cells.map((c) => c.highlighted)).toEqual([false, true]); // higher bus width
    for (const idx of [4, 5, 6, 7]) {
      expect(mixedVendorRows[idx].rule).toBe('none');
      expect(mixedVendorRows[idx].cells.every((c) => !c.highlighted)).toBe(true);
    }
  });
});
