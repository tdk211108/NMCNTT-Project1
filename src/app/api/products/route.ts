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

function parseVendorPagesParam(value: string | null): Record<string, number> | undefined {
  if (!value || !value.trim()) {
    return undefined;
  }
  const out: Record<string, number> = {};
  for (const part of value.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx <= 0) {
      out[trimmed] = Number.NaN;
      continue;
    }
    const vendor = trimmed.slice(0, colonIdx).trim();
    const rawPage = trimmed.slice(colonIdx + 1).trim();
    out[vendor] = /^\d+$/.test(rawPage) ? Number(rawPage) : Number.NaN;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export const GET = withHandler({}, async (request) => {
  const sp = request.nextUrl.searchParams;
  const rawQ = sp.get('q')?.trim();
  const rawSeriesId = sp.get('seriesId')?.trim();
  const rawLimited = sp.get('limitedEdition');
  const limitedEdition =
    rawLimited === null
      ? undefined
      : rawLimited === 'true'
        ? true
        : rawLimited === 'false'
          ? false
          : rawLimited;
  const rawPerVendor = sp.get('perVendor');
  const perVendor =
    rawPerVendor === null
      ? undefined
      : rawPerVendor === 'true'
        ? true
        : rawPerVendor === 'false'
          ? false
          : rawPerVendor;

  const query = productListQuerySchema.parse({
    category: sp.get('category') ?? undefined,
    vendor: parseCommaListParam(sp.get('vendor')),
    priceMin: parseStrictIntParam(sp.get('priceMin')),
    priceMax: parseStrictIntParam(sp.get('priceMax')),
    vramGb: parseStrictIntListParam(sp.get('vramGb')),
    aibBrand: parseCommaListParam(sp.get('aibBrand')),
    socket: parseCommaListParam(sp.get('socket')),
    seriesId: rawSeriesId && rawSeriesId.length > 0 ? rawSeriesId : undefined,
    limitedEdition,
    sort: sp.get('sort') ?? undefined,
    q: rawQ && rawQ.length > 0 ? rawQ : undefined,
    page: parseStrictIntParam(sp.get('page')),
    pageSize: parseStrictIntParam(sp.get('pageSize')),
    perVendor,
    vendorPages: parseVendorPagesParam(sp.get('vendorPage')),
  });

  const data = await listProducts(query);
  return jsonWithHeaders(data);
});
