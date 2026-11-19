import { cartQuoteRequestSchema } from '@/shared/schemas';
import { jsonWithHeaders, parseJsonBody, withHandler } from '@/server/http/handler';
import { assertCartEnvelope } from '@/server/http/route-helpers';
import { quoteCart } from '@/server/services/cart.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withHandler({}, async (request) => {
  const body = await parseJsonBody(request);
  assertCartEnvelope(body, { allowEmpty: true });
  const { items } = cartQuoteRequestSchema.parse(body);
  const quote = await quoteCart(items);
  return jsonWithHeaders(quote);
});
