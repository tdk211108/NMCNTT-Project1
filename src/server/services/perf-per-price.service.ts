import 'server-only';

import { and, eq, inArray } from 'drizzle-orm';
import { VI_MESSAGES } from '@/shared/messages/vi';
import type { ChipVendor, PerfPerPriceQuery, PerfPerPriceResponse } from '@/shared/types';
import { getDb, type DbClient } from '../db/client';
import { storefrontProductsV } from '../db/views';
import { rankByPerfPerPrice } from '../domain/scoring';

export async function getPerfPerPriceRanking(
  query: PerfPerPriceQuery,
  db: DbClient = getDb(),
): Promise<PerfPerPriceResponse> {
  const conditions = [eq(storefrontProductsV.category, query.category)];
  if (query.vendor?.length) {
    conditions.push(inArray(storefrontProductsV.vendor, query.vendor));
  }

  const rows = await db
    .select({
      id: storefrontProductsV.id,
      name: storefrontProductsV.name,
      vendor: storefrontProductsV.vendor,
      aibBrand: storefrontProductsV.aibBrand,
      priceVnd: storefrontProductsV.priceVnd,
      passmarkRaw: storefrontProductsV.passmarkRaw,
      normalizedScore: storefrontProductsV.normalizedScore,
    })
    .from(storefrontProductsV)
    .where(and(...conditions));

  const items = rankByPerfPerPrice(
    rows.map((row) => ({
      ...row,
      vendor: row.vendor as ChipVendor,
    })),
    query.maxPriceVnd,
  );

  return {
    category: query.category,
    maxPriceVnd: query.maxPriceVnd ?? null,
    items,
    notes: [
      VI_MESSAGES.tools.disclaimers.passmark,
      VI_MESSAGES.tools.disclaimers.estimation,
    ],
  };
}
