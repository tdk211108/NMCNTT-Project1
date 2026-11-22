import { upgradeQuerySchema } from '@/shared/schemas';
import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { parseCommaListParam, parseStrictIntParam } from '@/server/http/route-helpers';
import { getUpgradeRecommendations } from '@/server/services/upgrade-advisor.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({}, async (request) => {
  const sp = request.nextUrl.searchParams;
  const rawSameSocket = sp.get('sameSocketOnly')?.trim();
  const sameSocketOnly =
    rawSameSocket === undefined || rawSameSocket === ''
      ? undefined
      : rawSameSocket === 'true'
        ? true
        : rawSameSocket === 'false'
          ? false
          : rawSameSocket;
  const rawSort = sp.get('sort')?.trim();

  const query = upgradeQuerySchema.parse({
    category: sp.get('category') ?? undefined,
    current: sp.get('current') ?? '',
    budgetVnd: parseStrictIntParam(sp.get('budget')),
    sameSocketOnly,
    vendor: parseCommaListParam(sp.get('vendor')),
    sort: rawSort ? rawSort : undefined,
  });

  const result = await getUpgradeRecommendations(query);
  return jsonWithHeaders(result);
});
