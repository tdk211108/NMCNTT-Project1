import { NextResponse } from 'next/server';
import { clearAdminSessionCookie } from '@/server/auth/admin-session';
import { withHandler } from '@/server/http/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withHandler({ requireSameOrigin: true }, async () => {
  const response = new NextResponse(null, {
    status: 204,
    headers: { 'Cache-Control': 'no-store' },
  });
  clearAdminSessionCookie(response);
  return response;
});
