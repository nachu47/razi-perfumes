import type { Order, PaymentMethod } from '@prisma/client';

export type OnlineMethod = Exclude<PaymentMethod, 'COD'>;

export interface CreatePaymentResult {
  /** Where to send the customer to pay (hosted payment page). */
  redirectUrl: string;
  /** Gateway invoice / session id, stored on the order as paymentReference. */
  reference: string;
}

export interface PaymentEvent {
  orderNumber: string;
  reference: string;
  status: 'PAID' | 'FAILED';
}

/**
 * A payment gateway adapter. To add MyFatoorah or Tap, implement this interface in
 * src/lib/payments/<gateway>.ts and register it in src/lib/payments/index.ts.
 * - createPayment: create an invoice/charge for order.total in order.currency and
 *   return the hosted payment URL. Callback URL: /api/payments/callback?order=&token=
 *   Webhook URL: /api/payments/webhook
 * - parseWebhook: verify the gateway signature and return the payment outcome (or null to ignore).
 * - fetchStatus: query the gateway for the outcome (used on the callback redirect, in case
 *   the webhook has not arrived yet).
 */
export interface PaymentProvider {
  id: string;
  methods: OnlineMethod[];
  createPayment(order: Order, opts: { locale: string; method: OnlineMethod }): Promise<CreatePaymentResult>;
  parseWebhook(req: Request): Promise<PaymentEvent | null>;
  fetchStatus?(order: Order): Promise<PaymentEvent | null>;
}
