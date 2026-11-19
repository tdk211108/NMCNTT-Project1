import { jsonWithHeaders, parseJsonBody, withHandler } from '@/server/http/handler';
import { getClientIpHash } from '@/server/security/client-ip';
import { lookupOrder } from '@/server/services/order.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withHandler({}, async (request) => {
  const rawBody = await parseJsonBody(request);
  const ipHash = getClientIpHash(request);
  const payload =
    rawBody && typeof rawBody === 'object'
      ? {
          orderId: (rawBody as { orderId?: unknown }).orderId,
          phone: (rawBody as { phone?: unknown }).phone,
        }
      : { orderId: undefined, phone: undefined };

  const result = await lookupOrder(payload, ipHash);
  return jsonWithHeaders(result);
});
