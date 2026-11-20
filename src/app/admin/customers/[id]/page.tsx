'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import a from '@/components/admin/admin.module.css';
import { PageHeader, StatusChip, useAdminApi } from '@/components/admin/ui';
import { formatMoney } from '@/lib/money';
import { getCountry } from '@/lib/countries';
import type { OrderDTO } from '@/lib/order-dto';

interface CustomerDetail {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  emailVerified: string | null;
  addresses: { id: string; fullName: string; phone: string; country: string; city: string; area: string; block: string | null; street: string; building: string; isDefault: boolean }[];
  orders: OrderDTO[];
  _count: { wishlistItems: number; reviews: number };
}

export default function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const call = useAdminApi();
  const [c, setC] = useState<CustomerDetail | null>(null);
  useEffect(() => {
    void call<CustomerDetail>(`/api/admin/customers/${id}`).then(setC);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  if (!c) return <div className="spinner" />;

  return (
    <>
      <PageHeader
        title={c.name || c.email}
        description={`Customer since ${new Date(c.createdAt).toLocaleDateString('en-GB', { dateStyle: 'long' })}`}
        actions={
          <Link href="/admin/customers" className={a.btnGhost}>
            Back
          </Link>
        }
      />
      <div className={a.grid4}>
        <div className={a.stat}>
          <div className={a.statLabel}>Email</div>
          <div style={{ marginTop: 6, fontSize: 13 }}>
            <a href={`mailto:${c.email}`} className={a.link}>{c.email}</a> {c.emailVerified ? '✓ verified' : '(unverified)'}
          </div>
        </div>
        <div className={a.stat}>
          <div className={a.statLabel}>Phone</div>
          <div style={{ marginTop: 6, fontSize: 13 }}>{c.phone || '—'}</div>
        </div>
        <div className={a.stat}>
          <div className={a.statLabel}>Orders</div>
          <div className={a.statValue}>{c.orders.length}</div>
        </div>
        <div className={a.stat}>
          <div className={a.statLabel}>Wishlist / reviews</div>
          <div className={a.statValue}>
            {c._count.wishlistItems} / {c._count.reviews}
          </div>
        </div>
      </div>

      <div className={a.panel}>
        <div className={a.panelTitle}>Orders</div>
        {c.orders.length === 0 ? (
          <p className={a.empty}>No orders yet.</p>
        ) : (
          <table className={a.table}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {c.orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link href={`/admin/orders/${o.id}`} className={a.link}>{o.orderNumber}</Link>
                  </td>
                  <td>{new Date(o.createdAt).toLocaleDateString('en-GB')}</td>
                  <td><StatusChip status={o.orderStatus} /></td>
                  <td><StatusChip status={o.paymentStatus} /> <span className={a.muted}>{o.paymentMethod}</span></td>
                  <td>{formatMoney(o.total, o.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={a.panel}>
        <div className={a.panelTitle}>Address book</div>
        {c.addresses.length === 0 ? (
          <p className={a.empty}>No saved addresses.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
            {c.addresses.map((ad) => (
              <div key={ad.id} className={a.stat} style={{ fontSize: 13, lineHeight: 1.6 }}>
                {ad.isDefault && <span className={`${a.chip} ${a.chipGold}`}>DEFAULT</span>}
                <div><strong>{ad.fullName}</strong> · {ad.phone}</div>
                <div>{[ad.area, ad.block && `Block ${ad.block}`, ad.street, ad.building].filter(Boolean).join(', ')}</div>
                <div>{ad.city}, {getCountry(ad.country).nameEn}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
