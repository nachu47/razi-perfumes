import { prisma } from '@/lib/prisma';
import { handler, ok, readJson } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { profileSchema } from '@/lib/validators';

export const GET = handler(async () => {
  const u = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: u.id },
    select: { id: true, name: true, email: true, phone: true, role: true, emailVerified: true, passwordHash: true, createdAt: true },
  });
  const { passwordHash, ...rest } = user;
  return ok({ ...rest, hasPassword: Boolean(passwordHash) });
});

export const PATCH = handler(async (req: Request) => {
  const u = await requireUser();
  const input = profileSchema.parse(await readJson(req));
  const user = await prisma.user.update({
    where: { id: u.id },
    data: { name: input.name, phone: input.phone || null },
    select: { id: true, name: true, email: true, phone: true },
  });
  return ok(user);
});
