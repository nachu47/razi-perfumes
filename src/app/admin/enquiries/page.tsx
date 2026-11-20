'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import a from '@/components/admin/admin.module.css';
import { PageHeader, StatusChip, useAdminApi } from '@/components/admin/ui';
import { useAdminToast } from '@/components/admin/AdminShell';

interface Enquiry {
  id: string;
  productName: string;
  variantLabel: string | null;
  status: 'NEW' | 'CONTACTED' | 'CLOSED';
  adminNote: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  locale: string;
  createdAt: string;
  guestId: string | null;
  productsViewed: number;
  product: { slug: string; images: string[] } | null;
  user: { id: string; name: string | null; email: string; phone: string | null; lastLoginAt: string | null } | null;
}

const fmt = (iso: string) => new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export default function AdminEnquiriesPage() {
  const call = useAdminApi();
  const toast = useAdminToast();
  const router = useRouter();
  const [status, setStatus] = useState('NEW');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Enquiry[] | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ ...(status ? { status } : {}), ...(q ? { q } : {}) });
    setRows((await call<Enquiry[]>(`/api/admin/enquiries?${qs}`)) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q]);
  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const update = async (e: Enquiry, body: Record<string, unknown>, msg: string) => {
    if (await call(`/api/admin/enquiries/${e.id}`, { method: 'PATCH', body })) {
      toast(msg);
      void load();
      router.refresh(); // sidebar badge
    }
  };
  const remove = async (e: Enquiry) => {
    if (!confirm('Delete this enquiry?')) return;
    if (await call(`/api/admin/enquiries/${e.id}`, { method: 'DELETE' })) {
      toast('Enquiry deleted');
      void load();
      router.refresh();
    }
  };

  return (
    <>
      <PageHeader
        title="WhatsApp enquiries"
        description="Every “Enquire on WhatsApp” click on a product page. Signed-in customers show their account details, last login and browsing activity. Guests are linked to their account automatically if they sign in later."
        actions={
          <Link href="/admin/settings" className={a.btnGhost}>
            WhatsApp settings
          </Link>
        }
      />
      <div className={a.toolbar}>
        <select className={a.select} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="CLOSED">Closed</option>
          <option value="">All</option>
        </select>
        <input className={a.input} placeholder="Product, name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 260 }} />
      </div>
      <div className={a.tableWrap}>
        {rows === null ? (
          <div className="spinner" />
        ) : rows.length === 0 ? (
          <p className={a.empty}>No enquiries here.</p>
        ) : (
          <table className={a.table}>
            <thead>
              <tr>
                <th>When</th>
                <th>Product</th>
                <th>Customer</th>
                <th>Activity</th>
                <th>Status</th>
                <th>Note</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const phone = e.user?.phone || e.phone;
                return (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {fmt(e.createdAt)}
                      <div className={a.muted}>{e.locale === 'ar' ? 'Arabic' : 'English'} site</div>
                    </td>
                    <td style={{ minWidth: 220 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {e.product?.images[0] && <img src={e.product.images[0]} alt="" className={a.thumb} />}
                        <div>
                          {e.product ? (
                            <a href={`/product/${e.product.slug}`} target="_blank" rel="noopener" className={a.link}>
                              {e.productName}
                            </a>
                          ) : (
                            e.productName
                          )}
                          {e.variantLabel && <div className={a.muted}>{e.variantLabel}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ minWidth: 230 }}>
                      {e.user ? (
                        <>
                          <Link href={`/admin/customers/${e.user.id}`} className={a.link}>
                            {e.user.name || e.user.email}
                          </Link>
                          <div className={a.muted}>{e.user.email}</div>
                          {phone && <div className={a.muted}>{phone}</div>}
                          <div className={a.muted}>Last login: {e.user.lastLoginAt ? fmt(e.user.lastLoginAt) : '—'}</div>
                        </>
                      ) : (
                        <>
                          <span className={a.chip}>GUEST</span>
                          <div className={a.muted}>Not signed in</div>
                        </>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className={a.muted}>{e.productsViewed} product{e.productsViewed === 1 ? '' : 's'} viewed</span>
                    </td>
                    <td>
                      <StatusChip status={e.status} />
                    </td>
                    <td style={{ minWidth: 180 }}>
                      <input
                        className={a.input}
                        style={{ width: '100%' }}
                        placeholder="Add a note…"
                        value={notes[e.id] ?? e.adminNote ?? ''}
                        onChange={(ev) => setNotes({ ...notes, [e.id]: ev.target.value })}
                        onBlur={() => notes[e.id] !== undefined && notes[e.id] !== (e.adminNote ?? '') && update(e, { adminNote: notes[e.id] }, 'Note saved')}
                      />
                    </td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'end' }}>
                      {phone && (
                        <a className={a.btnGhost} href={`https://wa.me/${phone.replace(/\D/g, '')}`} target="_blank" rel="noopener">
                          WhatsApp
                        </a>
                      )}{' '}
                      {e.status !== 'CONTACTED' && (
                        <button className={a.btnGold} onClick={() => update(e, { status: 'CONTACTED' }, 'Marked as contacted')}>
                          Contacted
                        </button>
                      )}{' '}
                      {e.status !== 'CLOSED' && (
                        <button className={a.btnGhost} onClick={() => update(e, { status: 'CLOSED' }, 'Enquiry closed')}>
                          Close
                        </button>
                      )}{' '}
                      <button className={a.btnDanger} onClick={() => remove(e)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
