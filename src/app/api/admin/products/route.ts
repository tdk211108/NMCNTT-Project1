import { z } from 'zod';
import { ADMIN_PRODUCTS_PAGE_SIZE } from '@/shared/constants';
import { adminCreateProductSchema, categorySchema } from '@/shared/schemas';
import { jsonWithHeaders, parseJsonBody, withHandler } from '@/server/http/handler';
import { parseStrictIntParam } from '@/server/http/route-helpers';
import {
  createAdminProduct,
  listAdminProductsPage,
} from '@/server/services/admin-products.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const adminPageSchema = z.number().int().min(1).default(1);
const adminPageSizeSchema = z.number().int().min(1).max(100).default(ADMIN_PRODUCTS_PAGE_SIZE);

export const GET = withHandler({ requireAdmin: true }, async (request) => {
  const sp = request.nextUrl.searchParams;
  const category = categorySchema.parse(sp.get('category') ?? undefined);
  const page = adminPageSchema.parse(parseStrictIntParam(sp.get('page')));
  const pageSize = adminPageSizeSchema.parse(parseStrictIntParam(sp.get('pageSize')));
  const paged = await listAdminProductsPage(category, page, pageSize);
  return jsonWithHeaders(paged);
});

export const POST = withHandler(
  { requireAdmin: true, requireSameOrigin: true },
  async (request) => {
    const body = await parseJsonBody(request);
    const input = adminCreateProductSchema.parse(body);
    const created = await createAdminProduct(input);
    return jsonWithHeaders(created, { status: 201 });
  },
);
