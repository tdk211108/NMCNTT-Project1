import { searchSuggestQuerySchema } from '@/shared/schemas';
import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { suggestProducts } from '@/server/services/search.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({}, async (request) => {
  const { q } = searchSuggestQuerySchema.parse({
    q: request.nextUrl.searchParams.get('q') ?? '',
  });
  const suggestions = await suggestProducts(q);
  return jsonWithHeaders(suggestions);
});
