import { eq, sql } from 'drizzle-orm';
import { createDbConnection } from '../src/server/db/client';
import { cpuSpecs, gpuSeries, gpuVariants, legacyCpus, products } from '../src/server/db/schema';
import { RETAIL_GPU_SERIES_SEEDS } from '../src/server/db/seed/data/gpu-series';
import { GPU_VARIANT_SEEDS } from '../src/server/db/seed/data/gpu-variants';
import { LEGACY_CPU_SEEDS } from '../src/server/db/seed/data/legacy-cpus';
import { LEGACY_GPU_SERIES_SEEDS } from '../src/server/db/seed/data/legacy-gpus';
import { RETAIL_CPU_SEEDS } from '../src/server/db/seed/data/retail-cpus';
import { buildSeedImageUrl, resolveSeedStorageConfig } from '../src/server/db/seed/seed-catalog';
import { SEED_IMAGE_PREFIX } from '../src/shared/constants';
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
      // Never update `kind` on conflict because DB trigger forbids mutating gpu_series.kind.
      for (const s of RETAIL_GPU_SERIES_SEEDS) {
        await tx
          .insert(gpuSeries)
          .values({
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
          })
          .onConflictDoUpdate({
            target: gpuSeries.id,
            set: {
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
              updatedAt: now,
            },
            setWhere: eq(gpuSeries.isSeed, true),
          });
      }

      for (const s of LEGACY_GPU_SERIES_SEEDS) {
        await tx
          .insert(gpuSeries)
          .values({
            id: s.id,
            kind: s.kind,
            name: s.name,
            vendor: s.vendor,
            vramGb: s.vramGb,
            tbpW: s.tbpW,
            passmarkRaw: s.passmarkRaw ?? null,
            passmarkSource: s.passmarkRaw != null ? (s.passmarkSource ?? 'PassMark') : null,
            isSeed: true,
          })
          .onConflictDoUpdate({
            target: gpuSeries.id,
            set: {
              name: s.name,
              vendor: s.vendor,
              vramGb: s.vramGb,
              tbpW: s.tbpW,
              passmarkRaw: s.passmarkRaw ?? null,
              passmarkSource: s.passmarkRaw != null ? (s.passmarkSource ?? 'PassMark') : null,
              updatedAt: now,
            },
            setWhere: eq(gpuSeries.isSeed, true),
          });
      }

      const productRows = [
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

      await tx
        .insert(products)
        .values(productRows)
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
        .values(
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
        )
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
        });

      await tx
        .insert(gpuVariants)
        .values(
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
        )
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
        });

      await tx
        .insert(legacyCpus)
        .values(
          LEGACY_CPU_SEEDS.map((c) => ({
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
          })),
        )
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
