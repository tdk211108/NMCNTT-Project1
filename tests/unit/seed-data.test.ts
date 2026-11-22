import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import * as schema from '@/server/db/schema';
import { RETAIL_GPU_SERIES_SEEDS } from '@/server/db/seed/data/gpu-series';
import { GPU_VARIANT_SEEDS } from '@/server/db/seed/data/gpu-variants';
import { SEED_IMAGE_HASHES } from '@/server/db/seed/data/image-versions';
import { LEGACY_CPU_SEEDS } from '@/server/db/seed/data/legacy-cpus';
import { LEGACY_GPU_SERIES_SEEDS } from '@/server/db/seed/data/legacy-gpus';
import { RETAIL_CPU_SEEDS } from '@/server/db/seed/data/retail-cpus';
import { buildSeedImageUrl } from '@/server/db/seed/seed-catalog';
import {
  LEGACY_CPU_ID_REGEX,
  MAX_IMAGE_BYTES,
  PRODUCT_ID_MAX_LEN,
  PRODUCT_ID_REGEX,
  SERIES_ID_REGEX,
} from '@/shared/constants';
import {
  adminCpuInputSchema,
  adminGpuSeriesInputSchema,
  adminGpuVariantInputSchema,
  adminLegacyCpuInputSchema,
} from '@/shared/schemas';

const EM_DASH_RE = /—/;
const BULLET_LINE_RE = /^\s*(?:[•◦]|[-*]\s+)/m;

