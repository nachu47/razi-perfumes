import { ApiError, handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import { buildSchema, delegate, friendlyPrismaError, getResource, normalise, plain, revalidateFor } from '@/lib/admin/resource-server';

type Ctx = { params: Promise<{ resource: string }> };

// GET /api/admin/resources/:resource?q= — list rows
export const GET = handler(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const def = getResource((await params).resource);
  const q = new URL(req.url).searchParams.get('q')?.trim();
  const where =
    q && def.searchable?.length ? { OR: def.searchable.map((f) => ({ [f]: { contains: q, mode: 'insensitive' } })) } : {};
  const rows = await delegate(def).findMany({ where, orderBy: def.orderBy, take: 500 });
  return ok(rows.map(plain));
});

// POST /api/admin/resources/:resource — create
export const POST = handler(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const def = getResource((await params).resource);
  if (def.canCreate === false) throw new ApiError(405, `${def.title} cannot be created here.`);
  const data = normalise(def, buildSchema(def, false).parse(await readJson(req)) as Record<string, unknown>);
  const row = await delegate(def).create({ data }).catch(friendlyPrismaError);
  revalidateFor(def);
  return ok(plain(row), { status: 201 });
});
