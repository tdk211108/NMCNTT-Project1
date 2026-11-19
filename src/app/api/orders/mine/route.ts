import { requireSession } from '@/server/auth/session';
import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { listOrdersForUser } from '@/server/services/order.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({ requireAuth: true }, async (request) => {
  const user = await requireSession(request);
  if (user.role !== 'customer') {
    return jsonWithHeaders([]);
  }
  const orders = await listOrdersForUser(user.id);
  return jsonWithHeaders(orders);
});
