import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { resetSampleData } from '@/server/services/reset.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withHandler(
  { requireAdmin: true, requireSameOrigin: true },
  async () => {
    const result = await resetSampleData();
    return jsonWithHeaders(result);
  },
);
