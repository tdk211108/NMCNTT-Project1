import 'server-only';

import { and, asc, eq, gt, lt } from 'drizzle-orm';
import {
  RATE_LIMIT_MAX_FAILURES,
  RATE_LIMIT_RETENTION_HOURS,
  RATE_LIMIT_WINDOW_MINUTES,
} from '@/shared/constants';
import type { DbExecutor } from '../db/client';
import { authFailures } from '../db/schema';
import { AppError } from '../http/errors';

export type AuthFailureScope =
  | 'order_lookup'
  | 'admin_login'
  | 'user_login'
  | 'user_register'
  | 'otp_request'
  | 'otp_verify'
  | 'password_change';

/**
 * Sliding 15-minute rate-limit pre-check. Rejects before credential/order checks
 * when at least `RATE_LIMIT_MAX_FAILURES` recent failures exist for `(scope, ipHash)`.
 */
export async function checkRateLimit(
  db: DbExecutor,
  scope: AuthFailureScope,
  ipHash: string,
  now: Date = new Date(),
): Promise<void> {
  const windowMs = RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;
  const windowStart = new Date(now.getTime() - windowMs);

  const recent = await db
    .select({ occurredAt: authFailures.occurredAt })
    .from(authFailures)
    .where(
      and(
        eq(authFailures.scope, scope),
        eq(authFailures.ipHash, ipHash),
        gt(authFailures.occurredAt, windowStart),
      ),
    )
    .orderBy(asc(authFailures.occurredAt))
    .limit(RATE_LIMIT_MAX_FAILURES);

  if (recent.length < RATE_LIMIT_MAX_FAILURES) {
    return;
  }

  const oldestMs = recent[0].occurredAt.getTime();
  const retryAfterSeconds = Math.max(1, Math.ceil((oldestMs + windowMs - now.getTime()) / 1000));
  const waitMinutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));

  throw new AppError('RATE_LIMITED', {
    message: `Bạn đã thử quá nhiều lần. Vui lòng thử lại sau ${waitMinutes} phút.`,
    details: { retryAfterSeconds },
    headers: { 'Retry-After': String(retryAfterSeconds) },
  });
}

/**
 * Records a failed attempt and opportunistically purges rows older than 24 hours.
 */
export async function recordAuthFailure(
  db: DbExecutor,
  scope: AuthFailureScope,
  ipHash: string,
  now: Date = new Date(),
): Promise<void> {
  const retentionCutoff = new Date(now.getTime() - RATE_LIMIT_RETENTION_HOURS * 60 * 60 * 1000);

  await db.insert(authFailures).values({
    scope,
    ipHash,
    occurredAt: now,
  });

  await db.delete(authFailures).where(lt(authFailures.occurredAt, retentionCutoff));
}
