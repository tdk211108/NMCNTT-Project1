import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { getAdminOrderDetail } from '@/server/services/admin-order.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler<{ params: Promise<{ orderId: string }> }>(
  { requireAdmin: true },
  async (_request, context) => {
    const { orderId } = await context.params;
    const order = await getAdminOrderDetail(orderId);
    return jsonWithHeaders(order);
  },
);
