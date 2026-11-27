import { requireFacebookPendingCookie } from '@/server/auth/oauth';
import { jsonWithHeaders, parseJsonBody, withHandler } from '@/server/http/handler';
import { getClientIpHash } from '@/server/security/client-ip';
import { requestFacebookEmailOtp } from '@/server/services/auth.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withHandler({ requireSameOrigin: true }, async (request) => {
  const pending = await requireFacebookPendingCookie(request);
  const body = await parseJsonBody(request);
  const ipHash = getClientIpHash(request);
  const result = await requestFacebookEmailOtp(pending, body, ipHash);
  return jsonWithHeaders(result, { status: 200 });
});
