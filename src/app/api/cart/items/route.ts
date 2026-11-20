import { prisma } from '@/lib/prisma';
import { ApiError, handler, ok, readJson } from '@/lib/api';
import { MAX_QTY, cartQuote, resolveCart } from '@/lib/cart';
import { cartAddSchema } from '@/lib/validators';

// POST /api/cart/items { variantId, quantity } — adds to (or increases) a cart line
export const POST = handler(async (req: Request) => {
  const { variantId, quantity } = cartAddSchema.parse(await readJson(req));
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, include: { product: true } });
  if (!variant || !variant.product.isActive) throw new ApiError(404, 'This product is no longer available.');

  const cart = (await resolveCart(true))!;
  const existing = await prisma.cartItem.findUnique({ where: { cartId_variantId: { cartId: cart.id, variantId } } });
  const nextQty = (existing?.quantity ?? 0) + quantity;

  if (variant.stock <= 0) throw new ApiError(409, 'Sorry, this item is out of stock.');
  if (nextQty > variant.stock) throw new ApiError(409, `Only ${variant.stock} left in stock.`);
  if (nextQty > MAX_QTY) throw new ApiError(409, `You can order up to ${MAX_QTY} of this item.`);

  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: nextQty } });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, variantId, quantity } });
  }
  return ok(await cartQuote(cart));
});
