import 'server-only';

import { and, eq, sql } from 'drizzle-orm';
import { OTP_RESEND_COOLDOWN_SECONDS, OTP_TTL_MINUTES } from '@/shared/constants';
import {
  authLoginSchema,
  authRegisterSchema,
  authRegisterVerifySchema,
  changePasswordSchema,
  facebookEmailRequestOtpSchema,
  facebookEmailVerifyOtpSchema,
  forgotPasswordRequestOtpSchema,
  forgotPasswordResetSchema,
} from '@/shared/schemas';
import type { OtpPurpose, OtpRequestResponse, SessionUser } from '@/shared/types';
import type { FacebookPendingPayload, OAuthUserProfile } from '../auth/oauth';
import {
  consumeEmailOtpInTx,
  discardEmailOtp,
  issueEmailOtp,
  verifyEmailOtpPreTx,
} from '../auth/otp';
import { hashPassword, isValidScryptHashFormat, verifyPassword } from '../auth/password';
import { createAdminSessionUser } from '../auth/session';
import { getDb, type DbClient } from '../db/client';
import { oauthAccounts, orders, users } from '../db/schema';
import { sendEmail, type EmailSender } from '../email/resend';
import { buildOtpEmailTemplate } from '../email/templates';
import { AppError, extractPgError } from '../http/errors';
import { checkRateLimit, recordAuthFailure } from '../security/rate-limit';

const INVALID_CREDENTIALS_MESSAGE = 'Tên đăng nhập, email hoặc mật khẩu không đúng.';

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

async function sendIssuedOtpOrRollback(params: {
  db: DbClient;
  purpose: OtpPurpose;
  email: string;
  displayName?: string | null;
  payloadJson: string | null;
  ipHash: string;
  emailSender: EmailSender;
  now?: Date;
  skipRateLimitCheck?: boolean;
}): Promise<OtpRequestResponse> {
  const issued = await issueEmailOtp({
    db: params.db,
    purpose: params.purpose,
    email: params.email,
    payloadJson: params.payloadJson,
    ipHash: params.ipHash,
    now: params.now,
    skipRateLimitCheck: params.skipRateLimitCheck,
  });

  try {
    const template = buildOtpEmailTemplate({
      purpose: params.purpose,
      code: issued.code,
      displayName: params.displayName,
    });
    await params.emailSender({ to: params.email, ...template });
  } catch (error) {
    await discardEmailOtp(params.db, issued.id);
    throw error;
  }

  return {
    email: params.email,
    expiresInSeconds: issued.expiresInSeconds,
    resendCooldownSeconds: issued.resendCooldownSeconds,
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

  const identifier = parsed.data.username;
  const lookupCondition = identifier.includes('@')
    ? eq(users.email, identifier)
    : eq(users.username, identifier);

  const [userRow] = await db.select().from(users).where(lookupCondition).limit(1);

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

interface PendingRegisterPayload {
  username: string;
  displayName: string;
  passwordHash: string;
}

export async function requestRegistrationOtp(
  rawInput: unknown,
  ipHash: string,
  db: DbClient = getDb(),
  emailSender: EmailSender = sendEmail,
  now: Date = new Date(),
): Promise<OtpRequestResponse> {
  await checkRateLimit(db, 'user_register', ipHash, now);

  const parsed = authRegisterSchema.parse(rawInput);

  const [existingUsername, existingEmail] = await Promise.all([
    db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, parsed.username))
      .limit(1),
    db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, parsed.email))
      .limit(1),
  ]);

  if (existingUsername.length > 0) {
    await recordAuthFailure(db, 'user_register', ipHash, now);
    throw new AppError('USERNAME_TAKEN');
  }
  if (existingEmail.length > 0) {
    await recordAuthFailure(db, 'user_register', ipHash, now);
    throw new AppError('EMAIL_TAKEN');
  }

  const passwordHash = await hashPassword(parsed.password);
  const payload: PendingRegisterPayload = {
    username: parsed.username,
    displayName: parsed.displayName,
    passwordHash,
  };

  return sendIssuedOtpOrRollback({
    db,
    purpose: 'register',
    email: parsed.email,
    displayName: parsed.displayName,
    payloadJson: JSON.stringify(payload),
    ipHash,
    emailSender,
    now,
  });
}

