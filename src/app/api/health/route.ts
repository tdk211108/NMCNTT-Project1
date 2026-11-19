import { timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { getSql } from '@/server/db/client';
import { jsonWithHeaders } from '@/server/http/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorizedCronRequest(request: NextRequest): boolean {
  const expected = (process.env.CRON_SECRET ?? '').trim();
  const header = (request.headers.get('authorization') ?? '').trim();
  if (!expected || !header.startsWith('Bearer ')) {
    return false;
  }
  const provided = header.slice('Bearer '.length).trim();
  const expectedBuf = Buffer.from(expected, 'utf8');
  const providedBuf = Buffer.from(provided, 'utf8');
  if (expectedBuf.length !== providedBuf.length) {
    return false;
  }
  return timingSafeEqual(expectedBuf, providedBuf);
}

export async function GET(request: NextRequest) {
  const isCron = isAuthorizedCronRequest(request);

  try {
    const sql = getSql();
    await sql`SELECT 1`;
    return jsonWithHeaders(isCron ? { ok: true, db: 'up' } : { ok: true }, { status: 200 });
  } catch (error) {
    console.error('[health] Database health check failed:', error);
    return jsonWithHeaders(isCron ? { ok: false, db: 'down' } : { ok: false }, { status: 503 });
  }
}
