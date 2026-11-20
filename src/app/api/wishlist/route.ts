import { handler, ok } from '@/lib/api';
import { resolveWishlistOwner, wishlistProductIds } from '@/lib/wishlist';
import { listProducts, type ProductCardDTO } from '@/lib/catalog';

// GET /api/wishlist?full=1 — ids (for hearts/badge) and optionally full product cards
export const GET = handler(async (req: Request) => {
  const owner = await resolveWishlistOwner(false);
  const productIds = await wishlistProductIds(owner);
  let items: ProductCardDTO[] = [];
  if (new URL(req.url).searchParams.get('full') === '1' && productIds.length) {
    const { items: cards } = await listProducts({ ids: productIds, pageSize: 48 });
    // Preserve wishlist order (most recently added first)
    items = productIds.map((id) => cards.find((c) => c.id === id)).filter((c): c is ProductCardDTO => Boolean(c));
  }
  return ok({ productIds, items });
});
