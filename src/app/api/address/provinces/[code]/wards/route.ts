import { listWardsByProvince } from '@/server/address/address.repo';
import { AppError } from '@/server/http/errors';
import { jsonWithHeaders, withHandler } from '@/server/http/handler';

export const runtime = 'nodejs';

const ADDRESS_CACHE_CONTROL = 'public, max-age=31536000, immutable';

export const GET = withHandler<{ params: Promise<{ code: string }> }>(
  { cacheControl: ADDRESS_CACHE_CONTROL },
  async (_request, context) => {
    const { code } = await context.params;
    const wards = listWardsByProvince(code);
    if (!wards) {
      throw new AppError('NOT_FOUND');
    }
    return jsonWithHeaders(wards, { cacheControl: ADDRESS_CACHE_CONTROL });
  },
);
