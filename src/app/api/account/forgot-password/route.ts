import { prisma } from '@/lib/prisma';
import { clientIp, handler, ok, readJson } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { forgotPasswordSchema } from '@/lib/validators';
import { sendEmail } from '@/lib/email';
import { passwordResetEmail } from '@/lib/email-templates';
import { hashToken, randomToken } from '@/lib/tokens';
import { absoluteUrl } from '@/lib/site';

export const POST = handler(async (req: Request) => {
  rateLimit(`forgot:${clientIp(req)}`, 5, 15 * 60_000);
  const { email, locale } = forgotPasswordSchema.parse(await readJson(req));

  const user = await prisma.user.findUnique({ where: { email } });
  // Always answer the same way so the endpoint can't be used to discover accounts
  if (user) {
    const token = randomToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 3600_000) },
    });
    const url = absoluteUrl(`/account/reset-password?token=${token}`, locale);
    await sendEmail({ to: user.email, ...passwordResetEmail(url, locale) });
  }
  return ok({ sent: true });
});
