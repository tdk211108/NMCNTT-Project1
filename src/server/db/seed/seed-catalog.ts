import 'server-only';

import { SEED_IMAGE_PREFIX } from '@/shared/constants';
import type { DbExecutor } from '../client';
import { cpuSpecs, gpuSeries, gpuVariants, legacyCpus, products } from '../schema';
import { RETAIL_GPU_SERIES_SEEDS } from './data/gpu-series';
import { GPU_VARIANT_SEEDS } from './data/gpu-variants';
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

export function resolveSeedStorageConfig(override?: Partial<SeedStorageConfig>): SeedStorageConfig {
  const supabaseUrl = (override?.supabaseUrl ?? process.env.SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
  const bucket = (override?.bucket ?? process.env.SUPABASE_STORAGE_BUCKET ?? 'product-images').trim();

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is missing.');
  }
  if (!bucket) {
    throw new Error('SUPABASE_STORAGE_BUCKET environment variable is missing.');
  }

  return { supabaseUrl, bucket };
}

export function buildSeedImageUrl(imageFile: string, storage: SeedStorageConfig): string {
  const baseUrl = storage.supabaseUrl.trim().replace(/\/+$/, '');
  return `${baseUrl}/storage/v1/object/public/${storage.bucket}/${SEED_IMAGE_PREFIX}${imageFile}`;
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
    ...RETAIL_GPU_SERIES_SEEDS.map((s) => ({
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
    })),
    ...LEGACY_GPU_SERIES_SEEDS.map((s) => ({
      id: s.id,
      kind: s.kind,
      name: s.name,
      vendor: s.vendor,
      vramGb: s.vramGb,
      tbpW: s.tbpW,
      isSeed: true,
    })),
  ]);

  await tx.insert(products).values([
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
  ]);

  await tx.insert(cpuSpecs).values(
    RETAIL_CPU_SEEDS.map((c) => ({
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
    })),
  );

  await tx.insert(gpuVariants).values(
    GPU_VARIANT_SEEDS.map((v) => ({
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
    })),
  );

  await tx.insert(legacyCpus).values(
    LEGACY_CPU_SEEDS.map((c) => ({
      id: c.id,
      name: c.name,
      vendor: c.vendor,
      socket: c.socket,
      coresTotal: c.coresTotal,
      threadsTotal: c.threadsTotal,
      psuPowerW: c.psuPowerW,
      isSeed: true,
    })),
  );

  return {
    productsRestored: RETAIL_CPU_SEEDS.length + GPU_VARIANT_SEEDS.length,
    retailCpus: RETAIL_CPU_SEEDS.length,
    retailGpuSeries: RETAIL_GPU_SERIES_SEEDS.length,
    gpuVariants: GPU_VARIANT_SEEDS.length,
    legacyCpus: LEGACY_CPU_SEEDS.length,
    legacyGpus: LEGACY_GPU_SERIES_SEEDS.length,
  };
}
