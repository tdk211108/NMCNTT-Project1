import { NextResponse } from 'next/server';
import { LEGACY_CPU_ID_REGEX } from '@/shared/constants';
import { adminLegacyCpuPatchSchema } from '@/shared/schemas';
import { AppError } from '@/server/http/errors';
import { jsonWithHeaders, parseJsonBody, withHandler } from '@/server/http/handler';
import {
  softDeleteAdminLegacyCpu,
  updateAdminLegacyCpu,
} from '@/server/services/admin-catalog.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PATCH = withHandler<{ params: Promise<{ id: string }> }>(
  { requireAdmin: true, requireSameOrigin: true },
  async (request, context) => {
    const { id } = await context.params;
    if (!LEGACY_CPU_ID_REGEX.test(id)) {
      throw new AppError('NOT_FOUND');
    }
    const body = await parseJsonBody(request);
    const patch = adminLegacyCpuPatchSchema.parse(body);
    const updated = await updateAdminLegacyCpu(id, patch);
    return jsonWithHeaders(updated);
  },
);

export const DELETE = withHandler<{ params: Promise<{ id: string }> }>(
  { requireAdmin: true, requireSameOrigin: true },
  async (_request, context) => {
    const { id } = await context.params;
    if (!LEGACY_CPU_ID_REGEX.test(id)) {
      throw new AppError('NOT_FOUND');
    }
    await softDeleteAdminLegacyCpu(id);
    return new NextResponse(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store' },
    });
  },
);
