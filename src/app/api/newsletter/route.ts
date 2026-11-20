import { prisma } from '@/lib/prisma';
import { clientIp, handler, ok, readJson } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { newsletterSchema } from '@/lib/validators';

// POST /api/newsletter { email } — idempotent subscribe
export const POST = handler(async (req: Request) => {
  rateLimit(`newsletter:${clientIp(req)}`, 5, 15 * 60_000);
  const { email, website } = newsletterSchema.parse(await readJson(req));
  if (!website) {
    await prisma.newsletterSubscriber.upsert({ where: { email }, update: {}, create: { email } });
  }
  return ok({ subscribed: true });
});