describe('Seed datasets and Drizzle schema integrity', () => {
  it('exports all 9 tables and storefront_products_v view', () => {
    expect(schema.products).toBeDefined();
    expect(schema.cpuSpecs).toBeDefined();
    expect(schema.gpuSeries).toBeDefined();
    expect(schema.gpuVariants).toBeDefined();
    expect(schema.legacyCpus).toBeDefined();
    expect(schema.orders).toBeDefined();
    expect(schema.orderItems).toBeDefined();
    expect(schema.orderStatusEvents).toBeDefined();
    expect(schema.authFailures).toBeDefined();
    expect(schema.storefrontProductsV).toBeDefined();
  });

  it('has expected baseline counts and stays within catalog ceiling', () => {
    expect(RETAIL_CPU_SEEDS).toHaveLength(35);
    expect(RETAIL_GPU_SERIES_SEEDS).toHaveLength(13);
    expect(GPU_VARIANT_SEEDS).toHaveLength(71);
    expect(LEGACY_CPU_SEEDS).toHaveLength(24);
    expect(LEGACY_GPU_SERIES_SEEDS).toHaveLength(33);
    expect(RETAIL_CPU_SEEDS.length + GPU_VARIANT_SEEDS.length).toBeLessThanOrEqual(180);
  });

  it('validates all retail CPUs against DB/Zod rules', () => {
    for (const cpu of RETAIL_CPU_SEEDS) {
      expect(cpu.id).toMatch(PRODUCT_ID_REGEX);
      expect(cpu.id.length).toBeLessThanOrEqual(PRODUCT_ID_MAX_LEN);
      expect(cpu.sourceUrl).toMatch(/^https?:\/\//);
      expect(cpu.name).not.toMatch(EM_DASH_RE);
      expect(cpu.name).not.toMatch(BULLET_LINE_RE);
      expect(cpu.cacheText).not.toMatch(EM_DASH_RE);
      expect(cpu.cacheText).not.toMatch(BULLET_LINE_RE);

      const parsed = adminCpuInputSchema.safeParse({
        category: 'cpu',
        name: cpu.name,
        priceVnd: cpu.priceVnd,
        image: { kind: 'none' },
        vendor: cpu.vendor,
        architecture: cpu.architecture,
        socket: cpu.socket,
        processNode: cpu.processNode,
        coresTotal: cpu.coresTotal,
        threadsTotal: cpu.threadsTotal,
        pCores: cpu.pCores,
        eCores: cpu.eCores,
        baseClockGhz: cpu.baseClockGhz,
        boostClockGhz: cpu.boostClockGhz,
        cacheText: cpu.cacheText,
        l3CacheMb: cpu.l3CacheMb,
        tdpW: cpu.tdpW,
        psuPowerW: cpu.psuPowerW,
        ramSupport: cpu.ramSupport,
        passmarkRaw: cpu.passmarkRaw,
        passmarkSource: cpu.passmarkSource,
      });
      expect(parsed.success, `CPU ${cpu.id} failed Zod validation`).toBe(true);
    }
  });

  it('validates all GPU series and AIB variants against DB/Zod rules', () => {
    const retailSeriesIds = new Set<string>();
    for (const series of RETAIL_GPU_SERIES_SEEDS) {
      expect(series.id).toMatch(SERIES_ID_REGEX);
      expect(series.sourceUrl).toMatch(/^https?:\/\//);
      retailSeriesIds.add(series.id);

      const parsed = adminGpuSeriesInputSchema.safeParse({
        kind: 'retail',
        name: series.name,
        vendor: series.vendor,
        vramGb: series.vramGb,
        tbpW: series.tbpW,
        cores: series.cores,
        baseClockMhz: series.baseClockMhz,
        boostClockMhz: series.boostClockMhz,
        memoryType: series.memoryType,
        busWidthBit: series.busWidthBit,
        passmarkRaw: series.passmarkRaw,
        passmarkSource: series.passmarkSource,
      });
      expect(parsed.success, `Retail GPU series ${series.id} failed Zod validation`).toBe(true);
    }

    for (const variant of GPU_VARIANT_SEEDS) {
      expect(variant.id).toMatch(PRODUCT_ID_REGEX);
      expect(variant.id.length).toBeLessThanOrEqual(PRODUCT_ID_MAX_LEN);
      expect(retailSeriesIds.has(variant.seriesId), `Unknown seriesId ${variant.seriesId}`).toBe(
        true,
      );
      expect(variant.sourceUrl).toMatch(/^https?:\/\//);

      const parsed = adminGpuVariantInputSchema.safeParse({
        category: 'gpu',
        seriesId: variant.seriesId,
        name: variant.name,
        aibBrand: variant.aibBrand,
        isLimitedEdition: variant.isLimitedEdition ?? false,
        priceVnd: variant.priceVnd,
        image: { kind: 'none' },
        lengthMm: variant.lengthMm,
        slotThickness: variant.slotThickness,
        hdmiCount: variant.hdmiCount,
        dpCount: variant.dpCount,
      });
      expect(parsed.success, `GPU variant ${variant.id} failed Zod validation`).toBe(true);
    }

    expect(GPU_VARIANT_SEEDS.filter((v) => v.isLimitedEdition)).toHaveLength(8);
  });

  it('validates all legacy CPUs and legacy GPUs against DB/Zod rules', () => {
    for (const cpu of LEGACY_CPU_SEEDS) {
      expect(cpu.id).toMatch(LEGACY_CPU_ID_REGEX);
      expect(cpu.sourceUrl).toMatch(/^https?:\/\//);
      const parsed = adminLegacyCpuInputSchema.safeParse({
        name: cpu.name,
        vendor: cpu.vendor,
        socket: cpu.socket,
        coresTotal: cpu.coresTotal,
        threadsTotal: cpu.threadsTotal,
        psuPowerW: cpu.psuPowerW,
      });
      expect(parsed.success, `Legacy CPU ${cpu.id} failed Zod validation`).toBe(true);
    }

    for (const gpu of LEGACY_GPU_SERIES_SEEDS) {
      expect(gpu.id).toMatch(/^G[0-9]{2,4}$/);
      expect(gpu.sourceUrl).toMatch(/^https?:\/\//);
      const parsed = adminGpuSeriesInputSchema.safeParse({
        kind: 'legacy',
        name: gpu.name,
        vendor: gpu.vendor,
        vramGb: gpu.vramGb,
        tbpW: gpu.tbpW,
      });
      expect(parsed.success, `Legacy GPU ${gpu.id} failed Zod validation`).toBe(true);
    }
  });

  it('enforces uniqueness across retail and legacy datasets and 1:1 seed-images mapping', () => {
    const productIds = [...RETAIL_CPU_SEEDS.map((c) => c.id), ...GPU_VARIANT_SEEDS.map((g) => g.id)];
    expect(new Set(productIds).size).toBe(productIds.length);

    const seriesIds = [
      ...RETAIL_GPU_SERIES_SEEDS.map((s) => s.id),
      ...LEGACY_GPU_SERIES_SEEDS.map((s) => s.id),
    ];
    expect(new Set(seriesIds).size).toBe(seriesIds.length);

    const cpuAndVariantNames = [
      ...RETAIL_CPU_SEEDS.map((c) => c.name.toLowerCase()),
      ...GPU_VARIANT_SEEDS.map((g) => g.name.toLowerCase()),
      ...LEGACY_CPU_SEEDS.map((c) => c.name.toLowerCase()),
    ];
    expect(new Set(cpuAndVariantNames).size).toBe(cpuAndVariantNames.length);

    const seriesNames = [
      ...RETAIL_GPU_SERIES_SEEDS.map((s) => s.name.toLowerCase()),
      ...LEGACY_GPU_SERIES_SEEDS.map((s) => s.name.toLowerCase()),
    ];
    expect(new Set(seriesNames).size).toBe(seriesNames.length);

    const seedImagesDir = path.resolve(process.cwd(), 'seed-images');
    const diskImages = readdirSync(seedImagesDir).sort();
    const expectedImages = [
      ...RETAIL_CPU_SEEDS.map((c) => c.imageFile),
      ...GPU_VARIANT_SEEDS.map((g) => g.imageFile),
    ].sort();

    expect(diskImages).toEqual(expectedImages);
    expect(Object.keys(SEED_IMAGE_HASHES).sort()).toEqual(diskImages);
    for (const fileName of diskImages) {
      const filePath = path.join(seedImagesDir, fileName);
      const size = statSync(filePath).size;
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThanOrEqual(MAX_IMAGE_BYTES);

      const expectedHash = createHash('sha256')
        .update(readFileSync(filePath))
        .digest('hex')
        .slice(0, 8);
      expect(SEED_IMAGE_HASHES[fileName]).toBe(expectedHash);
    }

    expect(
      buildSeedImageUrl('cpu-amd-ryzen-7-9800x3d.webp', {
        supabaseUrl: 'https://demo.supabase.co/',
        bucket: 'product-images',
      }),
    ).toBe(
      `https://demo.supabase.co/storage/v1/object/public/product-images/seed/cpu-amd-ryzen-7-9800x3d.webp?v=${SEED_IMAGE_HASHES['cpu-amd-ryzen-7-9800x3d.webp']}`,
    );
  });
});
