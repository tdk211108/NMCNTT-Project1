import 'server-only';

import { isNull, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { cpuVendorEnum } from './cpu';

export const legacyCpus = pgTable(
  'legacy_cpus',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    vendor: cpuVendorEnum('vendor').notNull(),
    socket: text('socket'),
    coresTotal: smallint('cores_total'),
    threadsTotal: smallint('threads_total'),
    psuPowerW: smallint('psu_power_w').notNull(),
    passmarkRaw: integer('passmark_raw'),
    passmarkSource: text('passmark_source'),
    isSeed: boolean('is_seed').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    check('legacy_cpus_id_format_chk', sql`${t.id} ~ '^C[0-9]{2,4}$'`),
    check('legacy_cpus_name_len_chk', sql`char_length(${t.name}) BETWEEN 2 AND 100`),
    check('legacy_cpus_cores_chk', sql`${t.coresTotal} > 0`),
    check('legacy_cpus_threads_chk', sql`${t.threadsTotal} > 0`),
    check('legacy_cpus_psu_power_chk', sql`${t.psuPowerW} > 0`),
    check('legacy_cpus_passmark_chk', sql`${t.passmarkRaw} > 0`),
    uniqueIndex('legacy_cpus_active_name_uq').on(sql`lower(${t.name})`).where(isNull(t.deletedAt)),
  ],
);
