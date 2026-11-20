import { handler, ok } from '@/lib/api';
import { listProducts } from '@/lib/catalog';

// Live header suggestions: GET /api/search?q=hud
export const GET = handler(async (req: Request) => {
  const q = new URL(req.url).searchParams.get('q')?.trim().slice(0, 100) ?? '';
  if (q.length < 2) return ok({ items: [], total: 0 });
  const { items, total } = await listProducts({ q, pageSize: 6, sort: 'best-selling' });
  return ok({
    items: items.map((p) => ({ slug: p.slug, nameEn: p.nameEn, nameAr: p.nameAr, image: p.image, priceFromKWD: p.priceFromKWD })),
    total,
  });
});
