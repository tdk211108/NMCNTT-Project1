import 'server-only';

import { and, eq } from 'drizzle-orm';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { ComboQuery, ComboResponse, CpuVendor } from '@/shared/types';
import { getDb, type DbClient } from '../db/client';
import { cpuSpecs, gpuSeries, gpuVariants } from '../db/schema';
import { storefrontProductsV } from '../db/views';
import { recommendCombos } from '../domain/combo-advisor';

/**
 * Loads active retail CPUs and GPU variants (optionally filtered by vendor) and computes
 * up to 3 balanced CPU + GPU build recommendations for the requested budget and purpose.
 */
export async function getComboRecommendations(
  query: ComboQuery,
  db: DbClient = getDb(),
): Promise<ComboResponse> {
  const cpuConditions = [eq(storefrontProductsV.category, 'cpu')];
  if (query.cpuVendor) {
    cpuConditions.push(eq(storefrontProductsV.vendor, query.cpuVendor));
  }

  const gpuConditions = [eq(storefrontProductsV.category, 'gpu')];
  if (query.gpuVendor) {
    gpuConditions.push(eq(storefrontProductsV.vendor, query.gpuVendor));
  }

  const [cpuRows, gpuRows] = await Promise.all([
    db
      .select({
        id: storefrontProductsV.id,
        name: storefrontProductsV.name,
        vendor: storefrontProductsV.vendor,
        socket: cpuSpecs.socket,
        coresTotal: cpuSpecs.coresTotal,
        threadsTotal: cpuSpecs.threadsTotal,
        psuPowerW: cpuSpecs.psuPowerW,
        priceVnd: storefrontProductsV.priceVnd,
        imageUrl: storefrontProductsV.imageUrl,
        passmarkRaw: storefrontProductsV.passmarkRaw,
        normalizedScore: storefrontProductsV.normalizedScore,
      })
      .from(storefrontProductsV)
      .innerJoin(cpuSpecs, eq(cpuSpecs.productId, storefrontProductsV.id))
      .where(and(...cpuConditions)),
    db
      .select({
        id: storefrontProductsV.id,
        seriesId: gpuSeries.id,
        seriesName: gpuSeries.name,
        name: storefrontProductsV.name,
        vendor: gpuSeries.vendor,
        aibBrand: gpuVariants.aibBrand,
        isLimitedEdition: gpuVariants.isLimitedEdition,
        vramGb: gpuSeries.vramGb,
        tbpW: gpuSeries.tbpW,
        priceVnd: storefrontProductsV.priceVnd,
        imageUrl: storefrontProductsV.imageUrl,
        passmarkRaw: storefrontProductsV.passmarkRaw,
        normalizedScore: storefrontProductsV.normalizedScore,
      })
      .from(storefrontProductsV)
      .innerJoin(gpuVariants, eq(gpuVariants.productId, storefrontProductsV.id))
      .innerJoin(gpuSeries, eq(gpuSeries.id, gpuVariants.seriesId))
      .where(and(...gpuConditions)),
  ]);

  const result = recommendCombos({
    budgetVnd: query.budgetVnd,
    purpose: query.purpose,
    cpus: cpuRows.map((row) => ({
      ...row,
      vendor: row.vendor as CpuVendor,
    })),
    gpus: gpuRows,
  });

  return {
    budgetVnd: query.budgetVnd,
    purpose: query.purpose,
    targetGpuSharePct: result.targetGpuSharePct,
    targetCpuSharePct: result.targetCpuSharePct,
    combos: result.combos,
    minAvailableComboPriceVnd: result.minAvailableComboPriceVnd,
    cheapestReferenceCombo: result.cheapestReferenceCombo,
    notes: [
      VI_MESSAGES.tools.disclaimers.passmark,
      VI_MESSAGES.tools.disclaimers.combo,
      VI_MESSAGES.tools.combo.budgetScopeNote,
    ],
  };
}
