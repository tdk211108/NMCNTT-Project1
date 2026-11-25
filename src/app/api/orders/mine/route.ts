import { AppError } from '@/server/http/errors';
import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { listOrdersForUser } from '@/server/services/order.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({ requireAuth: true }, async (_request, _context, session) => {
  if (!session) {
    throw new AppError('UNAUTHORIZED');
  }
  if (session.role !== 'customer') {
    return jsonWithHeaders([]);
  }
  const orders = await listOrdersForUser(session.id);
  return jsonWithHeaders(orders);
});
