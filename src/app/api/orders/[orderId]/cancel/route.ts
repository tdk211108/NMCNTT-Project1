import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { requireOrderViewer } from '@/server/http/route-helpers';
import { cancelOrder } from '@/server/services/order.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withHandler<{ params: Promise<{ orderId: string }> }>(
  { requireSameOrigin: true },
  async (request, context) => {
    const { orderId } = await context.params;
    await requireOrderViewer(request, orderId);
    const board = await cancelOrder(orderId);
    return jsonWithHeaders(board);
  },
);
