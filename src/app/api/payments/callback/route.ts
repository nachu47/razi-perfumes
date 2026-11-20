import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaymentProvider } from '@/lib/payments';
import { confirmOrder, failOrderPayment } from '@/lib/orders';
import { absoluteUrl } from '@/lib/site';

// GET /api/payments/callback?order=&token= — where the gateway sends the customer back.
// If the webhook hasn't arrived yet, asks the gateway for the status directly.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderNumber = url.searchParams.get('order') ?? '';
  const token = url.searchParams.get('token') ?? '';
  let order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order || order.accessToken !== token) return NextResponse.redirect(absoluteUrl('/'));

  const provider = getPaymentProvider();
  if (order.paymentStatus === 'PENDING' && provider?.fetchStatus && order.paymentMethod !== 'COD') {
    const event = await provider.fetchStatus(order);
    if (event?.status === 'PAID') await confirmOrder(order.orderNumber, { paid: true, reference: event.reference });
    if (event?.status === 'FAILED') await failOrderPayment(order.orderNumber, event.reference);
    order = (await prisma.order.findUnique({ where: { orderNumber } }))!;
  }

  const qs = `order=${order.orderNumber}&token=${order.accessToken}`;
  const target = order.paymentStatus === 'PAID' || order.paymentMethod === 'COD' ? `/order/success?${qs}` : `/order/failed?${qs}`;
  return NextResponse.redirect(absoluteUrl(target, order.locale));
}
