import 'server-only';

import { SEED_IMAGE_PREFIX } from '@/shared/constants';
import { buildPublicObjectUrl, resolvePublicStorageConfig } from '../../storage/supabase-storage';
import type { DbExecutor } from '../client';
import { cpuSpecs, gpuSeries, gpuVariants, legacyCpus, products } from '../schema';
import { RETAIL_GPU_SERIES_SEEDS } from './data/gpu-series';
import { GPU_VARIANT_SEEDS } from './data/gpu-variants';
import { SEED_IMAGE_HASHES } from './data/image-versions';
import { LEGACY_CPU_SEEDS } from './data/legacy-cpus';
import { LEGACY_GPU_SERIES_SEEDS } from './data/legacy-gpus';
import { RETAIL_CPU_SEEDS } from './data/retail-cpus';

export interface SeedStorageConfig {
  supabaseUrl: string;
  bucket: string;
}

export interface SeedCatalogResult {
  productsRestored: number;
  retailCpus: number;
  retailGpuSeries: number;
  gpuVariants: number;
  legacyCpus: number;
  legacyGpus: number;
}

export const TRUNCATE_SAMPLE_TABLES_SQL =
  'TRUNCATE TABLE order_status_events, order_items, orders, gpu_variants, cpu_specs, products, gpu_series, legacy_cpus, auth_failures CASCADE';

export function resolveSeedStorageConfig(override?: Partial<SeedStorageConfig>): SeedStorageConfig {
  return resolvePublicStorageConfig(override);
}

export function buildSeedImageUrl(
  imageFile: string,
  storage: SeedStorageConfig,
  versionHash: string | undefined = SEED_IMAGE_HASHES[imageFile],
): string {
  const rawUrl = buildPublicObjectUrl(`${SEED_IMAGE_PREFIX}${imageFile}`, storage);
  return versionHash ? `${rawUrl}?v=${versionHash}` : rawUrl;
}

export function buildRetailGpuSeriesSeedRows() {
  return RETAIL_GPU_SERIES_SEEDS.map((s) => ({
    id: s.id,
    kind: s.kind,
    name: s.name,
    vendor: s.vendor,
    vramGb: s.vramGb,
    tbpW: s.tbpW,
    cores: s.cores,
    baseClockMhz: s.baseClockMhz,
    boostClockMhz: s.boostClockMhz,
    memoryType: s.memoryType,
    busWidthBit: s.busWidthBit,
    passmarkRaw: s.passmarkRaw,
    passmarkSource: s.passmarkSource,
    isSeed: true,
  }));
}

export function buildLegacyGpuSeriesSeedRows() {
  return LEGACY_GPU_SERIES_SEEDS.map((s) => ({
    id: s.id,
    kind: s.kind,
    name: s.name,
    vendor: s.vendor,
    vramGb: s.vramGb,
    tbpW: s.tbpW,
    passmarkRaw: s.passmarkRaw ?? null,
    passmarkSource: s.passmarkRaw != null ? (s.passmarkSource ?? 'PassMark') : null,
    isSeed: true,
  }));
}

export function buildProductSeedRows(storage: SeedStorageConfig) {
  return [
    ...RETAIL_CPU_SEEDS.map((c) => ({
      id: c.id,
      category: 'cpu' as const,
      name: c.name,
      priceVnd: c.priceVnd,
      imageUrl: buildSeedImageUrl(c.imageFile, storage),
      imageStoragePath: `${SEED_IMAGE_PREFIX}${c.imageFile}`,
      isSeed: true,
    })),
    ...GPU_VARIANT_SEEDS.map((v) => ({
      id: v.id,
      category: 'gpu' as const,
      name: v.name,
      priceVnd: v.priceVnd,
      imageUrl: buildSeedImageUrl(v.imageFile, storage),
      imageStoragePath: `${SEED_IMAGE_PREFIX}${v.imageFile}`,
      isSeed: true,
    })),
  ];
}

export function buildCpuSpecSeedRows() {
  return RETAIL_CPU_SEEDS.map((c) => ({
    productId: c.id,
    category: 'cpu' as const,
    vendor: c.vendor,
    architecture: c.architecture,
    socket: c.socket,
    processNode: c.processNode,
    coresTotal: c.coresTotal,
    threadsTotal: c.threadsTotal,
    pCores: c.pCores,
    eCores: c.eCores,
    baseClockGhz: c.baseClockGhz,
    boostClockGhz: c.boostClockGhz,
    cacheText: c.cacheText,
    l3CacheMb: c.l3CacheMb,
    tdpW: c.tdpW,
    psuPowerW: c.psuPowerW,
    ramSupport: c.ramSupport,
    passmarkRaw: c.passmarkRaw,
    passmarkSource: c.passmarkSource,
  }));
}

export function buildGpuVariantSeedRows() {
  return GPU_VARIANT_SEEDS.map((v) => ({
    productId: v.id,
    category: 'gpu' as const,
    seriesId: v.seriesId,
    seriesKind: 'retail' as const,
    aibBrand: v.aibBrand,
    isLimitedEdition: v.isLimitedEdition ?? false,
    lengthMm: v.lengthMm,
    slotThickness: v.slotThickness,
    hdmiCount: v.hdmiCount,
    dpCount: v.dpCount,
  }));
}

export function buildLegacyCpuSeedRows() {
  return LEGACY_CPU_SEEDS.map((c) => ({
    id: c.id,
    name: c.name,
    vendor: c.vendor,
    socket: c.socket,
    coresTotal: c.coresTotal,
    threadsTotal: c.threadsTotal,
    psuPowerW: c.psuPowerW,
    passmarkRaw: c.passmarkRaw ?? null,
    passmarkSource: c.passmarkRaw != null ? (c.passmarkSource ?? 'PassMark') : null,
    isSeed: true,
  }));
}

/**
 * Inserts the entire baseline hardware catalog and legacy reference tables
 * inside the caller's transaction (`scripts/seed.ts` and `reset.service.ts`).
 */
export async function seedCatalog(
  tx: DbExecutor,
  storageOverride?: Partial<SeedStorageConfig>,
): Promise<SeedCatalogResult> {
  const storage = resolveSeedStorageConfig(storageOverride);

  await tx.insert(gpuSeries).values([
    ...buildRetailGpuSeriesSeedRows(),
    ...buildLegacyGpuSeriesSeedRows(),
  ]);
  await tx.insert(products).values(buildProductSeedRows(storage));
  await tx.insert(cpuSpecs).values(buildCpuSpecSeedRows());
  await tx.insert(gpuVariants).values(buildGpuVariantSeedRows());
  await tx.insert(legacyCpus).values(buildLegacyCpuSeedRows());

  return {
    productsRestored: RETAIL_CPU_SEEDS.length + GPU_VARIANT_SEEDS.length,
    retailCpus: RETAIL_CPU_SEEDS.length,
    retailGpuSeries: RETAIL_GPU_SERIES_SEEDS.length,
    gpuVariants: GPU_VARIANT_SEEDS.length,
    legacyCpus: LEGACY_CPU_SEEDS.length,
    legacyGpus: LEGACY_GPU_SERIES_SEEDS.length,
  };
}
