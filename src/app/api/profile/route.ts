import { AppError } from '@/server/http/errors';
import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { getUserProfile } from '@/server/services/profile.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({ requireAuth: true }, async (_request, _context, session) => {
  if (!session || session.role !== 'customer') {
    throw new AppError('UNAUTHORIZED');
  }
  const profile = await getUserProfile(session.id);
  return jsonWithHeaders(profile);
});
