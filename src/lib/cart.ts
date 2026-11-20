import 'server-only';
import { cookies } from 'next/headers';
import type { Cart } from '@prisma/client';
import { prisma } from './prisma';
import { getSessionUser } from './session';
import { getVisitorCountry } from './currency';
import { buildQuote, type Quote } from './pricing';

// Guest carts are identified by an httpOnly cookie holding the cart id.
// When a guest signs in, their guest cart is merged into the user cart on the
// next cart request (lazy merge — no special login hook needed).
export const CART_COOKIE = 'razi_cart';
export const MAX_QTY = 20;

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 60,
};

async function mergeCarts(from: string, into: Cart) {
  const guestItems = await prisma.cartItem.findMany({ where: { cartId: from } });
  await prisma.$transaction(async (tx) => {
    for (const item of guestItems) {
      const existing = await tx.cartItem.findUnique({ where: { cartId_variantId: { cartId: into.id, variantId: item.variantId } } });
      if (existing) {
        await tx.cartItem.update({ where: { id: existing.id }, data: { quantity: Math.min(MAX_QTY, existing.quantity + item.quantity) } });
      } else {
        await tx.cartItem.create({ data: { cartId: into.id, variantId: item.variantId, quantity: item.quantity } });
      }
    }
    const guest = await tx.cart.findUnique({ where: { id: from } });
    if (guest?.couponCode && !into.couponCode) await tx.cart.update({ where: { id: into.id }, data: { couponCode: guest.couponCode } });
    await tx.cart.delete({ where: { id: from } });
  });
}

/**
 * Resolve the current visitor's cart. Must be called from a Route Handler
 * (it may set/delete cookies). With create=false returns null when no cart exists.
 */
export async function resolveCart(create: boolean): Promise<Cart | null> {
  const user = await getSessionUser();
  const store = await cookies();
  const guestCartId = store.get(CART_COOKIE)?.value;

  if (user) {
    let cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (guestCartId) {
      const guest = await prisma.cart.findFirst({ where: { id: guestCartId, userId: null } });
      if (guest) {
        if (!cart) {
          cart = await prisma.cart.update({ where: { id: guest.id }, data: { userId: user.id } });
        } else {
          await mergeCarts(guest.id, cart);
          cart = await prisma.cart.findUnique({ where: { id: cart.id } });
        }
      }
      store.delete(CART_COOKIE);
    }
    if (!cart && create) cart = await prisma.cart.create({ data: { userId: user.id } });
    return cart;
  }

  let cart = guestCartId ? await prisma.cart.findFirst({ where: { id: guestCartId, userId: null } }) : null;
  if (!cart && create) {
    cart = await prisma.cart.create({ data: {} });
    store.set(CART_COOKIE, cart.id, cookieOptions);
  }
  return cart;
}

export type CartDTO = Quote & { id: string | null };

/** Price the cart in the visitor's currency, with a shipping estimate for their country. */
export async function cartQuote(cart: Cart | null): Promise<CartDTO> {
  const country = await getVisitorCountry();
  const items = cart
    ? await prisma.cartItem.findMany({ where: { cartId: cart.id }, orderBy: { createdAt: 'asc' } })
    : [];
  const quote = await buildQuote({
    lines: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity, cartItemId: i.id })),
    currency: country.currency,
    shippingCountry: country.code,
    couponCode: cart?.couponCode,
  });
  return { ...quote, id: cart?.id ?? null };
}
