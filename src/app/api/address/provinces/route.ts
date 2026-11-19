import { listProvinces } from '@/server/address/address.repo';
import { jsonWithHeaders, withHandler } from '@/server/http/handler';

export const runtime = 'nodejs';

const ADDRESS_CACHE_CONTROL = 'public, max-age=31536000, immutable';

export const GET = withHandler({ cacheControl: ADDRESS_CACHE_CONTROL }, async () => {
  return jsonWithHeaders(listProvinces(), { cacheControl: ADDRESS_CACHE_CONTROL });
});
