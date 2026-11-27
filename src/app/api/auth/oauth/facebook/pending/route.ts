import { FB_PENDING_COOKIE } from '@/shared/constants';
import type { FacebookPendingProfile } from '@/shared/types';
import { clearFacebookPendingCookie, verifyFacebookPendingToken } from '@/server/auth/oauth';
import { readCookieFromRequest } from '@/server/auth/session';
import { jsonWithHeaders, withHandler } from '@/server/http/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({}, async (request) => {
  const token = readCookieFromRequest(request, FB_PENDING_COOKIE);
  const payload = token ? await verifyFacebookPendingToken(token) : null;
  const pending: FacebookPendingProfile | null = payload
    ? {
        displayName: payload.displayName,
        avatarUrl: payload.avatarUrl,
      }
    : null;
  return jsonWithHeaders({ pending });
});

export const DELETE = withHandler({ requireSameOrigin: true }, async () => {
  const response = jsonWithHeaders({ ok: true });
  clearFacebookPendingCookie(response);
  return response;
});
