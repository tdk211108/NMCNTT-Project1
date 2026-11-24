import 'server-only';

import { isNull, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { categoryEnum, products } from './products';

export const gpuVendorEnum = pgEnum('gpu_vendor', ['nvidia', 'amd', 'intel']);
export const gpuSeriesKindEnum = pgEnum('gpu_series_kind', ['retail', 'legacy']);

export const gpuSeries = pgTable(
  'gpu_series',
  {
    id: text('id').primaryKey(),
    kind: gpuSeriesKindEnum('kind').notNull(),
    name: text('name').notNull(),
    vendor: gpuVendorEnum('vendor').notNull(),
    vramGb: smallint('vram_gb').notNull(),
    tbpW: smallint('tbp_w').notNull(),
    cores: integer('cores'),
    baseClockMhz: integer('base_clock_mhz'),
    boostClockMhz: integer('boost_clock_mhz'),
    memoryType: text('memory_type'),
    busWidthBit: smallint('bus_width_bit'),
    passmarkRaw: integer('passmark_raw'),
    passmarkSource: text('passmark_source'),
    isSeed: boolean('is_seed').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    unique('gpu_series_id_kind_uq').on(t.id, t.kind),
    check('gpu_series_id_format_chk', sql`${t.id} ~ '^[A-Za-z0-9-]{2,60}$'`),
    check('gpu_series_name_len_chk', sql`char_length(${t.name}) BETWEEN 2 AND 100`),
    check('gpu_series_vram_chk', sql`${t.vramGb} > 0`),
    check('gpu_series_tbp_chk', sql`${t.tbpW} > 0`),
    check('gpu_series_cores_chk', sql`${t.cores} > 0`),
    check('gpu_series_base_clock_chk', sql`${t.baseClockMhz} > 0`),
    check('gpu_series_boost_clock_chk', sql`${t.boostClockMhz} > 0`),
    check('gpu_series_bus_width_chk', sql`${t.busWidthBit} > 0`),
    check('gpu_series_passmark_chk', sql`${t.passmarkRaw} > 0`),
    check(
      'gpu_series_retail_specs_chk',
      sql`${t.kind} = 'legacy' OR (${t.cores} IS NOT NULL AND ${t.baseClockMhz} IS NOT NULL AND ${t.boostClockMhz} IS NOT NULL AND ${t.memoryType} IS NOT NULL AND ${t.busWidthBit} IS NOT NULL AND ${t.passmarkRaw} IS NOT NULL AND ${t.passmarkSource} IS NOT NULL AND ${t.boostClockMhz} >= ${t.baseClockMhz})`,
    ),
    uniqueIndex('gpu_series_active_name_uq').on(sql`lower(${t.name})`).where(isNull(t.deletedAt)),
  ],
);

export const gpuVariants = pgTable(
  'gpu_variants',
  {
    productId: text('product_id').primaryKey(),
    category: categoryEnum('category').notNull().default('gpu'),
    seriesId: text('series_id').notNull(),
    seriesKind: gpuSeriesKindEnum('series_kind').notNull().default('retail'),
    aibBrand: text('aib_brand').notNull(),
    isLimitedEdition: boolean('is_limited_edition').notNull().default(false),
    lengthMm: smallint('length_mm').notNull(),
    slotThickness: numeric('slot_thickness', { precision: 3, scale: 1, mode: 'number' }).notNull(),
    hdmiCount: smallint('hdmi_count').notNull(),
    dpCount: smallint('dp_count').notNull(),
  },
  (t) => [
    check('gpu_variants_category_chk', sql`${t.category} = 'gpu'`),
    check('gpu_variants_series_kind_chk', sql`${t.seriesKind} = 'retail'`),
    check('gpu_variants_aib_brand_chk', sql`char_length(${t.aibBrand}) BETWEEN 2 AND 40`),
    check('gpu_variants_length_chk', sql`${t.lengthMm} BETWEEN 100 AND 450`),
    check('gpu_variants_slot_chk', sql`${t.slotThickness} BETWEEN 1 AND 5`),
    check('gpu_variants_hdmi_chk', sql`${t.hdmiCount} BETWEEN 0 AND 8`),
    check('gpu_variants_dp_chk', sql`${t.dpCount} BETWEEN 0 AND 8`),
    foreignKey({
      name: 'gpu_variants_product_fk',
      columns: [t.productId, t.category],
      foreignColumns: [products.id, products.category],
    }),
    foreignKey({
      name: 'gpu_variants_series_fk',
      columns: [t.seriesId, t.seriesKind],
      foreignColumns: [gpuSeries.id, gpuSeries.kind],
    }),
    index('gpu_variants_series_idx').on(t.seriesId),
  ],
);
