'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import a from '@/components/admin/admin.module.css';
import { PageHeader, StatusChip, useAdminApi } from '@/components/admin/ui';
import { formatMoney } from '@/lib/money';
import { getCountry } from '@/lib/countries';
import type { OrderDTO } from '@/lib/order-dto';

interface ProductRef {
  id: string;
  nameEn: string;
  slug: string;
  image: string | null;
}
interface CustomerDetail {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  emailVerified: string | null;
  lastLoginAt: string | null;
  loginCount: number;
  addresses: { id: string; fullName: string; phone: string; country: string; city: string; area: string; block: string | null; street: string; building: string; isDefault: boolean }[];
  orders: OrderDTO[];
  productViews: { id: string; viewCount: number; lastViewedAt: string; product: ProductRef }[];
  enquiries: { id: string; productName: string; variantLabel: string | null; status: string; adminNote: string | null; createdAt: string }[];
  wishlistItems: { id: string; createdAt: string; product: ProductRef }[];
  _count: { wishlistItems: number; reviews: number };
}

const fmt = (iso: string) => new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

function ProductCell({ p }: { p: ProductRef }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {p.image && <img src={p.image} alt="" className={a.thumb} />}
      <Link href={`/admin/products/${p.id}`} className={a.link}>
        {p.nameEn}
      </Link>
    </div>
  );
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

  const spent = c.orders.filter((o) => o.orderStatus !== 'CANCELLED').reduce((s, o) => s + o.total, 0);
  const waNumber = c.phone?.replace(/\D/g, '');

  return (
    <>
      <PageHeader
        title={c.name || c.email}
        description={`Customer since ${new Date(c.createdAt).toLocaleDateString('en-GB', { dateStyle: 'long' })}`}
        actions={
          <>
            <a href={`mailto:${c.email}`} className={a.btnGhost}>Email</a>
            {waNumber && (
              <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener" className={a.btnGhost}>
                WhatsApp
              </a>
            )}
            <Link href="/admin/customers" className={a.btnGhost}>
              Back
            </Link>
          </>
        }
      />

      <div className={a.grid4}>
        <div className={a.stat}>
          <div className={a.statLabel}>Contact</div>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6 }}>
            {c.email} {c.emailVerified ? '✓' : <span className={a.muted}>(unverified)</span>}
            <br />
            {c.phone || <span className={a.muted}>No phone</span>}
          </div>
        </div>
        <div className={a.stat}>
          <div className={a.statLabel}>Last login</div>
          <div style={{ marginTop: 6, fontSize: 13 }}>{c.lastLoginAt ? fmt(c.lastLoginAt) : '—'}</div>
          <div className={a.muted}>{c.loginCount} sign-in{c.loginCount === 1 ? '' : 's'}</div>
        </div>
        <div className={a.stat}>
          <div className={a.statLabel}>Orders</div>
          <div className={a.statValue}>{c.orders.length}</div>
          <div className={a.muted}>{c.orders.length ? `≈ ${spent.toFixed(3)} (order currencies)` : 'No purchases yet'}</div>
        </div>
        <div className={a.stat}>
          <div className={a.statLabel}>Interest</div>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6 }}>
            {c.productViews.length} products viewed
            <br />
            {c.enquiries.length} WhatsApp enquiries · {c._count.wishlistItems} wishlisted
          </div>
        </div>
      </div>

      <div className={a.cols2}>
        <div className={a.panel}>
          <div className={a.panelTitle}>Recently viewed</div>
          {c.productViews.length === 0 ? (
            <p className={a.empty}>No product views recorded yet.</p>
          ) : (
            <table className={a.table}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Views</th>
                  <th>Last viewed</th>
                </tr>
              </thead>
              <tbody>
                {c.productViews.map((v) => (
                  <tr key={v.id}>
                    <td><ProductCell p={v.product} /></td>
                    <td>{v.viewCount}</td>
                    <td>{fmt(v.lastViewedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <div className={a.panel}>
            <div className={a.panelTitle}>
              WhatsApp enquiries <Link href="/admin/enquiries" className={a.link}>All →</Link>
            </div>
            {c.enquiries.length === 0 ? (
              <p className={a.empty}>No enquiries.</p>
            ) : (
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                {c.enquiries.map((e) => (
                  <li key={e.id}>
                    <strong>{e.productName}</strong> {e.variantLabel && <span className={a.muted}>({e.variantLabel})</span>} <StatusChip status={e.status} />
                    <div className={a.muted}>{fmt(e.createdAt)}{e.adminNote ? ` · ${e.adminNote}` : ''}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={a.panel}>
            <div className={a.panelTitle}>Wishlist</div>
            {c.wishlistItems.length === 0 ? (
              <p className={a.empty}>Empty.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {c.wishlistItems.map((w) => (
                  <ProductCell key={w.id} p={w.product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={a.panel}>
        <div className={a.panelTitle}>
          Orders {c.orders.length > 0 && <Link href={`/admin/orders?userId=${c.id}`} className={a.link}>Filter in orders →</Link>}
        </div>
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
