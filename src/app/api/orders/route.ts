import { waitUntil } from '@vercel/functions';
import { checkoutRequestSchema } from '@/shared/schemas';
import { notifyOrderPlacedIfPossible } from '@/server/email/order-notifications';
import { AppError } from '@/server/http/errors';
import { jsonWithHeaders, parseJsonBody, withHandler } from '@/server/http/handler';
import { assertCartEnvelope } from '@/server/http/route-helpers';
import { createOrder } from '@/server/services/order.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withHandler(
  { requireAuth: true, requireSameOrigin: true },
  async (request, _context, session) => {
    if (!session) {
      throw new AppError('UNAUTHORIZED');
    }
    const body = await parseJsonBody(request);
    assertCartEnvelope(body, { allowEmpty: false });
    const parsed = checkoutRequestSchema.parse(body);
    const headerKey = request.headers.get('idempotency-key');
    const userId = session.role === 'customer' ? session.id : null;
    const result = await createOrder(parsed, headerKey, undefined, undefined, userId);
    if (!result.replayed && userId) {
      waitUntil(notifyOrderPlacedIfPossible(result.order, userId));
    }
    return jsonWithHeaders(result, { status: result.replayed ? 200 : 201 });
  },
);
