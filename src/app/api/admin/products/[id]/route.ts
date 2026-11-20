import { prisma } from '@/lib/prisma';
import { ApiError, handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import { syncProductPrice } from '@/lib/catalog';
import { revalidateCatalog } from '@/lib/currency';
import { friendlyPrismaError, plain } from '@/lib/admin/resource-server';
import { productInput } from '@/lib/admin/product-schema';

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const p = await prisma.product.findUnique({ where: { id }, include: { variants: { orderBy: { sortOrder: 'asc' } } } });
  if (!p) throw new ApiError(404, 'Product not found');
  return ok({ ...plain(p), variants: p.variants.map(plain) });
});

// PUT — replace product fields and reconcile variants (update existing, create new, delete removed)
export const PUT = handler(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const { variants, ...data } = productInput.parse(await readJson(req));
  await prisma
    .$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data });
      const keep = variants.filter((v) => v.id).map((v) => v.id!);
      await tx.productVariant.deleteMany({ where: { productId: id, id: { notIn: keep } } });
      for (const [i, { id: variantId, ...v }] of variants.entries()) {
        if (variantId) await tx.productVariant.update({ where: { id: variantId }, data: { ...v, sortOrder: i } });
        else await tx.productVariant.create({ data: { ...v, productId: id, sortOrder: i } });
      }
      await syncProductPrice(id, tx);
    })
    .catch(friendlyPrismaError);
  revalidateCatalog();
  return ok({ id });
});

// PATCH — quick toggles from the product list (isActive / isFeatured / isRecommended)
export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const body = (await readJson(req)) as Record<string, unknown>;
  const data: Record<string, boolean> = {};
  for (const k of ['isActive', 'isFeatured', 'isRecommended']) if (typeof body[k] === 'boolean') data[k] = body[k] as boolean;
  if (!Object.keys(data).length) throw new ApiError(400, 'Nothing to update');
  await prisma.product.update({ where: { id }, data }).catch(friendlyPrismaError);
  revalidateCatalog();
  return ok({ id, ...data });
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  // Order history keeps its own snapshot (name, size, price), so deleting is safe.
  await prisma.product.delete({ where: { id } }).catch(friendlyPrismaError);
  revalidateCatalog();
  return ok({ deleted: true });
});
