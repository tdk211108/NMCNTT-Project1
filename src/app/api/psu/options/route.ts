import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { getPsuOptions } from '@/server/services/psu.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({}, async () => {
  const options = await getPsuOptions();
  return jsonWithHeaders(options);
});
