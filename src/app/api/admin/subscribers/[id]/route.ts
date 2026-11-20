import { prisma } from '@/lib/prisma';
import { handler, ok } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import { friendlyPrismaError } from '@/lib/admin/resource-server';

export const DELETE = handler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  await prisma.newsletterSubscriber.delete({ where: { id } }).catch(friendlyPrismaError);
  return ok({ deleted: true });
});
