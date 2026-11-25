import { NextResponse } from 'next/server';
import {
  adminCpuPatchSchema,
  adminGpuVariantPatchSchema,
  productIdSchema,
} from '@/shared/schemas';
import { AppError } from '@/server/http/errors';
import { jsonWithHeaders, parseJsonBody, withHandler } from '@/server/http/handler';
import {
  getAdminProductCategory,
  softDeleteAdminProduct,
  updateAdminProduct,
} from '@/server/services/admin-products.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PATCH = withHandler<{ params: Promise<{ id: string }> }>(
  { requireAdmin: true, requireSameOrigin: true },
  async (request, context) => {
    const { id } = await context.params;
    const validId = productIdSchema.safeParse(id);
    if (!validId.success) {
      throw new AppError('NOT_FOUND');
    }

    const category = await getAdminProductCategory(validId.data);
    const body = await parseJsonBody(request);
    const patch =
      category === 'cpu'
        ? adminCpuPatchSchema.parse(body)
        : adminGpuVariantPatchSchema.parse(body);

    const updated = await updateAdminProduct(validId.data, patch);
    return jsonWithHeaders(updated);
  },
);

export const DELETE = withHandler<{ params: Promise<{ id: string }> }>(
  { requireAdmin: true, requireSameOrigin: true },
  async (_request, context) => {
    const { id } = await context.params;
    const validId = productIdSchema.safeParse(id);
    if (!validId.success) {
      throw new AppError('NOT_FOUND');
    }
    await softDeleteAdminProduct(validId.data);
    return new NextResponse(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store' },
    });
  },
);
