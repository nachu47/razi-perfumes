import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ApiError, clientIp, handler, ok, readJson } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { getAccessibleOrder } from '@/lib/order-access';
import { confirmOrder } from '@/lib/orders';
import { getPaymentProvider } from '@/lib/payments';
import type { OnlineMethod } from '@/lib/payments/types';
import { absoluteUrl } from '@/lib/site';

const schema = z.object({
  token: z.string().max(100).optional(),
  paymentMethod: z.enum(['COD', 'KNET', 'CARD', 'APPLE_PAY']),
});

// POST /api/orders/:orderNumber/retry — retry a failed online payment, or switch to COD
export const POST = handler(async (req: Request, { params }: { params: Promise<{ orderNumber: string }> }) => {
  rateLimit(`retry:${clientIp(req)}`, 10, 10 * 60_000);
  const { orderNumber } = await params;
  const { token, paymentMethod } = schema.parse(await readJson(req));
  const order = await getAccessibleOrder(orderNumber, token);
  if (!order) throw new ApiError(404, 'Order not found');
  if (order.paymentStatus === 'PAID' || order.stockDeducted) throw new ApiError(400, 'This order has already been confirmed.');
  if (order.orderStatus === 'CANCELLED') throw new ApiError(400, 'This order was cancelled. Please place a new order.');

  // Stock may have changed since the first attempt
  for (const item of order.items) {
    if (!item.variantId) continue;
    const v = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
    if (!v || v.stock < item.quantity) throw new ApiError(409, `${item.name} (${item.sizeLabel}) is no longer in stock.`);
  }

  const successUrl = absoluteUrl(`/order/success?order=${order.orderNumber}&token=${order.accessToken}`, order.locale);
  if (paymentMethod === 'COD') {
    await prisma.order.update({ where: { id: order.id }, data: { paymentMethod: 'COD', paymentStatus: 'PENDING', paymentProvider: null } });
    await confirmOrder(order.orderNumber, { paid: false });
    return ok({ redirectUrl: successUrl });
  }

  const provider = getPaymentProvider();
  if (!provider?.methods.includes(paymentMethod as OnlineMethod)) throw new ApiError(400, 'This payment method is not available.');
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { paymentMethod, paymentStatus: 'PENDING', events: { create: { status: 'PAYMENT_RETRY', note: `Retry with ${paymentMethod}` } } },
  });
  const payment = await provider.createPayment(updated, { locale: order.locale, method: paymentMethod as OnlineMethod });
  await prisma.order.update({ where: { id: order.id }, data: { paymentProvider: provider.id, paymentReference: payment.reference } });
  return ok({ redirectUrl: payment.redirectUrl });
});
