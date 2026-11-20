import { prisma } from '@/lib/prisma';
import { ApiError, clientIp, handler, ok, readJson } from '@/lib/api';
import { cartQuote, resolveCart } from '@/lib/cart';
import { rateLimit } from '@/lib/rate-limit';
import { couponSchema } from '@/lib/validators';

// POST /api/cart/coupon { code } — applies a coupon (rejects invalid codes)
export const POST = handler(async (req: Request) => {
  rateLimit(`coupon:${clientIp(req)}`, 20, 10 * 60_000);
  const { code } = couponSchema.parse(await readJson(req));
  const cart = (await resolveCart(true))!;
  const quote = await cartQuote({ ...cart, couponCode: code });
  if (!quote.coupon?.valid) throw new ApiError(400, quote.coupon?.error || 'This coupon code is not valid.');
  await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: code } });
  return ok(quote);
});

export const DELETE = handler(async () => {
  const cart = await resolveCart(false);
  if (cart) await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
  return ok(await cartQuote(cart ? { ...cart, couponCode: null } : null));
});
