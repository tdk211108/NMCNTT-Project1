import { waitUntil } from '@vercel/functions';
import { orderAdvanceSchema } from '@/shared/schemas';
import { notifyOrderDeliveredIfPossible } from '@/server/email/order-notifications';
import { jsonWithHeaders, parseJsonBody, withHandler } from '@/server/http/handler';
import { requireOrderViewer } from '@/server/http/route-helpers';
import { advanceOrderStage } from '@/server/services/order.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withHandler<{ params: Promise<{ orderId: string }> }>(
  { requireSameOrigin: true },
  async (request, context) => {
    const { orderId } = await context.params;
    await requireOrderViewer(request, orderId);
    const body = await parseJsonBody(request);
    const { expectedStage } = orderAdvanceSchema.parse(body);
    const board = await advanceOrderStage(orderId, expectedStage);
    if (board.stage === 4) {
      waitUntil(notifyOrderDeliveredIfPossible(board));
    }
    return jsonWithHeaders(board);
  },
);
