import { NextResponse } from 'next/server';
import { SERIES_ID_REGEX } from '@/shared/constants';
import { adminGpuSeriesPatchSchema } from '@/shared/schemas';
import { AppError } from '@/server/http/errors';
import { jsonWithHeaders, parseJsonBody, withHandler } from '@/server/http/handler';
import {
  softDeleteAdminGpuSeries,
  updateAdminGpuSeries,
} from '@/server/services/admin-catalog.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PATCH = withHandler<{ params: Promise<{ id: string }> }>(
  { requireAdmin: true, requireSameOrigin: true },
  async (request, context) => {
    const { id } = await context.params;
    if (!SERIES_ID_REGEX.test(id)) {
      throw new AppError('NOT_FOUND');
    }
    const body = await parseJsonBody(request);
    const patch = adminGpuSeriesPatchSchema.parse(body);
    const updated = await updateAdminGpuSeries(id, patch);
    return jsonWithHeaders(updated);
  },
);

export const DELETE = withHandler<{ params: Promise<{ id: string }> }>(
  { requireAdmin: true, requireSameOrigin: true },
  async (_request, context) => {
    const { id } = await context.params;
    if (!SERIES_ID_REGEX.test(id)) {
      throw new AppError('NOT_FOUND');
    }
    await softDeleteAdminGpuSeries(id);
    return new NextResponse(null, {
      status: 204,
      headers: { 'Cache-Control': 'no-store' },
    });
  },
);
