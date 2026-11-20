'use client';
import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import a from '@/components/admin/admin.module.css';
import { PageHeader, StatusChip, useAdminApi } from '@/components/admin/ui';
import { useAdminToast } from '@/components/admin/AdminShell';
import { formatMoney } from '@/lib/money';
import { getCountry } from '@/lib/countries';
import type { OrderDTO } from '@/lib/order-dto';

type AdminOrder = OrderDTO & { customer: { id: string; name: string | null; email: string } | null; paymentProvider: string | null; locale: string };

export default function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const call = useAdminApi();
  const toast = useAdminToast();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [orderStatus, setOrderStatus] = useState('');
  const [note, setNote] = useState('');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const o = await call<AdminOrder>(`/api/admin/orders/${id}`);
    if (o) {
      setOrder(o);
      setOrderStatus(o.orderStatus);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => {
    void load();
  }, [load]);

  if (!order) return <div className="spinner" />;
  const m = (n: number) => formatMoney(n, order.currency);
  const addr = order.shippingAddress as Record<string, string>;

  const update = async (body: Record<string, unknown>, success: string) => {
    setBusy(true);
    const res = await call<OrderDTO>(`/api/admin/orders/${id}`, { method: 'PATCH', body: { ...body, note: note || null, notify } });
    setBusy(false);
    if (res) {
      toast(success);
      setNote('');
      void load();
    }
  };

  return (
    <>
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed ${new Date(order.createdAt).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })} · ${order.locale === 'ar' ? 'Arabic' : 'English'} storefront`}
        actions={
          <>
            <Link href="/admin/orders" className={a.btnGhost}>
              Back
            </Link>
            <a href={`/admin/orders/${id}/invoice`} target="_blank" rel="noopener" className={a.btn}>
              Print invoice
            </a>
          </>
        }
      />

      <div className={a.cols2}>
        <div>
          <div className={a.panel} style={{ marginTop: 0 }}>
            <div className={a.panelTitle}>Items</div>
            <table className={a.table}>
              <thead>
                <tr>
                  <th />
                  <th>Product</th>
                  <th>Unit</th>
                  <th>Qty</th>
                  <th style={{ textAlign: 'end' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {i.image && <img src={i.image} alt="" className={a.thumb} />}
                    </td>
                    <td>
                      {i.productId ? (
                        <Link href={`/admin/products/${i.productId}`} className={a.link}>
                          {i.name}
                        </Link>
                      ) : (
                        i.name
                      )}
                      <div className={a.muted}>{i.sizeLabel}</div>
                    </td>
                    <td>{m(i.unitPrice)}</td>
                    <td>{i.quantity}</td>
                    <td style={{ textAlign: 'end' }}>{m(i.unitPrice * i.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ maxWidth: 320, marginInlineStart: 'auto', marginTop: 14, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{m(order.subtotal)}</span></div>
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Discount {order.couponCode && `(${order.couponCode})`}</span><span>- {m(order.discount)}</span></div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Shipping</span><span>{order.shippingFee > 0 ? m(order.shippingFee) : 'Free'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--light-gray)', marginTop: 6, paddingTop: 6 }}>
                <span>Total</span>
                <span>{m(order.total)}</span>
              </div>
            </div>
          </div>

          <div className={a.panel}>
            <div className={a.panelTitle}>Timeline</div>
            <ol className={a.timeline}>
              {order.events.map((e, i) => (
                <li key={i}>
                  <StatusChip status={e.status} /> <span className={a.muted}>{new Date(e.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  {e.note && <div className={a.muted} style={{ marginTop: 4 }}>{e.note}</div>}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div>
          <div className={a.panel} style={{ marginTop: 0 }}>
            <div className={a.panelTitle}>Status</div>
            <p style={{ marginBottom: 12 }}>
              <StatusChip status={order.orderStatus} /> <StatusChip status={order.paymentStatus} /> <span className={a.muted}>{order.paymentMethod}{order.paymentProvider ? ` via ${order.paymentProvider}` : ''}</span>
            </p>
            {order.paymentReference && <p className={a.muted} style={{ marginBottom: 12 }}>Payment ref: {order.paymentReference}</p>}
            <div className={a.field}>
              <span className={a.label}>Fulfilment status</span>
              <select className={a.select} value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)}>
                {['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className={a.field} style={{ marginTop: 10 }}>
              <span className={a.label}>Note (optional — included in the customer email)</span>
              <textarea className={a.textarea} style={{ minHeight: 60 }} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="e.g. Tracking number 123…" />
            </div>
            <label className={a.check} style={{ marginTop: 10 }}>
              <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Email the customer about this change
            </label>
            <div className={a.formActions} style={{ justifyContent: 'flex-start' }}>
              <button className={a.btnGold} disabled={busy || orderStatus === order.orderStatus} onClick={() => update({ orderStatus }, 'Order status updated')}>
                Update status
              </button>
            </div>
            <hr style={{ border: 0, borderTop: '1px solid var(--light-gray)', margin: '16px 0' }} />
            <div className={a.toolbar}>
              {order.paymentMethod === 'COD' && order.paymentStatus !== 'PAID' && order.orderStatus !== 'CANCELLED' && (
                <button className={a.btn} disabled={busy} onClick={() => update({ paymentStatus: 'PAID' }, 'Marked as paid')}>
                  Mark COD as paid
                </button>
              )}
              {order.paymentStatus === 'PAID' && (
                <button
                  className={a.btnDanger}
                  disabled={busy}
                  onClick={() => confirm('Mark this order as refunded? Issue the refund in your payment gateway / cash first.') && update({ paymentStatus: 'REFUNDED' }, 'Marked as refunded')}
                >
                  Mark as refunded
                </button>
              )}
            </div>
          </div>

          <div className={a.panel}>
            <div className={a.panelTitle}>Customer</div>
            <p style={{ fontSize: 13, lineHeight: 1.7 }}>
              {order.customer ? (
                <Link href={`/admin/customers/${order.customer.id}`} className={a.link}>
                  {order.customer.name || order.customer.email}
                </Link>
              ) : (
                <span className={a.chip}>GUEST</span>
              )}
              <br />
              <a href={`mailto:${order.email}`} className={a.link}>{order.email}</a>
              <br />
              <a href={`tel:${order.phone}`}>{order.phone}</a>
            </p>
          </div>

          <div className={a.panel}>
            <div className={a.panelTitle}>Shipping address</div>
            <p style={{ fontSize: 13, lineHeight: 1.7 }}>
              <strong>{addr.fullName}</strong> · {addr.phone}
              <br />
              {[addr.area, addr.block && `Block ${addr.block}`, addr.street && `Street ${addr.street}`, addr.building && `Building ${addr.building}`, addr.floor && `Floor ${addr.floor}`, addr.apartment && `Apt ${addr.apartment}`].filter(Boolean).join(', ')}
              <br />
              {addr.city}, {getCountry(order.country).nameEn}
              {addr.notes && (
                <>
                  <br />
                  <em className={a.muted}>Notes: {addr.notes}</em>
                </>
              )}
            </p>
            {order.notes && <p className={a.muted}>Order notes: {order.notes}</p>}
          </div>
        </div>
      </div>
    </>
  );
}
