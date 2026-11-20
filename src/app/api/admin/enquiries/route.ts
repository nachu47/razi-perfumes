import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { handler, ok } from '@/lib/api';
import { requireAdmin } from '@/lib/session';

// GET /api/admin/enquiries?status=NEW|CONTACTED|CLOSED&q=
export const GET = handler(async (req: Request) => {
  await requireAdmin();
  const sp = new URL(req.url).searchParams;
  const where: Prisma.EnquiryWhereInput = {};
  const status = sp.get('status');
  if (status === 'NEW' || status === 'CONTACTED' || status === 'CLOSED') where.status = status;
  const q = sp.get('q')?.trim();
  if (q) {
    where.OR = [
      { productName: { contains: q, mode: 'insensitive' } },
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q } },
    ];
  }
  const rows = await prisma.enquiry.findMany({
    where,
    include: {
      product: { select: { slug: true, images: true } },
      user: { select: { id: true, name: true, email: true, phone: true, lastLoginAt: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  // For each enquiry, how many products that visitor has viewed (quick interest signal)
  const viewCounts = await prisma.productView.groupBy({
    by: ['userId', 'guestId'],
    where: { OR: [{ userId: { in: rows.map((r) => r.userId).filter((x): x is string => !!x) } }, { guestId: { in: rows.map((r) => r.guestId).filter((x): x is string => !!x) } }] },
    _count: true,
  });
  const viewsFor = (r: (typeof rows)[number]) =>
    viewCounts.find((v) => (r.userId ? v.userId === r.userId : v.guestId === r.guestId))?._count ?? 0;

  return ok(
    rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      user: r.user ? { ...r.user, lastLoginAt: r.user.lastLoginAt?.toISOString() ?? null } : null,
      productsViewed: viewsFor(r),
    })),
  );
});
