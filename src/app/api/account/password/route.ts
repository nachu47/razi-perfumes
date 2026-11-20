import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { ApiError, handler, ok, readJson } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import { changePasswordSchema } from '@/lib/validators';

export const POST = handler(async (req: Request) => {
  const u = await requireUser();
  rateLimit(`pw:${u.id}`, 10, 15 * 60_000);
  const { currentPassword, newPassword } = changePasswordSchema.parse(await readJson(req));
  const user = await prisma.user.findUniqueOrThrow({ where: { id: u.id } });
  // Google-only accounts have no password yet and may set one without the current password
  if (user.passwordHash) {
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new ApiError(400, 'Your current password is incorrect.');
    }
  }
  await prisma.user.update({ where: { id: u.id }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
  return ok({ changed: true });
});
