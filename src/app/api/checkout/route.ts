import { prisma } from '@/lib/prisma';
import { ApiError, clientIp, handler, ok, readJson } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { checkoutSchema } from '@/lib/validators';
import { getSessionUser } from '@/lib/session';
import { getVisitorCountry } from '@/lib/currency';
import { resolveCart } from '@/lib/cart';
import { confirmOrder, createOrder } from '@/lib/orders';
import { getPaymentProvider } from '@/lib/payments';
import type { OnlineMethod } from '@/lib/payments/types';
import { absoluteUrl } from '@/lib/site';

// POST /api/checkout — places an order.
// COD → confirmed immediately. Online methods → redirected to the payment gateway.
export const POST = handler(async (req: Request) => {
  rateLimit(`checkout:${clientIp(req)}`, 15, 10 * 60_000);
  const input = checkoutSchema.parse(await readJson(req));
  const user = await getSessionUser();
  const visitor = await getVisitorCountry();

  const provider = input.paymentMethod === 'COD' ? null : getPaymentProvider();
  if (input.paymentMethod !== 'COD' && !provider?.methods.includes(input.paymentMethod as OnlineMethod)) {
    throw new ApiError(400, 'This payment method is not available. Please choose another one.');
  }

  let cart: Parameters<typeof createOrder>[0]['cart'] = null;
  if (!input.buyNow) {
    const c = await resolveCart(false);
    if (c) {
      const items = await prisma.cartItem.findMany({ where: { cartId: c.id } });
      cart = { id: c.id, couponCode: c.couponCode, lines: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })) };
    }
  }

  const order = await createOrder({ input, currency: visitor.currency, userId: user?.id ?? null, cart });

  // Save the address to the customer's address book when requested
  if (user && input.saveAddress) {
    const hasAny = await prisma.address.count({ where: { userId: user.id } });
    await prisma.address.create({ data: { ...input.address, isDefault: hasAny === 0, userId: user.id } });
  }

  const successUrl = absoluteUrl(`/order/success?order=${order.orderNumber}&token=${order.accessToken}`, input.locale);

  if (input.paymentMethod === 'COD') {
    await confirmOrder(order.orderNumber, { paid: false });
    return ok({ orderNumber: order.orderNumber, token: order.accessToken, redirectUrl: successUrl });
  }

  const payment = await provider!.createPayment(order, { locale: input.locale, method: input.paymentMethod as OnlineMethod });
  await prisma.order.update({ where: { id: order.id }, data: { paymentProvider: provider!.id, paymentReference: payment.reference } });
  return ok({ orderNumber: order.orderNumber, token: order.accessToken, redirectUrl: payment.redirectUrl });
});
