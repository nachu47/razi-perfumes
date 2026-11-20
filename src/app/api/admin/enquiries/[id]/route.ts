import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import { friendlyPrismaError } from '@/lib/admin/resource-server';

type Ctx = { params: Promise<{ id: string }> };

const schema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'CLOSED']).optional(),
  adminNote: z.string().trim().max(1000).optional().nullable(),
});

export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const data = schema.parse(await readJson(req));
  const row = await prisma.enquiry.update({ where: { id }, data }).catch(friendlyPrismaError);
  return ok({ id: row.id, status: row.status, adminNote: row.adminNote });
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  await prisma.enquiry.delete({ where: { id } }).catch(friendlyPrismaError);
  return ok({ deleted: true });
});
