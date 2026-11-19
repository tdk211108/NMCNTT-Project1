import { checkoutRequestSchema } from '@/shared/schemas';
import { jsonWithHeaders, parseJsonBody, withHandler } from '@/server/http/handler';
import { assertCartEnvelope } from '@/server/http/route-helpers';
import { prepareCheckout } from '@/server/services/checkout.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withHandler({ requireAuth: true, requireSameOrigin: true }, async (request) => {
  const body = await parseJsonBody(request);
  assertCartEnvelope(body, { allowEmpty: false });
  const parsed = checkoutRequestSchema.parse(body);
  const prepared = await prepareCheckout(parsed);
  return jsonWithHeaders(prepared);
});
