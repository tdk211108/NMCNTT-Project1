import 'server-only';

import { asc, desc, sql } from 'drizzle-orm';
import { SEARCH_SUGGEST_MAX_RESULTS } from '@/shared/constants';
import type { SearchSuggestion } from '@/shared/types';
import { getDb, type DbClient } from '../db/client';
import { storefrontProductsV } from '../db/views';
import { escapeIlikePattern } from './catalog.service';

export async function suggestProducts(
  rawQuery: string,
  db: DbClient = getDb(),
): Promise<SearchSuggestion[]> {
  const escaped = escapeIlikePattern(rawQuery.trim().toLowerCase());
  const containsPattern = `%${escaped}%`;
  const prefixPattern = `${escaped}%`;

  const rows = await db
    .select({
      id: storefrontProductsV.id,
      name: storefrontProductsV.name,
      category: storefrontProductsV.category,
      priceVnd: storefrontProductsV.priceVnd,
      imageUrl: storefrontProductsV.imageUrl,
    })
    .from(storefrontProductsV)
    .where(sql`${storefrontProductsV.searchText} ILIKE ${containsPattern}`)
    .orderBy(
      asc(sql`CASE WHEN lower(${storefrontProductsV.name}) LIKE ${prefixPattern} THEN 0 ELSE 1 END`),
      desc(storefrontProductsV.normalizedScore),
      asc(storefrontProductsV.priceVnd),
      asc(storefrontProductsV.id),
    )
    .limit(SEARCH_SUGGEST_MAX_RESULTS);

  return rows;
}
