import 'server-only';

import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { and, desc, eq, isNull, lt, sql } from 'drizzle-orm';
import {
  OTP_CODE_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_MINUTES,
  RATE_LIMIT_RETENTION_HOURS,
} from '@/shared/constants';
import type { OtpPurpose } from '@/shared/types';
import type { DbClient, DbExecutor } from '../db/client';
import { emailOtps } from '../db/schema';
import { AppError } from '../http/errors';
import { checkRateLimit, recordAuthFailure } from '../security/rate-limit';
import { getAuthSecretString } from './session';

const OTP_MAX_VALUE = 10 ** OTP_CODE_LENGTH;

export function generateOtpCode(): string {
  return randomInt(0, OTP_MAX_VALUE).toString().padStart(OTP_CODE_LENGTH, '0');
}

export function hashOtpCode(purpose: OtpPurpose, email: string, code: string): string {
  return createHmac('sha256', getAuthSecretString())
    .update(`${purpose}:${email.trim().toLowerCase()}:${code.trim()}`)
    .digest('hex');
}

export function verifyOtpCodeHash(
  purpose: OtpPurpose,
  email: string,
  code: string,
  expectedHex: string,
): boolean {
  const actualBuf = Buffer.from(hashOtpCode(purpose, email, code), 'hex');
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (actualBuf.length === 0 || actualBuf.length !== expectedBuf.length) {
    return false;
  }
  return timingSafeEqual(actualBuf, expectedBuf);
}

export interface IssuedOtpResult {
  id: string;
  code: string;
  expiresInSeconds: number;
  resendCooldownSeconds: number;
}

export async function issueEmailOtp(params: {
  db: DbClient;
  purpose: OtpPurpose;
  email: string;
  payloadJson: string | null;
  ipHash: string;
  now?: Date;
  skipRateLimitCheck?: boolean;
}): Promise<IssuedOtpResult> {
  const now = params.now ?? new Date();
  const normalizedEmail = params.email.trim().toLowerCase();

  if (!params.skipRateLimitCheck) {
    await checkRateLimit(params.db, 'otp_request', params.ipHash, now);
  }

  const [latest] = await params.db
    .select({ createdAt: emailOtps.createdAt })
    .from(emailOtps)
    .where(and(eq(emailOtps.purpose, params.purpose), eq(emailOtps.email, normalizedEmail)))
    .orderBy(desc(emailOtps.createdAt))
    .limit(1);

  if (latest) {
    const cooldownMs = OTP_RESEND_COOLDOWN_SECONDS * 1000;
    const elapsedMs = now.getTime() - latest.createdAt.getTime();
    if (elapsedMs < cooldownMs) {
      const retryAfterSeconds = Math.max(1, Math.ceil((cooldownMs - elapsedMs) / 1000));
      throw new AppError('OTP_COOLDOWN', {
        message: `Vui lòng đợi ${retryAfterSeconds} giây trước khi gửi lại mã OTP.`,
        details: { retryAfterSeconds },
        headers: { 'Retry-After': String(retryAfterSeconds) },
      });
    }
  }

  await recordAuthFailure(params.db, 'otp_request', params.ipHash, now);

  await params.db
    .update(emailOtps)
    .set({ consumedAt: now })
    .where(
      and(
        eq(emailOtps.purpose, params.purpose),
        eq(emailOtps.email, normalizedEmail),
        isNull(emailOtps.consumedAt),
      ),
    );

  const code = generateOtpCode();
  const codeHash = hashOtpCode(params.purpose, normalizedEmail, code);
  const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000);

  const [created] = await params.db
    .insert(emailOtps)
    .values({
      purpose: params.purpose,
      email: normalizedEmail,
      codeHash,
      payloadJson: params.payloadJson,
      attempts: 0,
      expiresAt,
      createdAt: now,
    })
    .returning({ id: emailOtps.id });

  const retentionCutoff = new Date(now.getTime() - RATE_LIMIT_RETENTION_HOURS * 60 * 60 * 1000);
  await params.db.delete(emailOtps).where(lt(emailOtps.createdAt, retentionCutoff));

  return {
    id: created.id,
    code,
    expiresInSeconds: OTP_TTL_MINUTES * 60,
    resendCooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  };
}

