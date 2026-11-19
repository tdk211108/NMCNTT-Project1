import { adminCreateProductSchema, categorySchema } from '@/shared/schemas';
import { jsonWithHeaders, parseJsonBody, withHandler } from '@/server/http/handler';
import { createAdminProduct, listAdminProducts } from '@/server/services/admin-catalog.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({ requireAdmin: true }, async (request) => {
  const rawCategory = request.nextUrl.searchParams.get('category');
  const category = rawCategory ? categorySchema.parse(rawCategory) : undefined;
  const items = await listAdminProducts(category);
  return jsonWithHeaders(items);
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
