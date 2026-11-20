import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPaymentProvider } from '@/lib/payments';
import { signMockEvent } from '@/lib/payments/mock';

const schema = z.object({
  order: z.string().min(1).max(40),
  token: z.string().min(1).max(100),
  ref: z.string().min(1).max(60),
  outcome: z.enum(['PAID', 'FAILED']),
});

// Sandbox only: the mock payment page posts here. We send a *signed* webhook to our
// own webhook endpoint (exactly like a real gateway would), then redirect the
// customer to the callback URL.
export async function POST(req: Request) {
  if (getPaymentProvider()?.id !== 'mock') return NextResponse.json({ ok: false }, { status: 404 });
  const form = await req.formData();
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 });
  const { order, token, ref, outcome } = parsed.data;

  const event = { orderNumber: order, reference: ref, status: outcome };
  const origin = new URL(req.url).origin;
  await fetch(`${origin}/api/payments/webhook`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-razi-signature': signMockEvent(event) },
    body: JSON.stringify(event),
  });
  return NextResponse.redirect(`${origin}/api/payments/callback?order=${encodeURIComponent(order)}&token=${encodeURIComponent(token)}`, 303);
}
