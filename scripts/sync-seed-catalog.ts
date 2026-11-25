import { and, eq, notInArray, sql } from 'drizzle-orm';
import { createDbConnection } from '../src/server/db/client';
import { cpuSpecs, gpuSeries, gpuVariants, legacyCpus, products } from '../src/server/db/schema';
import { RETAIL_GPU_SERIES_SEEDS } from '../src/server/db/seed/data/gpu-series';
import { GPU_VARIANT_SEEDS } from '../src/server/db/seed/data/gpu-variants';
import { LEGACY_CPU_SEEDS } from '../src/server/db/seed/data/legacy-cpus';
import { LEGACY_GPU_SERIES_SEEDS } from '../src/server/db/seed/data/legacy-gpus';
import { RETAIL_CPU_SEEDS } from '../src/server/db/seed/data/retail-cpus';
import {
  buildCpuSpecSeedRows,
  buildGpuVariantSeedRows,
  buildLegacyCpuSeedRows,
  buildLegacyGpuSeriesSeedRows,
  buildProductSeedRows,
  buildRetailGpuSeriesSeedRows,
  resolveSeedStorageConfig,
} from '../src/server/db/seed/seed-catalog';
import { loadProjectEnv } from './lib/load-env';

/**
 * Non-destructively upserts all seed hardware into an existing database while preserving
 * orders, auth data, and any products/series added or edited by Admin (`is_seed = false`).
 */
