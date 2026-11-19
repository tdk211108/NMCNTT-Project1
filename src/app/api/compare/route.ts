import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { compareProducts } from '@/server/services/compare.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({}, async (request) => {
  const ids = request.nextUrl.searchParams.get('ids');
  const result = await compareProducts(ids);
  return jsonWithHeaders(result);
});
