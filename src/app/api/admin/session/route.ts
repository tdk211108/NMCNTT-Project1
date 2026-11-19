import { isAdminRequest } from '@/server/auth/admin-session';
import { jsonWithHeaders, withHandler } from '@/server/http/handler';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({}, async (request) => {
  const isAdmin = await isAdminRequest(request);
  return jsonWithHeaders({ isAdmin });
});
