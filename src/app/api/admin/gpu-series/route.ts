import { z } from 'zod';
import { adminGpuSeriesInputSchema } from '@/shared/schemas';
import { jsonWithHeaders, parseJsonBody, withHandler } from '@/server/http/handler';
import {
  createAdminGpuSeries,
  listAdminGpuSeries,
} from '@/server/services/admin-catalog.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const kindQuerySchema = z.enum(['retail', 'legacy']);

export const GET = withHandler({ requireAdmin: true }, async (request) => {
  const rawKind = request.nextUrl.searchParams.get('kind');
  const kind = rawKind ? kindQuerySchema.parse(rawKind) : undefined;
  const items = await listAdminGpuSeries(kind);
  return jsonWithHeaders(items);
});

export const POST = withHandler(
  { requireAdmin: true, requireSameOrigin: true },
  async (request) => {
    const body = await parseJsonBody(request);
    const input = adminGpuSeriesInputSchema.parse(body);
    const created = await createAdminGpuSeries(input);
    return jsonWithHeaders(created, { status: 201 });
  },
);