async function main(): Promise<void> {
  loadProjectEnv();

  const connectionString = (process.env.DATABASE_URL_MIGRATIONS ?? '').trim();
  if (!connectionString) {
    throw new Error('DATABASE_URL_MIGRATIONS must be set in .env.');
  }

  const storage = resolveSeedStorageConfig();
  const { sql: pgSql, db } = createDbConnection(connectionString, {
    max: 1,
    idleTimeoutSeconds: 10,
  });

  try {
    const now = new Date();
    await db.transaction(async (tx) => {
      // Remove stale seed legacy entries first so items promoted to retail never overlap legacy tables.
      const activeLegacyCpuIds = LEGACY_CPU_SEEDS.map((c) => c.id);
      const activeLegacyGpuIds = LEGACY_GPU_SERIES_SEEDS.map((s) => s.id);

      await tx
        .delete(legacyCpus)
        .where(
          activeLegacyCpuIds.length > 0
            ? and(eq(legacyCpus.isSeed, true), notInArray(legacyCpus.id, activeLegacyCpuIds))
            : eq(legacyCpus.isSeed, true),
        );

      await tx
        .delete(gpuSeries)
        .where(
          activeLegacyGpuIds.length > 0
            ? and(
                eq(gpuSeries.isSeed, true),
                eq(gpuSeries.kind, 'legacy'),
                notInArray(gpuSeries.id, activeLegacyGpuIds),
              )
            : and(eq(gpuSeries.isSeed, true), eq(gpuSeries.kind, 'legacy')),
        );

      // Never update `kind` on conflict because DB trigger forbids mutating gpu_series.kind.
      await tx
        .insert(gpuSeries)
        .values(buildRetailGpuSeriesSeedRows())
        .onConflictDoUpdate({
          target: gpuSeries.id,
          set: {
            name: sql`excluded.name`,
            vendor: sql`excluded.vendor`,
            vramGb: sql`excluded.vram_gb`,
            tbpW: sql`excluded.tbp_w`,
            cores: sql`excluded.cores`,
            baseClockMhz: sql`excluded.base_clock_mhz`,
            boostClockMhz: sql`excluded.boost_clock_mhz`,
            memoryType: sql`excluded.memory_type`,
            busWidthBit: sql`excluded.bus_width_bit`,
            passmarkRaw: sql`excluded.passmark_raw`,
            passmarkSource: sql`excluded.passmark_source`,
            updatedAt: now,
          },
          setWhere: eq(gpuSeries.isSeed, true),
        });

      await tx
        .insert(gpuSeries)
        .values(buildLegacyGpuSeriesSeedRows())
        .onConflictDoUpdate({
          target: gpuSeries.id,
          set: {
            name: sql`excluded.name`,
            vendor: sql`excluded.vendor`,
            vramGb: sql`excluded.vram_gb`,
            tbpW: sql`excluded.tbp_w`,
            passmarkRaw: sql`excluded.passmark_raw`,
            passmarkSource: sql`excluded.passmark_source`,
            updatedAt: now,
          },
          setWhere: eq(gpuSeries.isSeed, true),
        });

      await tx
        .insert(products)
        .values(buildProductSeedRows(storage))
        .onConflictDoUpdate({
          target: products.id,
          set: {
            name: sql`excluded.name`,
            priceVnd: sql`excluded.price_vnd`,
            imageUrl: sql`excluded.image_url`,
            imageStoragePath: sql`excluded.image_storage_path`,
            updatedAt: now,
          },
          setWhere: eq(products.isSeed, true),
        });

      await tx
        .insert(cpuSpecs)
        .values(buildCpuSpecSeedRows())
        .onConflictDoUpdate({
          target: cpuSpecs.productId,
          set: {
            vendor: sql`excluded.vendor`,
            architecture: sql`excluded.architecture`,
            socket: sql`excluded.socket`,
            processNode: sql`excluded.process_node`,
            coresTotal: sql`excluded.cores_total`,
            threadsTotal: sql`excluded.threads_total`,
            pCores: sql`excluded.p_cores`,
            eCores: sql`excluded.e_cores`,
            baseClockGhz: sql`excluded.base_clock_ghz`,
            boostClockGhz: sql`excluded.boost_clock_ghz`,
            cacheText: sql`excluded.cache_text`,
            l3CacheMb: sql`excluded.l3_cache_mb`,
            tdpW: sql`excluded.tdp_w`,
            psuPowerW: sql`excluded.psu_power_w`,
            ramSupport: sql`excluded.ram_support`,
            passmarkRaw: sql`excluded.passmark_raw`,
            passmarkSource: sql`excluded.passmark_source`,
          },
          setWhere: sql`EXISTS (SELECT 1 FROM products WHERE products.id = ${cpuSpecs.productId} AND products.is_seed = true)`,
        });

      await tx
        .insert(gpuVariants)
        .values(buildGpuVariantSeedRows())
        .onConflictDoUpdate({
          target: gpuVariants.productId,
          set: {
            seriesId: sql`excluded.series_id`,
            aibBrand: sql`excluded.aib_brand`,
            isLimitedEdition: sql`excluded.is_limited_edition`,
            lengthMm: sql`excluded.length_mm`,
            slotThickness: sql`excluded.slot_thickness`,
            hdmiCount: sql`excluded.hdmi_count`,
            dpCount: sql`excluded.dp_count`,
          },
          setWhere: sql`EXISTS (SELECT 1 FROM products WHERE products.id = ${gpuVariants.productId} AND products.is_seed = true)`,
        });

      await tx
        .insert(legacyCpus)
        .values(buildLegacyCpuSeedRows())
        .onConflictDoUpdate({
          target: legacyCpus.id,
          set: {
            name: sql`excluded.name`,
            vendor: sql`excluded.vendor`,
            socket: sql`excluded.socket`,
            coresTotal: sql`excluded.cores_total`,
            threadsTotal: sql`excluded.threads_total`,
            psuPowerW: sql`excluded.psu_power_w`,
            passmarkRaw: sql`excluded.passmark_raw`,
            passmarkSource: sql`excluded.passmark_source`,
            updatedAt: now,
          },
          setWhere: eq(legacyCpus.isSeed, true),
        });
    });

    console.log(
      `Synced seed catalog cleanly: ${RETAIL_CPU_SEEDS.length} retail CPUs, ${RETAIL_GPU_SERIES_SEEDS.length} retail GPU series, ${GPU_VARIANT_SEEDS.length} GPU variants, ${LEGACY_CPU_SEEDS.length} legacy CPUs, ${LEGACY_GPU_SERIES_SEEDS.length} legacy GPUs.`,
    );
  } finally {
    await pgSql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error('Database seed sync failed:', err);
  process.exit(1);
});
