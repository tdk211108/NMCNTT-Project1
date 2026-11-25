import { describe, expect, it } from 'vitest';
import {
  EMPTY_CART_ADVISORIES,
  evaluateCartAdvisories,
  type CartCpuSpecInput,
  type CartGpuSpecInput,
} from '@/server/domain/cart-advisories';

function makeCpu(overrides: Partial<CartCpuSpecInput> = {}): CartCpuSpecInput {
  return {
    category: 'cpu',
    productId: 'cpu-amd-ryzen-7-9800x3d',
    name: 'AMD Ryzen 7 9800X3D',
    quantity: 1,
    socket: 'AM5',
    ramSupport: 'DDR5-5600',
    psuPowerW: 162,
    normalizedScore: 80,
    ...overrides,
  };
}

function makeGpu(overrides: Partial<CartGpuSpecInput> = {}): CartGpuSpecInput {
  return {
    category: 'gpu',
    productId: 'gpu-asus-prime-rtx-5070-12gb',
    name: 'ASUS PRIME RTX 5070 12GB',
    quantity: 1,
    seriesId: 'gs-rtx-5070',
    tbpW: 250,
    lengthMm: 290,
    slotThickness: 2.5,
    normalizedScore: 76,
    ...overrides,
  };
}

describe('domain/cart-advisories', () => {
  it('returns empty advisories when cart has no active items', () => {
    expect(evaluateCartAdvisories([])).toEqual(EMPTY_CART_ADVISORIES);
  });

  it('detects mixed sockets, duplicate CPU quantities, and single-socket RAM platforms', () => {
    const mixed = evaluateCartAdvisories([
      makeCpu({ socket: 'AM5', ramSupport: 'DDR5-5600' }),
      makeCpu({
        productId: 'cpu-intel-core-i5-14600k',
        name: 'Intel Core i5-14600K',
        socket: 'LGA1700',
        ramSupport: 'DDR4 / DDR5',
      }),
    ]);
    expect(mixed.items.find((i) => i.code === 'multi_cpu_conflict')).toEqual({
      code: 'multi_cpu_conflict',
      severity: 'high',
      sockets: ['AM5', 'LGA1700'],
    });
    expect(mixed.items.some((i) => i.code === 'cpu_ram_platform')).toBe(false);

    const qtyTwo = evaluateCartAdvisories([
      makeCpu({
        productId: 'cpu-intel-core-i5-14600k',
        name: 'Intel Core i5-14600K',
        quantity: 2,
        socket: 'LGA1700',
        ramSupport: 'DDR4 / DDR5',
        psuPowerW: 181,
      }),
    ]);
    expect(qtyTwo.items).toEqual([
      { code: 'multi_cpu_conflict', severity: 'high', count: 2 },
      {
        code: 'cpu_ram_platform',
        severity: 'info',
        sockets: ['LGA1700'],
        ramKind: 'ddr4_and_ddr5',
      },
    ]);

    const sameSocketTwoModels = evaluateCartAdvisories([
      makeCpu({
        productId: 'cpu-amd-ryzen-5-7500f',
        name: 'AMD Ryzen 5 7500F',
        socket: 'AM5',
        ramSupport: 'DDR5-5200',
        psuPowerW: 88,
      }),
      makeCpu({
        productId: 'cpu-amd-ryzen-9-9950x',
        name: 'AMD Ryzen 9 9950X',
        socket: 'AM5',
        ramSupport: 'DDR5-5600',
        psuPowerW: 200,
      }),
    ]);
    expect(sameSocketTwoModels.items).toEqual([
      { code: 'multi_cpu_conflict', severity: 'high', count: 2 },
      {
        code: 'cpu_ram_platform',
        severity: 'medium',
        sockets: ['AM5'],
        ramKind: 'ddr5_only',
      },
      {
        code: 'psu_recommendation',
        severity: 'info',
        productName: 'AMD Ryzen 9 9950X',
        wattageW: 200,
        actionKind: 'psu',
        actionHref: '/tools/psu?cpu=store%3Acpu-amd-ryzen-9-9950x',
      },
    ]);

    const ddr4 = evaluateCartAdvisories([
      makeCpu({
        productId: 'cpu-amd-ryzen-5-5600',
        name: 'AMD Ryzen 5 5600',
        socket: 'AM4',
        ramSupport: 'DDR4-3200',
        psuPowerW: 88,
      }),
    ]);
    expect(ddr4.items).toEqual([
      {
        code: 'cpu_ram_platform',
        severity: 'info',
        sockets: ['AM4'],
        ramKind: 'ddr4_only',
      },
    ]);

    const unknownSocketPlatform = evaluateCartAdvisories([
      makeCpu({
        productId: 'cpu-tr5',
        socket: 'TR5',
        ramSupport: '',
        psuPowerW: 250,
      }),
    ]);
    expect(unknownSocketPlatform.items).toEqual([
      {
        code: 'psu_recommendation',
        severity: 'info',
        productName: 'AMD Ryzen 7 9800X3D',
        wattageW: 250,
        actionKind: 'psu',
        actionHref: '/tools/psu?cpu=store%3Acpu-tr5',
      },
    ]);

    const emptySocketPlatform = evaluateCartAdvisories([
      makeCpu({
        productId: 'cpu-custom',
        socket: '',
        ramSupport: '',
        psuPowerW: 250,
      }),
    ]);
    expect(emptySocketPlatform.items).toEqual([
      {
        code: 'psu_recommendation',
        severity: 'info',
        productName: 'AMD Ryzen 7 9800X3D',
        wattageW: 250,
        actionKind: 'psu',
        actionHref: '/tools/psu?cpu=store%3Acpu-custom',
      },
    ]);
  });

  it('computes paired PSU tiers, standalone GPU warnings, oversized clearance, and pair balance', () => {
    // High GPU standalone + multiple oversized cards picking the largest
    const gpuOnly = evaluateCartAdvisories([
      makeGpu({
        productId: 'gpu-rtx-5070-ti-mid',
        name: 'RTX 5070 Ti Trio',
        seriesId: 'gs-rtx-5070-ti',
        tbpW: 300,
        lengthMm: 310,
        slotThickness: 3.0,
      }),
      makeGpu({
        productId: 'gpu-rtx-5080-big',
        name: 'RTX 5080 Monster',
        seriesId: 'gs-rtx-5080',
        tbpW: 360,
        lengthMm: 340,
        slotThickness: 3.5,
      }),
      makeGpu({
        productId: 'gpu-rtx-5060-small',
        name: 'RTX 5060 Dual',
        seriesId: 'gs-rtx-5060',
        tbpW: 145,
        lengthMm: 220,
        slotThickness: 2.0,
      }),
    ]);
    expect(gpuOnly.items).toEqual([
      {
        code: 'psu_recommendation',
        severity: 'medium',
        productName: 'RTX 5080 Monster',
        wattageW: 360,
        actionKind: 'psu',
        actionHref: '/tools/psu?gpu=gs-rtx-5080',
      },
      {
        code: 'gpu_large_size',
        severity: 'medium',
        productName: 'RTX 5080 Monster',
        lengthMm: 340,
        slotThickness: 3.5,
      },
    ]);

    // Standard paired PSU <= 750W + imbalance warning
    const standardPair = evaluateCartAdvisories([
      makeCpu({ psuPowerW: 162, normalizedScore: 95 }),
      makeGpu({ tbpW: 145, normalizedScore: 45, lengthMm: 260, slotThickness: 2.0 }),
    ]);
    expect(standardPair.recommendedPsuTierW).toBe(550);
    expect(standardPair.recommendedPsuExactW).toBe(509);
    expect(standardPair.psuExceedsMaxTier).toBe(false);
    expect(standardPair.items.map((i) => i.code)).toEqual([
      'cpu_ram_platform',
      'psu_recommendation',
      'pair_imbalance',
    ]);
    expect(standardPair.items.find((i) => i.code === 'psu_recommendation')?.actionHref).toBe(
      '/tools/psu?cpu=store%3Acpu-amd-ryzen-7-9800x3d&gpu=gs-rtx-5070',
    );

    // >= 850W PSU + exact multi-oversized pick
    const heavyPair = evaluateCartAdvisories([
      makeCpu({
        productId: 'cpu-intel-core-i9-14900k',
        socket: 'LGA1700',
        ramSupport: 'DDR5',
        psuPowerW: 253,
        normalizedScore: 88,
      }),
      makeGpu({
        productId: 'gpu-rtx-5090-a',
        name: 'RTX 5090 A',
        seriesId: 'gs-rtx-5090',
        tbpW: 575,
        lengthMm: 350,
        slotThickness: 3.5,
        normalizedScore: 99,
      }),
    ]);
    expect(heavyPair.recommendedPsuTierW).toBe(1200);
    expect(heavyPair.items.find((i) => i.code === 'psu_recommendation')?.severity).toBe('medium');
    expect(heavyPair.items.some((i) => i.code === 'pair_imbalance')).toBe(false);

    // Exceeds 1200W PSU -> high severity + thick-only GPU
    const ultraPair = evaluateCartAdvisories([
      makeCpu({ socket: 'AM5', ramSupport: 'DDR5', psuPowerW: 400 }),
      makeGpu({ tbpW: 600, lengthMm: 280, slotThickness: 3.2 }),
    ]);
    expect(ultraPair.psuExceedsMaxTier).toBe(true);
    expect(ultraPair.recommendedPsuTierW).toBeNull();
    expect(ultraPair.items.find((i) => i.code === 'psu_recommendation')?.severity).toBe('high');
    expect(ultraPair.items.some((i) => i.code === 'gpu_large_size')).toBe(true);
  });
});
