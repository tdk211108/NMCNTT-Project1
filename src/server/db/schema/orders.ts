import 'server-only';

import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { categoryEnum, products } from './products';
import { users } from './auth';

export const paymentMethodEnum = pgEnum('payment_method', ['cod', 'bank_transfer', 'card']);

export const orders = pgTable(
  'orders',
  {
    id: text('id').primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    idempotencyKey: uuid('idempotency_key').notNull().unique(),
    requestHash: text('request_hash').notNull(),
    customerName: text('customer_name').notNull(),
    phone: text('phone').notNull(),
    provinceCode: text('province_code').notNull(),
    provinceName: text('province_name').notNull(),
    wardCode: text('ward_code').notNull(),
    wardName: text('ward_name').notNull(),
    streetAddress: text('street_address').notNull(),
    note: text('note'),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    paymentReference: text('payment_reference').notNull(),
    totalQuantity: integer('total_quantity').notNull(),
    subtotalVnd: bigint('subtotal_vnd', { mode: 'number' }).notNull(),
    shippingFeeVnd: bigint('shipping_fee_vnd', { mode: 'number' }).notNull(),
    totalVnd: bigint('total_vnd', { mode: 'number' }).notNull(),
    statusStage: smallint('status_stage').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('orders_id_format_chk', sql`${t.id} ~ '^PC-[A-HJKMNP-TV-Z0-9]{10}$'`),
    check('orders_phone_format_chk', sql`${t.phone} ~ '^0(3|5|7|8|9)[0-9]{8}$'`),
    check('orders_total_quantity_chk', sql`${t.totalQuantity} BETWEEN 1 AND 2000`),
    check('orders_subtotal_positive_chk', sql`${t.subtotalVnd} > 0`),
    check('orders_shipping_fee_chk', sql`${t.shippingFeeVnd} IN (0, 50000)`),
    check('orders_total_sum_chk', sql`${t.totalVnd} = ${t.subtotalVnd} + ${t.shippingFeeVnd}`),
    check('orders_status_stage_chk', sql`${t.statusStage} BETWEEN 0 AND 4`),
    index('orders_created_at_idx').on(t.createdAt.desc()),
    index('orders_user_created_idx').on(t.userId, t.createdAt.desc()),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    lineNo: smallint('line_no').notNull(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id),
    productName: text('product_name').notNull(),
    category: categoryEnum('category').notNull(),
    unitPriceVnd: bigint('unit_price_vnd', { mode: 'number' }).notNull(),
    quantity: smallint('quantity').notNull(),
    lineTotalVnd: bigint('line_total_vnd', { mode: 'number' }).notNull(),
  },
  (t) => [
    primaryKey({ name: 'order_items_pk', columns: [t.orderId, t.lineNo] }),
    unique('order_items_order_product_uq').on(t.orderId, t.productId),
    check('order_items_line_no_chk', sql`${t.lineNo} BETWEEN 1 AND 20`),
    check('order_items_unit_price_chk', sql`${t.unitPriceVnd} > 0`),
    check('order_items_quantity_chk', sql`${t.quantity} BETWEEN 1 AND 100`),
    check('order_items_line_total_chk', sql`${t.lineTotalVnd} = ${t.unitPriceVnd} * ${t.quantity}`),
    index('order_items_product_idx').on(t.productId),
  ],
);

export const orderStatusEvents = pgTable(
  'order_status_events',
  {
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    stage: smallint('stage').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ name: 'order_status_events_pk', columns: [t.orderId, t.stage] }),
    check('order_status_events_stage_chk', sql`${t.stage} BETWEEN 0 AND 4`),
  ],
);
