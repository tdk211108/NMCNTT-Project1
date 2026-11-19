import { getConfiguredOAuthProviders } from '@/server/auth/oauth';
import { getSessionUser } from '@/server/auth/session';
import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import type { AuthSessionResponse } from '@/shared/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({}, async (request) => {
  const user = await getSessionUser(request);
  const providers = getConfiguredOAuthProviders();
  const body: AuthSessionResponse = { user, providers };
  return jsonWithHeaders(body);
});
