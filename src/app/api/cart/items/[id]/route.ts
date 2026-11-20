import { prisma } from '@/lib/prisma';
import { ApiError, handler, ok, readJson } from '@/lib/api';
import { MAX_QTY, cartQuote, resolveCart } from '@/lib/cart';
import { cartUpdateSchema } from '@/lib/validators';

type Ctx = { params: Promise<{ id: string }> };

async function ownedItem(id: string) {
  const cart = await resolveCart(false);
  if (!cart) throw new ApiError(404, 'Cart not found');
  const item = await prisma.cartItem.findFirst({ where: { id, cartId: cart.id }, include: { variant: true } });
  if (!item) throw new ApiError(404, 'Item not found in your basket');
  return { cart, item };
}

// PATCH /api/cart/items/:id { quantity } — quantity 0 removes the line
export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const { quantity } = cartUpdateSchema.parse(await readJson(req));
  const { cart, item } = await ownedItem(id);
  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  } else {
    if (quantity > item.variant.stock) throw new ApiError(409, `Only ${item.variant.stock} left in stock.`);
    if (quantity > MAX_QTY) throw new ApiError(409, `You can order up to ${MAX_QTY} of this item.`);
    await prisma.cartItem.update({ where: { id: item.id }, data: { quantity } });
  }
  return ok(await cartQuote(cart));
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  const { cart, item } = await ownedItem(id);
  await prisma.cartItem.delete({ where: { id: item.id } });
  return ok(await cartQuote(cart));
});
