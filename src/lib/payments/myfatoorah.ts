import 'server-only';
import type { Order } from '@prisma/client';
import { ApiError } from '../api';
import { getCountry } from '../countries';
import { SITE_URL } from '../site';
import { toNum } from '../money';
import type { OnlineMethod, PaymentEvent, PaymentProvider } from './types';

// MyFatoorah API v2 (https://docs.myfatoorah.com).
// Flow: InitiatePayment (list methods for amount+currency) → ExecutePayment (get hosted
// PaymentURL + InvoiceId) → customer pays → redirected to our callback → we confirm with
// GetPaymentStatus. Webhooks are also confirmed by calling GetPaymentStatus with our own API
// key, so a forged webhook can never mark an order as paid.

const BASE = () => (process.env.MYFATOORAH_BASE_URL || 'https://apitest.myfatoorah.com').replace(/\/$/, '');
const KEY = () => process.env.MYFATOORAH_API_KEY || '';

// Our checkout method → MyFatoorah PaymentMethodCode(s), in order of preference
const METHOD_CODES: Record<OnlineMethod, string[]> = {
  KNET: ['kn'],
  CARD: ['vm', 'md', 'ae'],
  APPLE_PAY: ['ap'],
};

interface MfEnvelope<T> {
  IsSuccess: boolean;
  Message: string;
  ValidationErrors: { Name: string; Error: string }[] | null;
  Data: T;
}

async function mf<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE()}/v2/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => null)) as MfEnvelope<T> | null;
  if (!res.ok || !json?.IsSuccess) {
    const detail = json?.ValidationErrors?.map((e) => `${e.Name}: ${e.Error}`).join('; ') || json?.Message || `HTTP ${res.status}`;
    console.error(`[myfatoorah] ${path} failed:`, detail);
    throw new ApiError(502, 'The payment gateway could not start the payment. Please try again or choose Cash on Delivery.');
  }
  return json.Data;
}

interface InitiateData {
  PaymentMethods: { PaymentMethodId: number; PaymentMethodCode: string; PaymentMethodEn: string; IsDirectPayment: boolean }[];
}
interface ExecuteData {
  InvoiceId: number;
  PaymentURL: string;
}
interface StatusData {
  InvoiceId: number;
  InvoiceStatus: 'Pending' | 'Paid' | 'Canceled' | string;
  CustomerReference: string | null;
  InvoiceTransactions: { TransactionStatus: string; TransactionDate?: string; PaymentId?: string }[];
}

/** Maps an invoice status to our outcome. Pending invoices with no final transaction → null (still waiting). */
function outcome(d: StatusData): PaymentEvent['status'] | null {
  if (d.InvoiceStatus === 'Paid') return 'PAID';
  if (d.InvoiceStatus === 'Canceled') return 'FAILED';
  const tx = d.InvoiceTransactions ?? [];
  const last = tx[tx.length - 1];
  // Docs spell success as "Succss"; accept both spellings
  if (last && /^succ/i.test(last.TransactionStatus)) return 'PAID';
  if (last && /^(failed|canceled|cancelled)$/i.test(last.TransactionStatus)) return 'FAILED';
  return null;
}

async function statusByInvoice(invoiceId: string): Promise<StatusData> {
  return mf<StatusData>('GetPaymentStatus', { Key: invoiceId, KeyType: 'InvoiceId' });
}

/** Local mobile number for MyFatoorah (digits only, without country code, max 11 digits). */
function localMobile(phone: string, prefix: string): string | undefined {
  let digits = phone.replace(/\D/g, '').replace(/^00/, '');
  const cc = prefix.replace(/\D/g, '');
  if (digits.startsWith(cc) && digits.length > cc.length + 6) digits = digits.slice(cc.length);
  return digits.length >= 6 && digits.length <= 11 ? digits : undefined;
}

export const myFatoorahProvider: PaymentProvider = {
  id: 'myfatoorah',
  methods: ['KNET', 'CARD', 'APPLE_PAY'],

  async createPayment(order: Order, { locale, method }) {
    if (!KEY()) throw new ApiError(500, 'Payment gateway is not configured.');
    const amount = toNum(order.total);

    const { PaymentMethods } = await mf<InitiateData>('InitiatePayment', { InvoiceAmount: amount, CurrencyIso: order.currency });
    const hosted = PaymentMethods.filter((m) => !m.IsDirectPayment);
    const chosen = METHOD_CODES[method].map((code) => hosted.find((m) => m.PaymentMethodCode === code)).find(Boolean);
    if (!chosen) throw new ApiError(400, 'This payment method is not available for your currency. Please choose another one.');

    const address = order.shippingAddress as Record<string, string>;
    const country = getCountry(order.country);
    // Callback goes to our API (not locale-prefixed); it redirects to the right success/failure page.
    const callback = `${SITE_URL}/api/payments/callback?order=${encodeURIComponent(order.orderNumber)}&token=${encodeURIComponent(order.accessToken)}`;

    const data = await mf<ExecuteData>('ExecutePayment', {
      PaymentMethodId: chosen.PaymentMethodId,
      InvoiceValue: amount,
      DisplayCurrencyIso: order.currency,
      CustomerName: (address.fullName || 'Customer').slice(0, 100),
      CustomerEmail: order.email,
      CustomerMobile: localMobile(order.phone, country.phonePrefix),
      MobileCountryCode: localMobile(order.phone, country.phonePrefix) ? country.phonePrefix.replace('+', '') : undefined,
      CallBackUrl: callback,
      ErrorUrl: callback,
      Language: locale === 'ar' ? 'AR' : 'EN',
      CustomerReference: order.orderNumber,
      UserDefinedField: order.id,
      CustomerAddress: {
        Block: address.block || '',
        Street: address.street || '',
        HouseBuildingNo: address.building || '',
        Address: [address.area, address.city].filter(Boolean).join(', '),
        AddressInstructions: (address.notes || '').slice(0, 200),
      },
    });
    return { redirectUrl: data.PaymentURL, reference: String(data.InvoiceId) };
  },

  async fetchStatus(order: Order) {
    if (!order.paymentReference) return null;
    const d = await statusByInvoice(order.paymentReference);
    const status = outcome(d);
    return status ? { orderNumber: order.orderNumber, reference: String(d.InvoiceId), status } : null;
  },

  // Accepts both webhook v1 (Data.InvoiceId) and v2 (Data.Invoice.Id) payloads, then
  // re-reads the authoritative status from the API.
  async parseWebhook(req: Request) {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const data = (body?.Data ?? body?.data) as Record<string, unknown> | undefined;
    const invoice = data?.Invoice as Record<string, unknown> | undefined;
    const invoiceId = data?.InvoiceId ?? invoice?.Id ?? invoice?.InvoiceId;
    if (!invoiceId || !/^\d+$/.test(String(invoiceId))) return null;
    const d = await statusByInvoice(String(invoiceId));
    const status = outcome(d);
    if (!status || !d.CustomerReference) return null;
    return { orderNumber: d.CustomerReference, reference: String(d.InvoiceId), status };
  },
};
