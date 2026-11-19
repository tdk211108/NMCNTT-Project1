import 'server-only';

import { bigint, index, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const authScopeEnum = pgEnum('auth_scope', [
  'order_lookup',
  'admin_login',
  'user_login',
  'user_register',
]);

export const authFailures = pgTable(
  'auth_failures',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    scope: authScopeEnum('scope').notNull(),
    ipHash: text('ip_hash').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('auth_failures_lookup_idx').on(t.scope, t.ipHash, t.occurredAt.desc())],
);
