import { prisma } from '@/lib/prisma';
import { handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import { syncProductPrice } from '@/lib/catalog';
import { revalidateCatalog } from '@/lib/currency';
import { friendlyPrismaError, plain } from '@/lib/admin/resource-server';
import { productInput } from '@/lib/admin/product-schema';

// GET /api/admin/products?q=&collection=&status=active|inactive|low-stock
export const GET = handler(async (req: Request) => {
  await requireAdmin();
  const sp = new URL(req.url).searchParams;
  const q = sp.get('q')?.trim();
  const status = sp.get('status');
  const rows = await prisma.product.findMany({
    where: {
      ...(q ? { OR: [{ nameEn: { contains: q, mode: 'insensitive' } }, { nameAr: { contains: q } }, { slug: { contains: q } }, { variants: { some: { sku: { contains: q, mode: 'insensitive' } } } }] } : {}),
      ...(sp.get('collection') ? { collectionId: sp.get('collection')! } : {}),
      ...(status === 'active' ? { isActive: true } : status === 'inactive' ? { isActive: false } : {}),
      ...(status === 'low-stock' ? { variants: { some: { stock: { lte: 5 } } } } : {}),
    },
    include: { variants: { orderBy: { sortOrder: 'asc' } }, collection: { select: { nameEn: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  return ok(
    rows.map((p) => ({
      ...plain(p),
      collection: p.collection?.nameEn ?? null,
      variants: p.variants.map(plain),
      totalStock: p.variants.reduce((s, v) => s + v.stock, 0),
    })),
  );
});

// POST /api/admin/products — create product with variants
export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const { variants, ...data } = productInput.parse(await readJson(req));
  const product = await prisma
    .$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          ...data,
          variants: { create: variants.map(({ id: _id, ...v }, i) => ({ ...v, sortOrder: i })) },
        },
      });
      await syncProductPrice(p.id, tx);
      return p;
    })
    .catch(friendlyPrismaError);
  revalidateCatalog();
  return ok({ id: product.id }, { status: 201 });
});
