import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import { getStoreSettings, revalidateSettings } from '@/lib/settings';
import { getPaymentProvider } from '@/lib/payments';

const schema = z.object({
  whatsappEnabled: z.boolean(),
  // Stored as digits only (international format without + or 00)
  whatsappNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, '').replace(/^00/, ''))
    .refine((v) => v === '' || (v.length >= 8 && v.length <= 15), 'Enter the full number with country code, e.g. 96550000000')
    .transform((v) => v || null),
  whatsappGreetingEn: z.string().trim().min(1).max(300),
  whatsappGreetingAr: z.string().trim().min(1).max(300),
});

export const GET = handler(async () => {
  await requireAdmin();
  const provider = getPaymentProvider();
  return ok({
    ...(await getStoreSettings()),
    // Read-only info: gateway is configured via environment variables (secrets never leave the server)
    paymentProvider: provider?.id ?? 'none',
    paymentMethods: ['COD', ...(provider?.methods ?? [])],
    paymentMode: process.env.MYFATOORAH_BASE_URL?.includes('apitest') || !process.env.MYFATOORAH_BASE_URL ? 'test' : 'live',
  });
});

export const PUT = handler(async (req: Request) => {
  await requireAdmin();
  const data = schema.parse(await readJson(req));
  await prisma.storeSetting.upsert({ where: { id: 'default' }, update: data, create: { id: 'default', ...data } });
  revalidateSettings();
  return ok(await getStoreSettings());
});
