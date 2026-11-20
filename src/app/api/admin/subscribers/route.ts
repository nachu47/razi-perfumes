import { prisma } from '@/lib/prisma';
import { handler, ok } from '@/lib/api';
import { requireAdmin } from '@/lib/session';

// GET /api/admin/subscribers            → JSON list
// GET /api/admin/subscribers?format=csv → CSV download
export const GET = handler(async (req: Request) => {
  await requireAdmin();
  const rows = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' } });
  if (new URL(req.url).searchParams.get('format') === 'csv') {
    // Quote every cell and neutralise spreadsheet formulas (CSV injection)
    const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;
    const csv = ['email,subscribed_at', ...rows.map((r) => `${cell(r.email)},${cell(r.createdAt.toISOString())}`)].join('\r\n');
    return new Response(csv, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="razi-newsletter-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }
  return ok(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});
