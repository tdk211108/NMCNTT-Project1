import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { listAdminOrders } from '@/server/services/admin-order.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({ requireAdmin: true }, async () => {
  const orders = await listAdminOrders();
  return jsonWithHeaders(orders);
});
