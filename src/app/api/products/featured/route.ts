import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { getLandingShowcaseProducts } from '@/server/services/catalog.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({}, async () => {
  const data = await getLandingShowcaseProducts();
  return jsonWithHeaders(data);
});
