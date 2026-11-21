import type { NextRequest } from 'next/server';
import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { getFeaturedProducts, getLandingShowcaseProducts } from '@/server/services/catalog.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({}, async (request: NextRequest) => {
  const preset = request.nextUrl.searchParams.get('preset');
  const data =
    preset === 'landing' ? await getLandingShowcaseProducts() : await getFeaturedProducts();
  return jsonWithHeaders(data);
});
