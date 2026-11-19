import 'server-only';

import { bigint, boolean, integer, numeric, pgView, smallint, text, timestamp } from 'drizzle-orm/pg-core';
import { categoryEnum } from './schema/products';

/**
 * Existing SQL view created via custom Drizzle migration.
 * Combines active CPUs and active AIB GPU variants (inheriting retail series specs)
 * with dynamic base-100 PassMark normalization partitioned by category.
 */
export const storefrontProductsV = pgView('storefront_products_v', {
  id: text('id').notNull(),
  category: categoryEnum('category').notNull(),
  name: text('name').notNull(),
  priceVnd: bigint('price_vnd', { mode: 'number' }).notNull(),
  imageUrl: text('image_url'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  vendor: text('vendor').notNull(),
  aibBrand: text('aib_brand'),
  seriesId: text('series_id'),
  isLimitedEdition: boolean('is_limited_edition').notNull(),
  socket: text('socket'),
  vramGb: smallint('vram_gb'),
  passmarkRaw: integer('passmark_raw').notNull(),
  normalizedScore: numeric('normalized_score', { precision: 5, scale: 1, mode: 'number' }).notNull(),
  searchText: text('search_text').notNull(),
}).existing();
