import 'server-only';

import { and, eq, inArray } from 'drizzle-orm';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type {
  ChipVendor,
  CpuVendor,
  GpuVendor,
  HardwareAwardWinner,
  PerfPerPriceQuery,
  PerfPerPriceResponse,
} from '@/shared/types';
import { getDb, type DbClient } from '../db/client';
import { cpuSpecs, gpuSeries, gpuVariants } from '../db/schema';
import { storefrontProductsV } from '../db/views';
import { buildCpuAwards, buildGpuAwards } from '../domain/awards';
import { rankByPerfPerPrice } from '../domain/scoring';

export async function getPerfPerPriceRanking(
  query: PerfPerPriceQuery,
  db: DbClient = getDb(),
): Promise<PerfPerPriceResponse> {
  const conditions = [eq(storefrontProductsV.category, query.category)];
  if (query.vendor?.length) {
    conditions.push(inArray(storefrontProductsV.vendor, query.vendor));
  }

  let awards: HardwareAwardWinner[];
  let items: ReturnType<typeof rankByPerfPerPrice>;

  if (query.category === 'cpu') {
    const rows = await db
      .select({
        id: storefrontProductsV.id,
        name: storefrontProductsV.name,
        vendor: storefrontProductsV.vendor,
        aibBrand: storefrontProductsV.aibBrand,
        priceVnd: storefrontProductsV.priceVnd,
        imageUrl: storefrontProductsV.imageUrl,
        passmarkRaw: storefrontProductsV.passmarkRaw,
        normalizedScore: storefrontProductsV.normalizedScore,
        socket: cpuSpecs.socket,
        coresTotal: cpuSpecs.coresTotal,
        threadsTotal: cpuSpecs.threadsTotal,
        psuPowerW: cpuSpecs.psuPowerW,
        tdpW: cpuSpecs.tdpW,
        l3CacheMb: cpuSpecs.l3CacheMb,
        boostClockGhz: cpuSpecs.boostClockGhz,
      })
      .from(storefrontProductsV)
      .innerJoin(cpuSpecs, eq(cpuSpecs.productId, storefrontProductsV.id))
      .where(and(...conditions));

    items = rankByPerfPerPrice(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        vendor: row.vendor as ChipVendor,
        aibBrand: row.aibBrand,
        priceVnd: row.priceVnd,
        passmarkRaw: row.passmarkRaw,
        normalizedScore: row.normalizedScore,
      })),
      query.maxPriceVnd,
    );

    awards = buildCpuAwards(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        vendor: row.vendor as CpuVendor,
        priceVnd: row.priceVnd,
        imageUrl: row.imageUrl,
        socket: row.socket,
        coresTotal: row.coresTotal,
        threadsTotal: row.threadsTotal,
        psuPowerW: row.psuPowerW,
        tdpW: row.tdpW,
        l3CacheMb: row.l3CacheMb,
        boostClockGhz: row.boostClockGhz,
        passmarkRaw: row.passmarkRaw,
        normalizedScore: row.normalizedScore,
      })),
      query.maxPriceVnd,
    );
  } else {
    const rows = await db
      .select({
        id: storefrontProductsV.id,
        name: storefrontProductsV.name,
        vendor: storefrontProductsV.vendor,
        aibBrand: storefrontProductsV.aibBrand,
        isLimitedEdition: storefrontProductsV.isLimitedEdition,
        priceVnd: storefrontProductsV.priceVnd,
        imageUrl: storefrontProductsV.imageUrl,
        passmarkRaw: storefrontProductsV.passmarkRaw,
        normalizedScore: storefrontProductsV.normalizedScore,
        seriesName: gpuSeries.name,
        vramGb: gpuSeries.vramGb,
        tbpW: gpuSeries.tbpW,
        lengthMm: gpuVariants.lengthMm,
        slotThickness: gpuVariants.slotThickness,
      })
      .from(storefrontProductsV)
      .innerJoin(gpuVariants, eq(gpuVariants.productId, storefrontProductsV.id))
      .innerJoin(gpuSeries, eq(gpuSeries.id, gpuVariants.seriesId))
      .where(and(...conditions));

    items = rankByPerfPerPrice(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        vendor: row.vendor as ChipVendor,
        aibBrand: row.aibBrand,
        priceVnd: row.priceVnd,
        passmarkRaw: row.passmarkRaw,
        normalizedScore: row.normalizedScore,
      })),
      query.maxPriceVnd,
    );

    awards = buildGpuAwards(
      rows.map((row) => ({
        id: row.id,
        seriesName: row.seriesName,
        name: row.name,
        vendor: row.vendor as GpuVendor,
        aibBrand: row.aibBrand ?? row.vendor.toUpperCase(),
        isLimitedEdition: row.isLimitedEdition,
        priceVnd: row.priceVnd,
        imageUrl: row.imageUrl,
        vramGb: row.vramGb,
        tbpW: row.tbpW,
        lengthMm: row.lengthMm,
        slotThickness: row.slotThickness,
        passmarkRaw: row.passmarkRaw,
        normalizedScore: row.normalizedScore,
      })),
      query.maxPriceVnd,
    );
  }

  return {
    category: query.category,
    maxPriceVnd: query.maxPriceVnd ?? null,
    totalEvaluated: items.length,
    awards,
    items,
    notes: [
      VI_MESSAGES.tools.disclaimers.passmark,
      VI_MESSAGES.tools.disclaimers.awards,
    ],
  };
}