export async function discardEmailOtp(db: DbExecutor, otpId: string): Promise<void> {
  await db.delete(emailOtps).where(eq(emailOtps.id, otpId));
}

export interface VerifiedOtpRecord {
  id: string;
  payloadJson: string | null;
}

/**
 * Validates the latest active OTP OUTSIDE the final commit transaction
 * so failed attempt counters and rate-limit records always persist on error.
 */
export async function verifyEmailOtpPreTx(params: {
  db: DbClient;
  purpose: OtpPurpose;
  email: string;
  code: string;
  ipHash: string;
  now?: Date;
  assertPayload?: (payloadJson: string | null) => boolean;
}): Promise<VerifiedOtpRecord> {
  const now = params.now ?? new Date();
  const normalizedEmail = params.email.trim().toLowerCase();

  await checkRateLimit(params.db, 'otp_verify', params.ipHash, now);

  const [row] = await params.db
    .select()
    .from(emailOtps)
    .where(
      and(
        eq(emailOtps.purpose, params.purpose),
        eq(emailOtps.email, normalizedEmail),
        isNull(emailOtps.consumedAt),
      ),
    )
    .orderBy(desc(emailOtps.createdAt))
    .limit(1);

  if (!row || row.expiresAt.getTime() <= now.getTime()) {
    await recordAuthFailure(params.db, 'otp_verify', params.ipHash, now);
    throw new AppError('OTP_EXPIRED');
  }

  if (row.attempts >= OTP_MAX_ATTEMPTS) {
    await params.db
      .update(emailOtps)
      .set({ consumedAt: now })
      .where(eq(emailOtps.id, row.id));
    await recordAuthFailure(params.db, 'otp_verify', params.ipHash, now);
    throw new AppError('OTP_MAX_ATTEMPTS');
  }

  const payloadOk = params.assertPayload ? params.assertPayload(row.payloadJson) : true;
  const codeOk = verifyOtpCodeHash(params.purpose, normalizedEmail, params.code, row.codeHash);

  if (!payloadOk || !codeOk) {
    const nowIso = now.toISOString();
    const [updated] = await params.db
      .update(emailOtps)
      .set({
        attempts: sql`${emailOtps.attempts} + 1`,
        consumedAt: sql`CASE WHEN ${emailOtps.attempts} + 1 >= ${OTP_MAX_ATTEMPTS} THEN ${nowIso}::timestamptz ELSE ${emailOtps.consumedAt} END`,
      })
      .where(and(eq(emailOtps.id, row.id), isNull(emailOtps.consumedAt)))
      .returning({ attempts: emailOtps.attempts });
    await recordAuthFailure(params.db, 'otp_verify', params.ipHash, now);
    const nextAttempts = updated?.attempts ?? OTP_MAX_ATTEMPTS;
    throw new AppError(nextAttempts >= OTP_MAX_ATTEMPTS ? 'OTP_MAX_ATTEMPTS' : 'OTP_INVALID');
  }

  return {
    id: row.id,
    payloadJson: row.payloadJson,
  };
}

export async function consumeEmailOtpInTx(
  tx: DbExecutor,
  otpId: string,
  now: Date = new Date(),
): Promise<void> {
  const consumed = await tx
    .update(emailOtps)
    .set({ consumedAt: now })
    .where(and(eq(emailOtps.id, otpId), isNull(emailOtps.consumedAt)))
    .returning({ id: emailOtps.id });

  if (consumed.length === 0) {
    throw new AppError('OTP_EXPIRED');
  }
}
