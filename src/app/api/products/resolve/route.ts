import { resolveProductsSchema } from '@/shared/schemas';
import { jsonWithHeaders, parseJsonBody, withHandler } from '@/server/http/handler';
import { resolveProducts } from '@/server/services/catalog.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withHandler({}, async (request) => {
  const body = await parseJsonBody(request);
  const { ids } = resolveProductsSchema.parse(body);
  const data = await resolveProducts(ids);
  return jsonWithHeaders(data);
});
