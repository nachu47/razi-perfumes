import { prisma } from '@/lib/prisma';
import { handler, ok } from '@/lib/api';
import { requireAdmin } from '@/lib/session';

export const GET = handler(async (req: Request) => {
  await requireAdmin();
  const filter = new URL(req.url).searchParams.get('filter');
  const rows = await prisma.contactMessage.findMany({
    where: filter === 'unread' ? { isRead: false } : {},
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  return ok(rows.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })));
});
