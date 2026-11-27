import { jsonWithHeaders, parseJsonBody, withHandler } from '@/server/http/handler';
import { getClientIpHash } from '@/server/security/client-ip';
import { requestRegistrationOtp } from '@/server/services/auth.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withHandler({ requireSameOrigin: true }, async (request) => {
  const body = await parseJsonBody(request);
  const ipHash = getClientIpHash(request);
  const result = await requestRegistrationOtp(body, ipHash);
  return jsonWithHeaders(result, { status: 200 });
});
