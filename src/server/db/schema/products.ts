import 'server-only';

import { isNull, sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const categoryEnum = pgEnum('category', ['cpu', 'gpu']);

export const products = pgTable(
  'products',
  {
    id: text('id').primaryKey(),
    category: categoryEnum('category').notNull(),
    name: text('name').notNull(),
    priceVnd: bigint('price_vnd', { mode: 'number' }).notNull(),
    imageUrl: text('image_url'),
    imageStoragePath: text('image_storage_path'),
    isSeed: boolean('is_seed').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    unique('products_id_category_uq').on(t.id, t.category),
    check(
      'products_id_format_chk',
      sql`${t.id} ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(${t.id}) <= 80`,
    ),
    check('products_name_len_chk', sql`char_length(${t.name}) BETWEEN 2 AND 150`),
    check('products_price_positive_chk', sql`${t.priceVnd} > 0`),
    uniqueIndex('products_active_name_uq').on(sql`lower(${t.name})`).where(isNull(t.deletedAt)),
  ],
);
