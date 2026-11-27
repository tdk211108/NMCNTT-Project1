import { AppError } from '@/server/http/errors';
import { jsonWithHeaders, parseJsonBody, withHandler } from '@/server/http/handler';
import { getClientIpHash } from '@/server/security/client-ip';
import { changeCustomerPassword } from '@/server/services/auth.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withHandler(
  { requireAuth: true, requireSameOrigin: true },
  async (request, _context, session) => {
    if (!session || session.role !== 'customer') {
      throw new AppError('UNAUTHORIZED');
    }
    const body = await parseJsonBody(request);
    const ipHash = getClientIpHash(request);
    await changeCustomerPassword(session.id, body, ipHash);
    return jsonWithHeaders({ ok: true }, { status: 200 });
  },
);
