import { prisma } from '@/lib/prisma';
import { ApiError, handler, ok, readJson } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { addressSchema } from '@/lib/validators';

type Ctx = { params: Promise<{ id: string }> };

async function owned(userId: string, id: string) {
  const a = await prisma.address.findFirst({ where: { id, userId } });
  if (!a) throw new ApiError(404, 'Address not found');
  return a;
}

export const PUT = handler(async (req: Request, { params }: Ctx) => {
  const u = await requireUser();
  const { id } = await params;
  await owned(u.id, id);
  const input = addressSchema.parse(await readJson(req));
  const address = await prisma.$transaction(async (tx) => {
    if (input.isDefault) await tx.address.updateMany({ where: { userId: u.id }, data: { isDefault: false } });
    return tx.address.update({ where: { id }, data: { ...input, isDefault: input.isDefault ?? undefined } });
  });
  return ok(address);
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  const u = await requireUser();
  const { id } = await params;
  const a = await owned(u.id, id);
  await prisma.address.delete({ where: { id } });
  if (a.isDefault) {
    const next = await prisma.address.findFirst({ where: { userId: u.id }, orderBy: { createdAt: 'desc' } });
    if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  return ok({ deleted: true });
});
