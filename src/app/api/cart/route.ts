import { handler, ok } from '@/lib/api';
import { cartQuote, resolveCart } from '@/lib/cart';

// GET /api/cart — current cart priced in the visitor's currency
export const GET = handler(async () => {
  const cart = await resolveCart(false);
  return ok(await cartQuote(cart));
});
