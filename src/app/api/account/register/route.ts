import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { ApiError, clientIp, handler, ok, readJson } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { registerSchema } from '@/lib/validators';
import { sendEmail } from '@/lib/email';
import { verifyEmail } from '@/lib/email-templates';
import { hashToken, randomToken } from '@/lib/tokens';
import { SITE_URL } from '@/lib/site';

export const POST = handler(async (req: Request) => {
  rateLimit(`register:${clientIp(req)}`, 5, 15 * 60_000);
  const input = registerSchema.parse(await readJson(req));

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ApiError(409, 'An account with this email already exists. Please sign in.');

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, phone: input.phone || null, passwordHash },
  });

  const token = randomToken();
  await prisma.verificationToken.create({
    data: { identifier: user.email, token: hashToken(token), expires: new Date(Date.now() + 24 * 3600_000) },
  });
  const url = `${SITE_URL}/api/account/verify-email?email=${encodeURIComponent(user.email)}&token=${token}`;
  await sendEmail({ to: user.email, ...verifyEmail(url, input.locale) });

  return ok({ id: user.id, email: user.email }, { status: 201 });
});
