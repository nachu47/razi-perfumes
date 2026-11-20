import { prisma } from '@/lib/prisma';
import { ApiError, handler, ok, readJson } from '@/lib/api';
import { resolveWishlistOwner, wishlistProductIds } from '@/lib/wishlist';
import { wishlistToggleSchema } from '@/lib/validators';

// POST /api/wishlist/toggle { productId } — adds or removes; returns the updated id list
export const POST = handler(async (req: Request) => {
  const { productId } = wishlistToggleSchema.parse(await readJson(req));
  const product = await prisma.product.findFirst({ where: { id: productId, isActive: true }, select: { id: true } });
  if (!product) throw new ApiError(404, 'Product not found');

  const owner = (await resolveWishlistOwner(true))!;
  const where = owner.userId
    ? { userId_productId: { userId: owner.userId, productId } }
    : { guestId_productId: { guestId: owner.guestId!, productId } };
  const existing = await prisma.wishlistItem.findUnique({ where });
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
  } else {
    await prisma.wishlistItem.create({ data: { productId, userId: owner.userId ?? null, guestId: owner.guestId ?? null } });
  }
  return ok({ added: !existing, productIds: await wishlistProductIds(owner) });
});