export async function verifyRegistrationOtp(
  rawInput: unknown,
  ipHash: string,
  db: DbClient = getDb(),
  now: Date = new Date(),
): Promise<SessionUser> {
  const parsed = authRegisterVerifySchema.parse(rawInput);
  const otp = await verifyEmailOtpPreTx({
    db,
    purpose: 'register',
    email: parsed.email,
    code: parsed.code,
    ipHash,
    now,
  });

  if (!otp.payloadJson) {
    throw new AppError('OTP_EXPIRED');
  }

  let payload: PendingRegisterPayload;
  try {
    payload = JSON.parse(otp.payloadJson) as PendingRegisterPayload;
  } catch {
    throw new AppError('OTP_EXPIRED');
  }

  if (!payload.username || !payload.displayName || !payload.passwordHash) {
    throw new AppError('OTP_EXPIRED');
  }

  try {
    const created = await db.transaction(async (tx) => {
      await consumeEmailOtpInTx(tx, otp.id, now);
      const [inserted] = await tx
        .insert(users)
        .values({
          username: payload.username,
          displayName: payload.displayName,
          email: parsed.email,
          emailVerifiedAt: now,
          passwordHash: payload.passwordHash,
        })
        .returning();
      return inserted;
    });

    return toCustomerSessionUser(created, 'password');
  } catch (error) {
    const pg = extractPgError(error);
    if (pg.code === '23505') {
      await recordAuthFailure(db, 'user_register', ipHash, now);
      if (pg.constraint === 'users_email_uq') {
        throw new AppError('EMAIL_TAKEN');
      }
      throw new AppError('USERNAME_TAKEN');
    }
    throw error;
  }
}

