import 'server-only';

import { sql } from 'drizzle-orm';
import {
  check,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const oauthProviderEnum = pgEnum('oauth_provider', ['google', 'facebook']);

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    username: text('username').unique(),
    passwordHash: text('password_hash'),
    email: text('email'),
    displayName: text('display_name').notNull(),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      'users_username_format_chk',
      sql`${t.username} IS NULL OR (${t.username} ~ '^[a-z0-9_.-]{3,30}$' AND ${t.username} <> 'admin')`,
    ),
    check(
      'users_password_pair_chk',
      sql`(${t.username} IS NULL AND ${t.passwordHash} IS NULL) OR (${t.username} IS NOT NULL AND ${t.passwordHash} IS NOT NULL)`,
    ),
    check('users_display_name_chk', sql`char_length(${t.displayName}) BETWEEN 1 AND 80`),
    index('users_email_idx').on(t.email),
  ],
);

export const oauthAccounts = pgTable(
  'oauth_accounts',
  {
    provider: oauthProviderEnum('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    providerEmail: text('provider_email'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ name: 'oauth_accounts_pk', columns: [t.provider, t.providerAccountId] }),
    index('oauth_accounts_user_idx').on(t.userId),
  ],
);
