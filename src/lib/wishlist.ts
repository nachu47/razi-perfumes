import 'server-only';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { getSessionUser } from './session';
import { randomToken } from './tokens';

// Guests get a random id in the httpOnly "razi_guest" cookie. On sign-in their
// wishlist rows are moved to the user (skipping products already wishlisted).
export const GUEST_COOKIE = 'razi_guest';

export type WishlistOwner = { userId: string; guestId?: undefined } | { guestId: string; userId?: undefined };

export async function resolveWishlistOwner(create: boolean): Promise<WishlistOwner | null> {
  const user = await getSessionUser();
  const store = await cookies();
  const guestId = store.get(GUEST_COOKIE)?.value;

  if (user) {
    if (guestId) {
      const guestItems = await prisma.wishlistItem.findMany({ where: { guestId } });
      for (const item of guestItems) {
        await prisma.wishlistItem.upsert({
          where: { userId_productId: { userId: user.id, productId: item.productId } },
          update: {},
          create: { userId: user.id, productId: item.productId },
        });
      }
      await prisma.wishlistItem.deleteMany({ where: { guestId } });
      await mergeGuestActivity(guestId, user.id);
      store.delete(GUEST_COOKIE);
    }
    return { userId: user.id };
  }
  if (guestId) return { guestId };
  if (!create) return null;
  const id = randomToken(16);
  store.set(GUEST_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 180,
  });
  return { guestId: id };
}

/** On sign-in, attach the guest's recently viewed products and WhatsApp enquiries to the customer. */
async function mergeGuestActivity(guestId: string, userId: string) {
  const views = await prisma.productView.findMany({ where: { guestId } });
  for (const v of views) {
    const existing = await prisma.productView.findUnique({ where: { userId_productId: { userId, productId: v.productId } } });
    if (existing) {
      await prisma.productView.update({
        where: { id: existing.id },
        data: { viewCount: existing.viewCount + v.viewCount, lastViewedAt: v.lastViewedAt > existing.lastViewedAt ? v.lastViewedAt : existing.lastViewedAt },
      });
    } else {
      await prisma.productView.create({ data: { userId, productId: v.productId, viewCount: v.viewCount, firstViewAt: v.firstViewAt, lastViewedAt: v.lastViewedAt } });
    }
  }
  await prisma.productView.deleteMany({ where: { guestId } });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, phone: true } });
  await prisma.enquiry.updateMany({
    where: { guestId },
    data: { userId, guestId: null, name: user?.name, email: user?.email, phone: user?.phone },
  });
}

export async function wishlistProductIds(owner: WishlistOwner | null): Promise<string[]> {
  if (!owner) return [];
  const rows = await prisma.wishlistItem.findMany({
    where: owner.userId ? { userId: owner.userId } : { guestId: owner.guestId },
    orderBy: { createdAt: 'desc' },
    select: { productId: true },
  });
  return rows.map((r) => r.productId);
}
