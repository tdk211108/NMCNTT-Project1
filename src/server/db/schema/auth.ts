import 'server-only';

import { sql } from 'drizzle-orm';
import {
  check,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const oauthProviderEnum = pgEnum('oauth_provider', ['google', 'facebook']);
export const otpPurposeEnum = pgEnum('otp_purpose', [
  'register',
  'facebook_verify',
  'password_reset',
]);

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    username: text('username').unique(),
    passwordHash: text('password_hash'),
    email: text('email'),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
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
    check(
      'users_email_lowercase_chk',
      sql`${t.email} IS NULL OR ${t.email} = lower(${t.email})`,
    ),
    uniqueIndex('users_email_uq')
      .on(t.email)
      .where(sql`${t.email} IS NOT NULL`),
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

export const emailOtps = pgTable(
  'email_otps',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    purpose: otpPurposeEnum('purpose').notNull(),
    email: text('email').notNull(),
    codeHash: text('code_hash').notNull(),
    payloadJson: text('payload_json'),
    attempts: smallint('attempts').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('email_otps_email_lowercase_chk', sql`${t.email} = lower(${t.email})`),
    check('email_otps_attempts_chk', sql`${t.attempts} BETWEEN 0 AND 10`),
    index('email_otps_lookup_idx').on(t.purpose, t.email, t.createdAt.desc()),
  ],
);