// Google OAuth only; Facebook enters via resolveFacebookOAuthLogin + verifyFacebookEmailOtp.
export async function upsertOAuthUser(
  profile: OAuthUserProfile,
  db: DbClient = getDb(),
): Promise<SessionUser> {
  return db.transaction(async (tx) => {
    const verifiedGoogleEmail =
      profile.provider === 'google' && profile.emailVerified ? profile.email : null;

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
      const nextEmail = existingLink.user.email ?? verifiedGoogleEmail;
      const [updated] = await tx
        .update(users)
        .set({
          displayName: profile.displayName || existingLink.user.displayName,
          avatarUrl: profile.avatarUrl ?? existingLink.user.avatarUrl,
          email: nextEmail,
          emailVerifiedAt:
            existingLink.user.emailVerifiedAt ??
            (verifiedGoogleEmail ? sql`now()` : null),
          updatedAt: sql`now()`,
        })
        .where(eq(users.id, existingLink.user.id))
        .returning();

      return toCustomerSessionUser(updated, profile.provider);
    }

    let targetUser: typeof users.$inferSelect | undefined;

    if (verifiedGoogleEmail) {
      const [matchedByEmail] = await tx
        .select()
        .from(users)
        .where(eq(users.email, verifiedGoogleEmail))
        .limit(1);

      if (matchedByEmail) {
        const [updated] = await tx
          .update(users)
          .set({
            avatarUrl: matchedByEmail.avatarUrl ?? profile.avatarUrl,
            emailVerifiedAt: matchedByEmail.emailVerifiedAt ?? sql`now()`,
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
          email: verifiedGoogleEmail,
          emailVerifiedAt: verifiedGoogleEmail ? sql`now()` : null,
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

export async function resolveFacebookOAuthLogin(
  profile: OAuthUserProfile,
  db: DbClient = getDb(),
): Promise<{ status: 'authenticated'; user: SessionUser } | { status: 'requires_email_otp' }> {
  const [existingLink] = await db
    .select({ user: users })
    .from(oauthAccounts)
    .innerJoin(users, eq(users.id, oauthAccounts.userId))
    .where(
      and(
        eq(oauthAccounts.provider, 'facebook'),
        eq(oauthAccounts.providerAccountId, profile.providerAccountId),
      ),
    )
    .limit(1);

  if (existingLink && existingLink.user.email && existingLink.user.emailVerifiedAt) {
    const [updated] = await db
      .update(users)
      .set({
        displayName: profile.displayName || existingLink.user.displayName,
        avatarUrl: profile.avatarUrl ?? existingLink.user.avatarUrl,
        updatedAt: sql`now()`,
      })
      .where(eq(users.id, existingLink.user.id))
      .returning();

    return {
      status: 'authenticated',
      user: toCustomerSessionUser(updated, 'facebook'),
    };
  }

  return { status: 'requires_email_otp' };
}

export async function requestFacebookEmailOtp(
  pending: FacebookPendingPayload,
  rawInput: unknown,
  ipHash: string,
  db: DbClient = getDb(),
  emailSender: EmailSender = sendEmail,
  now: Date = new Date(),
): Promise<OtpRequestResponse> {
  const parsed = facebookEmailRequestOtpSchema.parse(rawInput);
  return sendIssuedOtpOrRollback({
    db,
    purpose: 'facebook_verify',
    email: parsed.email,
    displayName: pending.displayName,
    payloadJson: JSON.stringify({ providerAccountId: pending.providerAccountId }),
    ipHash,
    emailSender,
    now,
  });
}

export async function verifyFacebookEmailOtp(
  pending: FacebookPendingPayload,
  rawInput: unknown,
  ipHash: string,
  db: DbClient = getDb(),
  now: Date = new Date(),
): Promise<SessionUser> {
  const parsed = facebookEmailVerifyOtpSchema.parse(rawInput);

  const otp = await verifyEmailOtpPreTx({
    db,
    purpose: 'facebook_verify',
    email: parsed.email,
    code: parsed.code,
    ipHash,
    now,
    assertPayload: (rawPayload) => {
      if (!rawPayload) return false;
      try {
        const parsedPayload = JSON.parse(rawPayload) as { providerAccountId?: unknown };
        return parsedPayload.providerAccountId === pending.providerAccountId;
      } catch {
        return false;
      }
    },
  });

  const targetUser = await db.transaction(async (tx) => {
    await consumeEmailOtpInTx(tx, otp.id, now);

    const [legacyLink] = await tx
      .select({ user: users })
      .from(oauthAccounts)
      .innerJoin(users, eq(users.id, oauthAccounts.userId))
      .where(
        and(
          eq(oauthAccounts.provider, 'facebook'),
          eq(oauthAccounts.providerAccountId, pending.providerAccountId),
        ),
      )
      .limit(1);

    const [emailOwner] = await tx
      .select()
      .from(users)
      .where(eq(users.email, parsed.email))
      .limit(1);

    if (emailOwner) {
      if (legacyLink && legacyLink.user.id !== emailOwner.id) {
        await tx
          .update(orders)
          .set({ userId: emailOwner.id })
          .where(eq(orders.userId, legacyLink.user.id));

        await tx
          .update(oauthAccounts)
          .set({ userId: emailOwner.id, providerEmail: parsed.email })
          .where(
            and(
              eq(oauthAccounts.provider, 'facebook'),
              eq(oauthAccounts.providerAccountId, pending.providerAccountId),
            ),
          );

        await tx.delete(users).where(eq(users.id, legacyLink.user.id));
      } else {
        await tx
          .insert(oauthAccounts)
          .values({
            provider: 'facebook',
            providerAccountId: pending.providerAccountId,
            userId: emailOwner.id,
            providerEmail: parsed.email,
          })
          .onConflictDoUpdate({
            target: [oauthAccounts.provider, oauthAccounts.providerAccountId],
            set: { userId: emailOwner.id, providerEmail: parsed.email },
          });
      }

      const [updatedOwner] = await tx
        .update(users)
        .set({
          avatarUrl: emailOwner.avatarUrl ?? pending.avatarUrl,
          emailVerifiedAt: emailOwner.emailVerifiedAt ?? now,
          updatedAt: now,
        })
        .where(eq(users.id, emailOwner.id))
        .returning();

      return updatedOwner;
    }

    if (legacyLink) {
      const [updatedLegacy] = await tx
        .update(users)
        .set({
          displayName: pending.displayName || legacyLink.user.displayName,
          avatarUrl: pending.avatarUrl ?? legacyLink.user.avatarUrl,
          email: parsed.email,
          emailVerifiedAt: now,
          updatedAt: now,
        })
        .where(eq(users.id, legacyLink.user.id))
        .returning();

      await tx
        .update(oauthAccounts)
        .set({ providerEmail: parsed.email })
        .where(
          and(
            eq(oauthAccounts.provider, 'facebook'),
            eq(oauthAccounts.providerAccountId, pending.providerAccountId),
          ),
        );

      return updatedLegacy;
    }

    const [created] = await tx
      .insert(users)
      .values({
        displayName: pending.displayName,
        email: parsed.email,
        emailVerifiedAt: now,
        avatarUrl: pending.avatarUrl,
      })
      .returning();

    await tx.insert(oauthAccounts).values({
      provider: 'facebook',
      providerAccountId: pending.providerAccountId,
      userId: created.id,
      providerEmail: parsed.email,
    });

    return created;
  });

  return toCustomerSessionUser(targetUser, 'facebook');
}

export async function requestPasswordResetOtp(
  rawInput: unknown,
  ipHash: string,
  db: DbClient = getDb(),
  emailSender: EmailSender = sendEmail,
  now: Date = new Date(),
): Promise<OtpRequestResponse> {
  const parsed = forgotPasswordRequestOtpSchema.parse(rawInput);

  await checkRateLimit(db, 'otp_request', ipHash, now);

  const [userRow] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, parsed.email))
    .limit(1);

  if (!userRow) {
    // Generic response prevents probing whether an email address exists while still rate-limiting.
    await recordAuthFailure(db, 'otp_request', ipHash, now);
    return {
      email: parsed.email,
      expiresInSeconds: OTP_TTL_MINUTES * 60,
      resendCooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    };
  }

  if (!userRow.passwordHash) {
    throw new AppError('OAUTH_ONLY_ACCOUNT');
  }

  return sendIssuedOtpOrRollback({
    db,
    purpose: 'password_reset',
    email: parsed.email,
    displayName: userRow.displayName,
    payloadJson: null,
    ipHash,
    emailSender,
    now,
    skipRateLimitCheck: true,
  });
}

export async function resetPasswordWithOtp(
  rawInput: unknown,
  ipHash: string,
  db: DbClient = getDb(),
  now: Date = new Date(),
): Promise<void> {
  const parsed = forgotPasswordResetSchema.parse(rawInput);

  const otp = await verifyEmailOtpPreTx({
    db,
    purpose: 'password_reset',
    email: parsed.email,
    code: parsed.code,
    ipHash,
    now,
  });

  const nextPasswordHash = await hashPassword(parsed.newPassword);

  await db.transaction(async (tx) => {
    await consumeEmailOtpInTx(tx, otp.id, now);

    const [userRow] = await tx
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, parsed.email))
      .limit(1);

    if (!userRow) {
      throw new AppError('OTP_EXPIRED');
    }
    if (!userRow.passwordHash) {
      throw new AppError('OAUTH_ONLY_ACCOUNT');
    }

    await tx
      .update(users)
      .set({
        passwordHash: nextPasswordHash,
        emailVerifiedAt: sql`coalesce(${users.emailVerifiedAt}, now())`,
        updatedAt: now,
      })
      .where(eq(users.id, userRow.id));
  });
}

export async function changeCustomerPassword(
  userId: string,
  rawInput: unknown,
  ipHash: string,
  db: DbClient = getDb(),
  now: Date = new Date(),
): Promise<void> {
  await checkRateLimit(db, 'password_change', ipHash, now);

  const parsed = changePasswordSchema.parse(rawInput);

  const [userRow] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userRow) {
    throw new AppError('UNAUTHORIZED');
  }
  if (!userRow.passwordHash) {
    throw new AppError('OAUTH_ONLY_ACCOUNT');
  }

  const valid = await verifyPassword(parsed.currentPassword, userRow.passwordHash);
  if (!valid) {
    await recordAuthFailure(db, 'password_change', ipHash, now);
    throw new AppError('INVALID_CURRENT_PASSWORD');
  }

  const nextHash = await hashPassword(parsed.newPassword);
  await db
    .update(users)
    .set({
      passwordHash: nextHash,
      updatedAt: now,
    })
    .where(eq(users.id, userRow.id));
}
