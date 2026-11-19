import { adminLegacyCpuInputSchema } from '@/shared/schemas';
import { jsonWithHeaders, parseJsonBody, withHandler } from '@/server/http/handler';
import {
  createAdminLegacyCpu,
  listAdminLegacyCpus,
} from '@/server/services/admin-catalog.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({ requireAdmin: true }, async () => {
  const items = await listAdminLegacyCpus();
  return jsonWithHeaders(items);
});

export const POST = withHandler(
  { requireAdmin: true, requireSameOrigin: true },
  async (request) => {
    const body = await parseJsonBody(request);
    const input = adminLegacyCpuInputSchema.parse(body);
    const created = await createAdminLegacyCpu(input);
    return jsonWithHeaders(created, { status: 201 });
  },
);
