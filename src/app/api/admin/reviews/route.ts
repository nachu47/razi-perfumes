import { prisma } from '@/lib/prisma';
import { handler, ok } from '@/lib/api';
import { requireAdmin } from '@/lib/session';

// GET /api/admin/reviews?status=pending|approved
export const GET = handler(async (req: Request) => {
  await requireAdmin();
  const status = new URL(req.url).searchParams.get('status');
  const rows = await prisma.review.findMany({
    where: status === 'pending' ? { isApproved: false } : status === 'approved' ? { isApproved: true } : {},
    include: { product: { select: { nameEn: true, slug: true } }, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  return ok(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});
