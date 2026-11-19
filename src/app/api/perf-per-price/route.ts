import { perfPerPriceQuerySchema } from '@/shared/schemas';
import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { parseCommaListParam, parseStrictIntParam } from '@/server/http/route-helpers';
import { getPerfPerPriceRanking } from '@/server/services/perf-per-price.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({}, async (request) => {
  const sp = request.nextUrl.searchParams;
  const query = perfPerPriceQuerySchema.parse({
    category: sp.get('category') ?? undefined,
    vendor: parseCommaListParam(sp.get('vendor')),
    maxPriceVnd: parseStrictIntParam(sp.get('maxPriceVnd')),
  });
  const result = await getPerfPerPriceRanking(query);
  return jsonWithHeaders(result);
});
