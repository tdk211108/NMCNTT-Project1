import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { requireOrderViewer } from '@/server/http/route-helpers';
import { getOrderBoardForCustomer } from '@/server/services/order.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler<{ params: Promise<{ orderId: string }> }>(
  {},
  async (request, context) => {
    const { orderId } = await context.params;
    await requireOrderViewer(request, orderId);
    const board = await getOrderBoardForCustomer(orderId);
    return jsonWithHeaders(board);
  },
);
