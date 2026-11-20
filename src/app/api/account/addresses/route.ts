import { prisma } from '@/lib/prisma';
import { handler, ok, readJson } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { addressSchema } from '@/lib/validators';

export const GET = handler(async () => {
  const u = await requireUser();
  const addresses = await prisma.address.findMany({
    where: { userId: u.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  return ok(addresses);
});

export const POST = handler(async (req: Request) => {
  const u = await requireUser();
  const input = addressSchema.parse(await readJson(req));
  const count = await prisma.address.count({ where: { userId: u.id } });
  const isDefault = input.isDefault || count === 0;
  const address = await prisma.$transaction(async (tx) => {
    if (isDefault) await tx.address.updateMany({ where: { userId: u.id }, data: { isDefault: false } });
    return tx.address.create({ data: { ...input, isDefault, userId: u.id } });
  });
  return ok(address, { status: 201 });
});
