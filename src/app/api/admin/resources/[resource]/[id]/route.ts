import { ApiError, handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import { buildSchema, delegate, friendlyPrismaError, getResource, normalise, plain, revalidateFor } from '@/lib/admin/resource-server';

type Ctx = { params: Promise<{ resource: string; id: string }> };

export const GET = handler(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { resource, id } = await params;
  const def = getResource(resource);
  const row = await delegate(def).findUnique({ where: { [def.idField]: id } });
  if (!row) throw new ApiError(404, 'Not found');
  return ok(plain(row));
});

export const PUT = handler(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { resource, id } = await params;
  const def = getResource(resource);
  const data = normalise(def, buildSchema(def, true).parse(await readJson(req)) as Record<string, unknown>);
  const row = await delegate(def).update({ where: { [def.idField]: id }, data }).catch(friendlyPrismaError);
  revalidateFor(def);
  return ok(plain(row));
});

export const DELETE = handler(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { resource, id } = await params;
  const def = getResource(resource);
  if (def.canDelete === false) throw new ApiError(405, `${def.title} cannot be deleted.`);
  await delegate(def).delete({ where: { [def.idField]: id } }).catch(friendlyPrismaError);
  revalidateFor(def);
  return ok({ deleted: true });
});
