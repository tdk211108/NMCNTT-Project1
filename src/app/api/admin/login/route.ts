import { NextResponse } from 'next/server';
import { adminLoginSchema } from '@/shared/schemas';
import { setAdminSessionCookie, signAdminSessionToken } from '@/server/auth/admin-session';
import { isValidScryptHashFormat, verifyAdminPassword } from '@/server/auth/password';
import { getDb } from '@/server/db/client';
import { AppError } from '@/server/http/errors';
import { parseJsonBody, withHandler } from '@/server/http/handler';
import { getClientIpHash } from '@/server/security/client-ip';
import { checkRateLimit, recordAuthFailure } from '@/server/security/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withHandler({ requireSameOrigin: true }, async (request) => {
  const db = getDb();
  const ipHash = getClientIpHash(request);

  await checkRateLimit(db, 'admin_login', ipHash);

  const storedHash = (process.env.ADMIN_PASSWORD ?? '').trim();
  if (!isValidScryptHashFormat(storedHash)) {
    console.error('[admin/login] ADMIN_PASSWORD is missing or not a valid scrypt hash.');
    throw new AppError('INTERNAL', { status: 500 });
  }

  const body = await parseJsonBody(request);
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    await recordAuthFailure(db, 'admin_login', ipHash);
    throw new AppError('UNAUTHORIZED');
  }

  const valid = await verifyAdminPassword(parsed.data.password, storedHash);
  if (!valid) {
    await recordAuthFailure(db, 'admin_login', ipHash);
    throw new AppError('UNAUTHORIZED');
  }

  const token = await signAdminSessionToken();
  const response = new NextResponse(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  });
  setAdminSessionCookie(response, token);
  return response;
});
