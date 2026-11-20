'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import a from '@/components/admin/admin.module.css';
import { PageHeader, StatusChip, useAdminApi } from '@/components/admin/ui';
import { formatMoney } from '@/lib/money';
import type { OrderDTO } from '@/lib/order-dto';

export default function AdminOrdersPage() {
  const call = useAdminApi();
  const params = useSearchParams();
  const [filters, setFilters] = useState({ q: '', status: '', payment: '', method: '', from: '', to: '', userId: params.get('userId') ?? '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: OrderDTO[]; total: number; pageCount: number } | null>(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams(Object.entries({ ...filters, page: String(page) }).filter(([, v]) => v));
    setData(await call(`/api/admin/orders?${qs}`));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const set = (k: keyof typeof filters) => (e: { target: { value: string } }) => {
    setPage(1);
    setFilters({ ...filters, [k]: e.target.value });
  };

  return (
    <>
      <PageHeader title="Orders" description="Click an order to update its status, mark Cash-on-Delivery orders as paid, record refunds or print an invoice." />
      <div className={a.toolbar}>
        <input className={a.input} placeholder="Order #, email or phone" value={filters.q} onChange={set('q')} style={{ minWidth: 220 }} />
        <select className={a.select} value={filters.status} onChange={set('status')} aria-label="Order status">
          <option value="">All statuses</option>
          {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className={a.select} value={filters.payment} onChange={set('payment')} aria-label="Payment status">
          <option value="">All payments</option>
          {['PENDING', 'PAID', 'FAILED', 'REFUNDED'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select className={a.select} value={filters.method} onChange={set('method')} aria-label="Payment method">
          <option value="">All methods</option>
          {['COD', 'KNET', 'CARD', 'APPLE_PAY'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input className={a.input} type="date" value={filters.from} onChange={set('from')} aria-label="From date" />
        <input className={a.input} type="date" value={filters.to} onChange={set('to')} aria-label="To date" />
        {filters.userId && (
          <button className={a.btnGhost} onClick={() => setFilters({ ...filters, userId: '' })}>
            Customer filter ✕
          </button>
        )}
      </div>
      <div className={a.tableWrap}>
        {data === null ? (
          <div className="spinner" />
        ) : data.items.length === 0 ? (
          <p className={a.empty}>No orders match these filters.</p>
        ) : (
          <table className={a.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className={a.link}>
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td>{new Date(o.createdAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>
                    {String(o.shippingAddress.fullName ?? '')}
                    <div className={a.muted}>{o.email}</div>
                  </td>
                  <td>{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td>
                    <StatusChip status={o.orderStatus} />
                  </td>
                  <td>
                    <StatusChip status={o.paymentStatus} /> <span className={a.muted}>{o.paymentMethod}</span>
                  </td>
                  <td>{formatMoney(o.total, o.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {data && data.pageCount > 1 && (
        <div className={a.toolbar} style={{ justifyContent: 'space-between', marginTop: 16 }}>
          <button className={a.btnGhost} disabled={page <= 1} onClick={() => setPage(page - 1)}>
            ← Previous
          </button>
          <span className={a.muted}>
            Page {page} of {data.pageCount} · {data.total} orders
          </span>
          <button className={a.btnGhost} disabled={page >= data.pageCount} onClick={() => setPage(page + 1)}>
            Next →
          </button>
        </div>
      )}
    </>
  );
}
