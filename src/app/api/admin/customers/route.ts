import { prisma } from '@/lib/prisma';
import { handler, ok } from '@/lib/api';
import { requireAdmin } from '@/lib/session';

// GET /api/admin/customers?q= — customers with order count + lifetime spend (KWD)
export const GET = handler(async (req: Request) => {
  await requireAdmin();
  const q = new URL(req.url).searchParams.get('q')?.trim();
  const users = await prisma.user.findMany({
    where: q ? { OR: [{ email: { contains: q, mode: 'insensitive' } }, { name: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }] } : {},
    select: {
      id: true, name: true, email: true, phone: true, role: true, createdAt: true, emailVerified: true, lastLoginAt: true, loginCount: true,
      _count: { select: { enquiries: true, productViews: true, wishlistItems: true } },
    },
    orderBy: [{ lastLoginAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    take: 500,
  });
  const stats = await prisma.order.groupBy({
    by: ['userId'],
    where: { userId: { in: users.map((u) => u.id) }, orderStatus: { not: 'CANCELLED' } },
    _count: true,
    _sum: { totalKWD: true },
  });
  const byUser = new Map(stats.map((s) => [s.userId, s]));
  return ok(
    users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      emailVerified: u.emailVerified?.toISOString() ?? null,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      orders: byUser.get(u.id)?._count ?? 0,
      spentKWD: Number(byUser.get(u.id)?._sum.totalKWD ?? 0),
    })),
  );
});
