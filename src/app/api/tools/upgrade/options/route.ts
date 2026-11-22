import { categorySchema } from '@/shared/schemas';
import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { getUpgradeOptions } from '@/server/services/upgrade-advisor.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({}, async (request) => {
  const rawCategory = request.nextUrl.searchParams.get('category')?.trim();
  const category = rawCategory ? categorySchema.parse(rawCategory) : undefined;
  const options = await getUpgradeOptions(category);
  return jsonWithHeaders(options);
});
