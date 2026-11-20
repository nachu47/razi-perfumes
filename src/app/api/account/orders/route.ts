import { prisma } from '@/lib/prisma';
import { handler, ok } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { serializeOrder } from '@/lib/order-dto';

// GET /api/account/orders — order history for the signed-in customer
export const GET = handler(async () => {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { items: true, events: true },
    take: 100,
  });
  return ok(orders.map(serializeOrder));
});
