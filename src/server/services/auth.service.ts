import 'server-only';

import { and, eq, sql } from 'drizzle-orm';
import { authLoginSchema, authRegisterSchema } from '@/shared/schemas';
import type { SessionUser } from '@/shared/types';
import type { OAuthUserProfile } from '../auth/oauth';
import { hashPassword, isValidScryptHashFormat, verifyPassword } from '../auth/password';
import { createAdminSessionUser } from '../auth/session';
import { getDb, type DbClient } from '../db/client';
import { oauthAccounts, users } from '../db/schema';
import { AppError, extractPgError } from '../http/errors';
import { checkRateLimit, recordAuthFailure } from '../security/rate-limit';

const INVALID_CREDENTIALS_MESSAGE = 'Tên đăng nhập hoặc mật khẩu không đúng.';

function toCustomerSessionUser(
  row: typeof users.$inferSelect,
  provider: SessionUser['provider'],
): SessionUser {
  return {
    id: row.id,
    role: 'customer',
    username: row.username,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    provider,
  };
}

export async function loginWithCredentials(
  rawInput: unknown,
  ipHash: string,
  db: DbClient = getDb(),
  now?: Date,
): Promise<SessionUser> {
  const peekUsername =
    rawInput &&
    typeof rawInput === 'object' &&
    typeof (rawInput as { username?: unknown }).username === 'string'
      ? (rawInput as { username: string }).username.trim().toLowerCase()
      : '';
  const scope = peekUsername === 'admin' ? 'admin_login' : 'user_login';

  await checkRateLimit(db, scope, ipHash, now);

  const parsed = authLoginSchema.safeParse(rawInput);
  if (!parsed.success) {
    await recordAuthFailure(db, scope, ipHash, now);
    throw new AppError('UNAUTHORIZED', { message: INVALID_CREDENTIALS_MESSAGE });
  }

  if (parsed.data.username === 'admin') {
    const storedHash = (process.env.ADMIN_PASSWORD ?? '').trim();
    if (!isValidScryptHashFormat(storedHash)) {
      console.error('[auth/login] ADMIN_PASSWORD is missing or not a valid scrypt hash.');
      throw new AppError('INTERNAL', { status: 500 });
    }
    const valid = await verifyPassword(parsed.data.password, storedHash);
    if (!valid) {
      await recordAuthFailure(db, 'admin_login', ipHash, now);
      throw new AppError('UNAUTHORIZED', { message: INVALID_CREDENTIALS_MESSAGE });
    }
    return createAdminSessionUser();
  }

  const [userRow] = await db
    .select()
    .from(users)
    .where(eq(users.username, parsed.data.username))
    .limit(1);

  if (!userRow || !userRow.passwordHash) {
    await recordAuthFailure(db, 'user_login', ipHash, now);
    throw new AppError('UNAUTHORIZED', { message: INVALID_CREDENTIALS_MESSAGE });
  }

  const valid = await verifyPassword(parsed.data.password, userRow.passwordHash);
  if (!valid) {
    await recordAuthFailure(db, 'user_login', ipHash, now);
    throw new AppError('UNAUTHORIZED', { message: INVALID_CREDENTIALS_MESSAGE });
  }

  return toCustomerSessionUser(userRow, 'password');
}

export async function registerCustomer(
  rawInput: unknown,
  ipHash: string,
  db: DbClient = getDb(),
  now?: Date,
): Promise<SessionUser> {
  await checkRateLimit(db, 'user_register', ipHash, now);

  const parsed = authRegisterSchema.parse(rawInput);
  const passwordHash = await hashPassword(parsed.password);

  try {
    const [created] = await db
      .insert(users)
      .values({
        username: parsed.username,
        passwordHash,
        displayName: parsed.displayName,
      })
      .returning();

    return toCustomerSessionUser(created, 'password');
  } catch (error) {
    const pg = extractPgError(error);
    if (pg.code === '23505') {
      await recordAuthFailure(db, 'user_register', ipHash, now);
      throw new AppError('USERNAME_TAKEN');
    }
    throw error;
  }
}

export async function upsertOAuthUser(
  profile: OAuthUserProfile,
  db: DbClient = getDb(),
): Promise<SessionUser> {
  return db.transaction(async (tx) => {
    const [existingLink] = await tx
      .select({ user: users })
      .from(oauthAccounts)
      .innerJoin(users, eq(users.id, oauthAccounts.userId))
      .where(
        and(
          eq(oauthAccounts.provider, profile.provider),
          eq(oauthAccounts.providerAccountId, profile.providerAccountId),
        ),
      )
      .limit(1);

    if (existingLink) {
      const [updated] = await tx
        .update(users)
        .set({
          displayName: profile.displayName || existingLink.user.displayName,
          avatarUrl: profile.avatarUrl ?? existingLink.user.avatarUrl,
          email:
            existingLink.user.email ??
            (profile.provider === 'google' && profile.emailVerified ? profile.email : null),
          updatedAt: sql`now()`,
        })
        .where(eq(users.id, existingLink.user.id))
        .returning();

      return toCustomerSessionUser(updated, profile.provider);
    }

    let targetUser: typeof users.$inferSelect | undefined;

    if (profile.provider === 'google' && profile.emailVerified && profile.email) {
      const [matchedByEmail] = await tx
        .select()
        .from(users)
        .where(eq(users.email, profile.email))
        .limit(1);

      if (matchedByEmail) {
        const [updated] = await tx
          .update(users)
          .set({
            avatarUrl: matchedByEmail.avatarUrl ?? profile.avatarUrl,
            updatedAt: sql`now()`,
          })
          .where(eq(users.id, matchedByEmail.id))
          .returning();
        targetUser = updated;
      }
    }

    if (!targetUser) {
      const [created] = await tx
        .insert(users)
        .values({
          displayName: profile.displayName,
          email: profile.provider === 'google' && profile.emailVerified ? profile.email : null,
          avatarUrl: profile.avatarUrl,
        })
        .returning();
      targetUser = created;
    }

    await tx
      .insert(oauthAccounts)
      .values({
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
        userId: targetUser.id,
        providerEmail: profile.email,
      })
      .onConflictDoNothing();

    return toCustomerSessionUser(targetUser, profile.provider);
  });
}
