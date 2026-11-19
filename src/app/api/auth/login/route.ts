import { setSessionCookie, signSessionToken } from '@/server/auth/session';
import { jsonWithHeaders, parseJsonBody, withHandler } from '@/server/http/handler';
import { getClientIpHash } from '@/server/security/client-ip';
import { loginWithCredentials } from '@/server/services/auth.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withHandler({ requireSameOrigin: true }, async (request) => {
  const body = await parseJsonBody(request);
  const ipHash = getClientIpHash(request);
  const user = await loginWithCredentials(body, ipHash);
  const token = await signSessionToken(user);

  const response = jsonWithHeaders({ user }, { status: 200 });
  setSessionCookie(response, token, user.role);
  return response;
});
