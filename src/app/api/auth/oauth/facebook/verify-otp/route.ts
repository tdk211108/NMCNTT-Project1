import { clearFacebookPendingCookie, requireFacebookPendingCookie } from '@/server/auth/oauth';
import { setSessionCookie, signSessionToken } from '@/server/auth/session';
import { jsonWithHeaders, parseJsonBody, withHandler } from '@/server/http/handler';
import { getClientIpHash } from '@/server/security/client-ip';
import { verifyFacebookEmailOtp } from '@/server/services/auth.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withHandler({ requireSameOrigin: true }, async (request) => {
  const pending = await requireFacebookPendingCookie(request);
  const body = await parseJsonBody(request);
  const ipHash = getClientIpHash(request);
  const user = await verifyFacebookEmailOtp(pending, body, ipHash);
  const sessionToken = await signSessionToken(user);

  const response = jsonWithHeaders({ user, next: pending.next }, { status: 200 });
  setSessionCookie(response, sessionToken, user.role);
  clearFacebookPendingCookie(response);
  return response;
});
