import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handler, ok, readJson } from '@/lib/api';
import { COUNTRY_CODES } from '@/lib/countries';
import { getVisitorCountry } from '@/lib/currency';
import { resolveCart } from '@/lib/cart';
import { buildQuote } from '@/lib/pricing';
import { enabledPaymentMethods } from '@/lib/payments';

const schema = z.object({
  country: z.enum(COUNTRY_CODES).optional(),
  couponCode: z.string().trim().toUpperCase().max(40).optional().or(z.literal('')),
  buyNow: z.object({ variantId: z.string().min(1).max(50), quantity: z.number().int().min(1).max(20) }).optional(),
});

// POST /api/checkout/quote — live order summary for the checkout page
// (shipping follows the address country; currency follows the selected store country)
export const POST = handler(async (req: Request) => {
  const input = schema.parse(await readJson(req));
  const visitor = await getVisitorCountry();
  let lines: { variantId: string; quantity: number }[] = [];
  let couponCode = input.couponCode || null;
  if (input.buyNow) {
    lines = [input.buyNow];
  } else {
    const cart = await resolveCart(false);
    if (cart) {
      const items = await prisma.cartItem.findMany({ where: { cartId: cart.id }, orderBy: { createdAt: 'asc' } });
      lines = items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
      couponCode ??= cart.couponCode;
    }
  }
  const quote = await buildQuote({ lines, currency: visitor.currency, shippingCountry: input.country ?? visitor.code, couponCode });
  return ok({ ...quote, paymentMethods: enabledPaymentMethods() });
});
