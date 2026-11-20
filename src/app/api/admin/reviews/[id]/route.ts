import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import { revalidateCatalog } from '@/lib/currency';
import { friendlyPrismaError } from '@/lib/admin/resource-server';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const { isApproved } = z.object({ isApproved: z.boolean() }).parse(await readJson(req));
  await prisma.review.update({ where: { id }, data: { isApproved } }).catch(friendlyPrismaError);
  revalidateCatalog(); // approved reviews show on product pages
  return ok({ id, isApproved });
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  await prisma.review.delete({ where: { id } }).catch(friendlyPrismaError);
  revalidateCatalog();
  return ok({ deleted: true });
});
