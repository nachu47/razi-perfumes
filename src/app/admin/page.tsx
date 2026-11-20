import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import a from '@/components/admin/admin.module.css';
import { formatMoney, toNum } from '@/lib/money';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

const kd = (n: number) => formatMoney(n, 'KWD');

// Orders that count as revenue: paid online, or confirmed COD that isn't cancelled/refunded
const revenueWhere = {
  orderStatus: { not: 'CANCELLED' as const },
  paymentStatus: { not: 'REFUNDED' as const },
  OR: [{ paymentStatus: 'PAID' as const }, { paymentMethod: 'COD' as const, stockDeducted: true }],
};

function chip(status: string) {
  const cls = ['DELIVERED', 'PAID', 'CONFIRMED'].includes(status) ? a.chipGreen : ['CANCELLED', 'FAILED', 'REFUNDED'].includes(status) ? a.chipRed : ['SHIPPED', 'PROCESSING'].includes(status) ? a.chipBlue : a.chipGold;
  return <span className={`${a.chip} ${cls}`}>{status}</span>;
}

export default async function AdminDashboard() {
  const now = new Date();
  // Day buckets use UTC dates so the chart is stable regardless of server timezone
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const since30 = new Date(startOfToday.getTime() - 29 * 86400_000);

  const [allTime, today, last30, pendingCount, lowStock, recent, customers] = await Promise.all([
    prisma.order.aggregate({ where: revenueWhere, _sum: { totalKWD: true }, _count: true }),
    prisma.order.aggregate({ where: { createdAt: { gte: startOfToday } }, _count: true, _sum: { totalKWD: true } }),
    prisma.order.findMany({ where: { ...revenueWhere, createdAt: { gte: since30 } }, select: { createdAt: true, totalKWD: true } }),
    prisma.order.count({ where: { orderStatus: { in: ['PENDING', 'CONFIRMED', 'PROCESSING'] } } }),
    prisma.productVariant.findMany({
      where: { stock: { lte: 5 } },
      include: { product: { select: { id: true, nameEn: true } } },
      orderBy: { stock: 'asc' },
      take: 10,
    }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
  ]);
  const [enquiries, newEnquiries] = await Promise.all([
    prisma.enquiry.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { user: { select: { id: true, name: true, email: true } } } }),
    prisma.enquiry.count({ where: { status: 'NEW' } }),
  ]);

  // Revenue per day for the chart (KWD)
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(since30.getTime() + i * 86400_000);
    return { key: d.toISOString().slice(0, 10), label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }), total: 0 };
  });
  for (const o of last30) {
    const day = days.find((d) => d.key === o.createdAt.toISOString().slice(0, 10));
    if (day) day.total += toNum(o.totalKWD);
  }
  const max = Math.max(1, ...days.map((d) => d.total));
  const revenue30 = days.reduce((s, d) => s + d.total, 0);

  const W = 900;
  const H = 200;
  const bw = W / days.length;

  return (
    <>
      <div className={a.topbar}>
        <div>
          <h1 className={a.h1}>Dashboard</h1>
          <p className={a.desc}>All amounts in KWD. Revenue counts paid orders and confirmed Cash-on-Delivery orders.</p>
        </div>
      </div>

      <div className={a.grid4}>
        <div className={a.stat}>
          <div className={a.statLabel}>Total sales</div>
          <div className={a.statValue}>{kd(toNum(allTime._sum.totalKWD))}</div>
          <div className={a.muted}>{allTime._count} orders</div>
        </div>
        <div className={a.stat}>
          <div className={a.statLabel}>Orders today</div>
          <div className={a.statValue}>{today._count}</div>
          <div className={a.muted}>{kd(toNum(today._sum.totalKWD))}</div>
        </div>
        <div className={a.stat}>
          <div className={a.statLabel}>Last 30 days</div>
          <div className={a.statValue}>{kd(revenue30)}</div>
          <div className={a.muted}>{last30.length} orders</div>
        </div>
        <div className={a.stat}>
          <div className={a.statLabel}>To fulfil</div>
          <div className={a.statValue}>{pendingCount}</div>
          <div className={a.muted}>{customers} registered customers · {newEnquiries} new enquiries</div>
        </div>
      </div>

      <div className={a.panel}>
        <div className={a.panelTitle}>Revenue — last 30 days</div>
        <svg viewBox={`0 0 ${W} ${H + 24}`} className={a.chart} role="img" aria-label="Daily revenue bar chart">
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <line key={f} x1={0} x2={W} y1={H - H * f} y2={H - H * f} stroke="var(--light-gray)" strokeDasharray="3 4" />
          ))}
          {days.map((d, i) => {
            const h = (d.total / max) * (H - 10);
            return (
              <g key={d.key}>
                <rect x={i * bw + 3} y={H - h} width={bw - 6} height={Math.max(h, d.total > 0 ? 2 : 0)} rx={3} fill="var(--gold)">
                  <title>{`${d.label}: ${kd(d.total)}`}</title>
                </rect>
                {i % 5 === 0 && (
                  <text x={i * bw + bw / 2} y={H + 16} fontSize="10" textAnchor="middle" fill="var(--mid-gray)">
                    {d.label}
                  </text>
                )}
              </g>
            );
          })}
          <text x={4} y={12} fontSize="10" fill="var(--mid-gray)">
            {kd(max)}
          </text>
        </svg>
      </div>

      <div className={a.cols2}>
        <div className={a.panel}>
          <div className={a.panelTitle}>
            Recent orders <Link href="/admin/orders" className={a.link}>View all →</Link>
          </div>
          {recent.length === 0 ? (
            <p className={a.empty}>No orders yet.</p>
          ) : (
            <div className={a.tableWrap} style={{ border: 'none' }}>
              <table className={a.table}>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Link href={`/admin/orders/${o.id}`} className={a.link}>
                          {o.orderNumber}
                        </Link>
                        <div className={a.muted}>{o.createdAt.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</div>
                      </td>
                      <td>{o.email}</td>
                      <td>{chip(o.orderStatus)}</td>
                      <td>
                        {chip(o.paymentStatus)} <span className={a.muted}>{o.paymentMethod}</span>
                      </td>
                      <td>{formatMoney(toNum(o.total), o.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={a.panel}>
          <div className={a.panelTitle}>
            Low stock <Link href="/admin/products?status=low-stock" className={a.link}>Manage →</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className={a.empty}>All variants have more than 5 in stock.</p>
          ) : (
            <table className={a.table}>
              <tbody>
                {lowStock.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <Link href={`/admin/products/${v.product.id}`} className={a.link}>
                        {v.product.nameEn}
                      </Link>
                      <div className={a.muted}>{v.label}</div>
                    </td>
                    <td style={{ textAlign: 'end' }}>
                      <span className={`${a.chip} ${v.stock === 0 ? a.chipRed : a.chipGold}`}>{v.stock === 0 ? 'OUT' : `${v.stock} left`}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className={a.panel}>
        <div className={a.panelTitle}>
          Latest WhatsApp enquiries <Link href="/admin/enquiries" className={a.link}>View all →</Link>
        </div>
        {enquiries.length === 0 ? (
          <p className={a.empty}>No enquiries yet.</p>
        ) : (
          <table className={a.table}>
            <tbody>
              {enquiries.map((e) => (
                <tr key={e.id}>
                  <td>
                    <strong>{e.productName}</strong> {e.variantLabel && <span className={a.muted}>({e.variantLabel})</span>}
                  </td>
                  <td>
                    {e.user ? (
                      <Link href={`/admin/customers/${e.user.id}`} className={a.link}>
                        {e.user.name || e.user.email}
                      </Link>
                    ) : (
                      <span className={a.chip}>GUEST</span>
                    )}
                  </td>
                  <td className={a.muted}>{e.createdAt.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td style={{ textAlign: 'end' }}>{chip(e.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
