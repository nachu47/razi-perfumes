import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { clientIp, handler, ok, readJson } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { resolveWishlistOwner } from '@/lib/wishlist';

const schema = z.object({ productId: z.string().min(1).max(50) });

// POST /api/activity/view { productId } — records a product view ("recently viewed" in admin)
export const POST = handler(async (req: Request) => {
  rateLimit(`view:${clientIp(req)}`, 120, 60_000);
  const { productId } = schema.parse(await readJson(req));
  const product = await prisma.product.findFirst({ where: { id: productId, isActive: true }, select: { id: true } });
  if (!product) return ok({ recorded: false });

  const owner = (await resolveWishlistOwner(true))!; // same visitor identity as the wishlist
  const where = owner.userId
    ? { userId_productId: { userId: owner.userId, productId } }
    : { guestId_productId: { guestId: owner.guestId!, productId } };
  await prisma.productView.upsert({
    where,
    update: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
    create: { productId, userId: owner.userId ?? null, guestId: owner.guestId ?? null },
  });
  return ok({ recorded: true });
});
