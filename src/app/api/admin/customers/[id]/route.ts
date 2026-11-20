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
      lastLoginAt: true, loginCount: true,
      addresses: true,
      productViews: {
        orderBy: { lastViewedAt: 'desc' },
        take: 30,
        include: { product: { select: { id: true, nameEn: true, slug: true, images: true } } },
      },
      enquiries: { orderBy: { createdAt: 'desc' }, take: 50 },
      wishlistItems: { orderBy: { createdAt: 'desc' }, include: { product: { select: { id: true, nameEn: true, slug: true, images: true } } } },
      orders: { orderBy: { createdAt: 'desc' }, include: { items: true } },
      _count: { select: { wishlistItems: true, reviews: true } },
    },
  });
  if (!user) throw new ApiError(404, 'Customer not found');
  return ok({
    ...user,
    createdAt: user.createdAt.toISOString(),
    emailVerified: user.emailVerified?.toISOString() ?? null,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    orders: user.orders.map(serializeOrder),
    productViews: user.productViews.map((v) => ({
      id: v.id,
      viewCount: v.viewCount,
      lastViewedAt: v.lastViewedAt.toISOString(),
      product: { id: v.product.id, nameEn: v.product.nameEn, slug: v.product.slug, image: v.product.images[0] ?? null },
    })),
    enquiries: user.enquiries.map((e) => ({ ...e, createdAt: e.createdAt.toISOString(), updatedAt: e.updatedAt.toISOString() })),
    wishlistItems: user.wishlistItems.map((w) => ({
      id: w.id,
      createdAt: w.createdAt.toISOString(),
      product: { id: w.product.id, nameEn: w.product.nameEn, slug: w.product.slug, image: w.product.images[0] ?? null },
    })),
  });
});
