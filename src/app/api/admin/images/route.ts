import { AppError } from '@/server/http/errors';
import { jsonWithHeaders, withHandler } from '@/server/http/handler';
import { uploadProductImage } from '@/server/services/image.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withHandler(
  { requireAdmin: true, requireSameOrigin: true },
  async (request) => {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw new AppError('IMAGE_INVALID');
    }

    const file = formData.get('file');
    if (
      !file ||
      typeof file !== 'object' ||
      typeof (file as File).arrayBuffer !== 'function' ||
      typeof (file as File).size !== 'number'
    ) {
      throw new AppError('IMAGE_INVALID');
    }

    const uploaded = await uploadProductImage(file as File);
    return jsonWithHeaders(uploaded, { status: 201 });
  },
);
