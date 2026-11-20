import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { ApiError, clientIp, handler, ok, readJson } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { resetPasswordSchema } from '@/lib/validators';
import { hashToken } from '@/lib/tokens';

export const POST = handler(async (req: Request) => {
  rateLimit(`reset:${clientIp(req)}`, 10, 15 * 60_000);
  const { token, password } = resetPasswordSchema.parse(await readJson(req));

  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new ApiError(400, 'This reset link is invalid or has expired. Please request a new one.');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Invalidate any other outstanding reset links
    prisma.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null, id: { not: record.id } } }),
  ]);
  return ok({ reset: true });
});
