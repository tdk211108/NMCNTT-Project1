import { productIdSchema } from '@/shared/schemas';
import { AppError } from '@/server/http/errors';
import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { getProductDetail } from '@/server/services/catalog.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withHandler<{ params: Promise<{ id: string }> }>(
  {},
  async (_request, context) => {
    const { id } = await context.params;
    const parsed = productIdSchema.safeParse(id);
    if (!parsed.success) {
      throw new AppError('NOT_FOUND');
    }
    const detail = await getProductDetail(parsed.data);
    return jsonWithHeaders(detail);
  },
);
