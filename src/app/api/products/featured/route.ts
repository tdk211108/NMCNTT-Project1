import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { getFeaturedProducts } from '@/server/services/catalog.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({}, async () => {
  const data = await getFeaturedProducts();
  return jsonWithHeaders(data);
});
