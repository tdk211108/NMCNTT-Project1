import { psuEstimateQuerySchema } from '@/shared/schemas';
import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { estimatePsu } from '@/server/services/psu.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler({}, async (request) => {
  const sp = request.nextUrl.searchParams;
  const { cpu, gpu } = psuEstimateQuerySchema.parse({
    cpu: sp.get('cpu') ?? '',
    gpu: sp.get('gpu') ?? '',
  });
  const estimate = await estimatePsu(cpu, gpu);
  return jsonWithHeaders(estimate);
});
