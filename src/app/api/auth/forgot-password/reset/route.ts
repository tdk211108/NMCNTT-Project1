import { jsonWithHeaders, parseJsonBody, withHandler } from '@/server/http/handler';
import { getClientIpHash } from '@/server/security/client-ip';
import { resetPasswordWithOtp } from '@/server/services/auth.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withHandler({ requireSameOrigin: true }, async (request) => {
  const body = await parseJsonBody(request);
  const ipHash = getClientIpHash(request);
  await resetPasswordWithOtp(body, ipHash);
  return jsonWithHeaders({ ok: true }, { status: 200 });
});
