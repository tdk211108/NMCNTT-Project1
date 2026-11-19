import { productListQuerySchema } from '@/shared/schemas';
import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import {
  parseCommaListParam,
  parseStrictIntListParam,
  parseStrictIntParam,
} from '@/server/http/route-helpers';
import { listProducts } from '@/server/services/catalog.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({}, async (request) => {
  const sp = request.nextUrl.searchParams;
  const rawQ = sp.get('q')?.trim();
  const rawLimited = sp.get('limitedEdition');
  const limitedEdition =
    rawLimited === null
      ? undefined
      : rawLimited === 'true'
        ? true
        : rawLimited === 'false'
          ? false
          : rawLimited;

  const query = productListQuerySchema.parse({
    category: sp.get('category') ?? undefined,
    vendor: parseCommaListParam(sp.get('vendor')),
    priceMin: parseStrictIntParam(sp.get('priceMin')),
    priceMax: parseStrictIntParam(sp.get('priceMax')),
    vramGb: parseStrictIntListParam(sp.get('vramGb')),
    aibBrand: parseCommaListParam(sp.get('aibBrand')),
    socket: parseCommaListParam(sp.get('socket')),
    limitedEdition,
    sort: sp.get('sort') ?? undefined,
    q: rawQ && rawQ.length > 0 ? rawQ : undefined,
  });

  const data = await listProducts(query);
  return jsonWithHeaders(data);
});
