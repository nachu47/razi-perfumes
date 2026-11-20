import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import { friendlyPrismaError } from '@/lib/admin/resource-server';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const { isRead } = z.object({ isRead: z.boolean() }).parse(await readJson(req));
  await prisma.contactMessage.update({ where: { id }, data: { isRead } }).catch(friendlyPrismaError);
  return ok({ id, isRead });
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  await prisma.contactMessage.delete({ where: { id } }).catch(friendlyPrismaError);
  return ok({ deleted: true });
});
