import { comboQuerySchema } from '@/shared/schemas';
import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { parseStrictIntParam } from '@/server/http/route-helpers';
import { getComboRecommendations } from '@/server/services/combo-advisor.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({}, async (request) => {
  const sp = request.nextUrl.searchParams;
  const rawPurpose = sp.get('purpose')?.trim();
  const rawCpuVendor = sp.get('cpuVendor')?.trim();
  const rawGpuVendor = sp.get('gpuVendor')?.trim();

  const query = comboQuerySchema.parse({
    budgetVnd: parseStrictIntParam(sp.get('budget')),
    purpose: rawPurpose ? rawPurpose : undefined,
    cpuVendor: rawCpuVendor ? rawCpuVendor : undefined,
    gpuVendor: rawGpuVendor ? rawGpuVendor : undefined,
  });

  const result = await getComboRecommendations(query);
  return jsonWithHeaders(result);
});
