import 'server-only';
import type { Order } from '@prisma/client';
import { absoluteUrl } from '../site';
import { hmac, randomToken, safeEqual } from '../tokens';
import type { PaymentEvent, PaymentProvider } from './types';

// A local sandbox gateway that behaves like a hosted payment page:
// customer → /payment/mock (choose "Pay" or "Decline") → signed server-to-server
// webhook → callback redirect. Lets the full online-payment flow be tested end to
// end without gateway credentials. Disabled in production.

const secret = () => process.env.PAYMENT_WEBHOOK_SECRET || 'dev-mock-secret';

export function signMockEvent(e: PaymentEvent): string {
  return hmac(`${e.orderNumber}|${e.reference}|${e.status}`, secret());
}

export const mockProvider: PaymentProvider = {
  id: 'mock',
  methods: ['KNET', 'CARD', 'APPLE_PAY'],

  async createPayment(order: Order, { locale, method }) {
    const reference = `MOCK-${randomToken(8).toUpperCase()}`;
    const qs = new URLSearchParams({ order: order.orderNumber, token: order.accessToken, ref: reference, method });
    return { reference, redirectUrl: absoluteUrl(`/payment/mock?${qs}`, locale) };
  },

  async parseWebhook(req: Request) {
    const signature = req.headers.get('x-razi-signature') || '';
    const body = (await req.json().catch(() => null)) as PaymentEvent | null;
    if (!body?.orderNumber || !body.reference || !['PAID', 'FAILED'].includes(body.status)) return null;
    if (!safeEqual(signature, signMockEvent(body))) return null;
    return body;
  },
};
