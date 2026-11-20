import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPaymentProvider } from '@/lib/payments';
import { confirmOrder, failOrderPayment } from '@/lib/orders';

// POST /api/payments/webhook — server-to-server notification from the payment gateway.
// The provider adapter verifies the signature; unsigned/forged calls are rejected.
export async function POST(req: Request) {
  const provider = getPaymentProvider();
  if (!provider) return NextResponse.json({ ok: false, error: 'Online payments disabled' }, { status: 404 });

  const event = await provider.parseWebhook(req);
  if (!event) return NextResponse.json({ ok: false, error: 'Invalid signature or payload' }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { orderNumber: event.orderNumber } });
  // The reference must match the payment session we created for this order
  if (!order || order.paymentReference !== event.reference) {
    return NextResponse.json({ ok: false, error: 'Unknown order' }, { status: 404 });
  }
  if (event.status === 'PAID') await confirmOrder(order.orderNumber, { paid: true, reference: event.reference });
  else await failOrderPayment(order.orderNumber, event.reference);
  return NextResponse.json({ ok: true });
}
