import { prisma } from '@/lib/prisma';
import { ApiError, handler, ok } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import { serializeOrder } from '@/lib/order-dto';

export const GET = handler(async (_req: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, phone: true, role: true, createdAt: true, emailVerified: true,
      addresses: true,
      orders: { orderBy: { createdAt: 'desc' }, include: { items: true } },
      _count: { select: { wishlistItems: true, reviews: true } },
    },
  });
  if (!user) throw new ApiError(404, 'Customer not found');
  return ok({
    ...user,
    createdAt: user.createdAt.toISOString(),
    emailVerified: user.emailVerified?.toISOString() ?? null,
    orders: user.orders.map(serializeOrder),
  });
});
