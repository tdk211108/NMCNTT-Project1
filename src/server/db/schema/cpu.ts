import 'server-only';

import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  integer,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
} from 'drizzle-orm/pg-core';
import { categoryEnum, products } from './products';

export const cpuVendorEnum = pgEnum('cpu_vendor', ['intel', 'amd']);

export const cpuSpecs = pgTable(
  'cpu_specs',
  {
    productId: text('product_id').primaryKey(),
    category: categoryEnum('category').notNull().default('cpu'),
    vendor: cpuVendorEnum('vendor').notNull(),
    architecture: text('architecture').notNull(),
    socket: text('socket').notNull(),
    processNode: text('process_node').notNull(),
    coresTotal: smallint('cores_total').notNull(),
    threadsTotal: smallint('threads_total').notNull(),
    pCores: smallint('p_cores'),
    eCores: smallint('e_cores'),
    baseClockGhz: numeric('base_clock_ghz', { precision: 4, scale: 2, mode: 'number' }).notNull(),
    boostClockGhz: numeric('boost_clock_ghz', { precision: 4, scale: 2, mode: 'number' }).notNull(),
    cacheText: text('cache_text').notNull(),
    l3CacheMb: numeric('l3_cache_mb', { precision: 6, scale: 1, mode: 'number' }).notNull(),
    tdpW: smallint('tdp_w').notNull(),
    psuPowerW: smallint('psu_power_w').notNull(),
    ramSupport: text('ram_support').notNull(),
    passmarkRaw: integer('passmark_raw').notNull(),
    passmarkSource: text('passmark_source').notNull().default('PassMark'),
  },
  (t) => [
    check('cpu_specs_category_chk', sql`${t.category} = 'cpu'`),
    check('cpu_specs_cores_chk', sql`${t.coresTotal} > 0`),
    check('cpu_specs_threads_chk', sql`${t.threadsTotal} >= ${t.coresTotal}`),
    check('cpu_specs_p_cores_chk', sql`${t.pCores} > 0`),
    check('cpu_specs_e_cores_chk', sql`${t.eCores} >= 0`),
    check(
      'cpu_specs_hybrid_cores_chk',
      sql`(${t.pCores} IS NULL AND ${t.eCores} IS NULL) OR (${t.pCores} + ${t.eCores} = ${t.coresTotal})`,
    ),
    check('cpu_specs_base_clock_chk', sql`${t.baseClockGhz} > 0`),
    check('cpu_specs_boost_clock_chk', sql`${t.boostClockGhz} >= ${t.baseClockGhz}`),
    check('cpu_specs_l3_cache_chk', sql`${t.l3CacheMb} > 0`),
    check('cpu_specs_tdp_chk', sql`${t.tdpW} > 0`),
    check('cpu_specs_psu_power_chk', sql`${t.psuPowerW} >= ${t.tdpW}`),
    check('cpu_specs_passmark_chk', sql`${t.passmarkRaw} > 0`),
    foreignKey({
      name: 'cpu_specs_product_fk',
      columns: [t.productId, t.category],
      foreignColumns: [products.id, products.category],
    }),
  ],
);
