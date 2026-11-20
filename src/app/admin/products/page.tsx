'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import a from '@/components/admin/admin.module.css';
import { PageHeader, kd, useAdminApi } from '@/components/admin/ui';
import { useAdminToast } from '@/components/admin/AdminShell';

interface Row {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  images: string[];
  collection: string | null;
  isActive: boolean;
  isFeatured: boolean;
  isRecommended: boolean;
  priceFromKWD: number;
  totalStock: number;
  soldCount: number;
  variants: { label: string; stock: number }[];
}

export default function AdminProductsPage() {
  const call = useAdminApi();
  const toast = useAdminToast();
  const params = useSearchParams();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(params.get('status') ?? '');

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}) });
    setRows((await call<Row[]>(`/api/admin/products?${qs}`)) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const toggle = async (row: Row, key: 'isActive' | 'isFeatured' | 'isRecommended') => {
    const value = !row[key];
    setRows((rs) => rs?.map((r) => (r.id === row.id ? { ...r, [key]: value } : r)) ?? null);
    const res = await call(`/api/admin/products/${row.id}`, { method: 'PATCH', body: { [key]: value } });
    if (!res) void load();
    else toast('Saved');
  };

  return (
    <>
      <PageHeader
        title="Products"
        description="Featured = homepage “Luxury Line”. Recommended = homepage “Recommended For You”. Inactive products are hidden from the store."
        actions={
          <Link href="/admin/products/new" className={a.btnGold}>
            + New product
          </Link>
        }
      />
      <div className={a.toolbar}>
        <input className={a.input} placeholder="Search name, slug or SKU…" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 260 }} />
        <select className={a.select} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All products</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="low-stock">Low stock (≤ 5)</option>
        </select>
      </div>
      <div className={a.tableWrap}>
        {rows === null ? (
          <div className="spinner" />
        ) : rows.length === 0 ? (
          <p className={a.empty}>No products found.</p>
        ) : (
          <table className={a.table}>
            <thead>
              <tr>
                <th />
                <th>Product</th>
                <th>Collection</th>
                <th>Price from</th>
                <th>Stock</th>
                <th>Sold</th>
                <th>Active</th>
                <th>Featured</th>
                <th>Recommended</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {r.images[0] && <img src={r.images[0]} alt="" className={a.thumb} />}
                  </td>
                  <td>
                    <Link href={`/admin/products/${r.id}`} className={a.link}>
                      {r.nameEn}
                    </Link>
                    <div className={a.muted} dir="rtl" style={{ textAlign: 'start' }}>
                      {r.nameAr}
                    </div>
                  </td>
                  <td>{r.collection ?? <span className={a.muted}>—</span>}</td>
                  <td>{kd(r.priceFromKWD)}</td>
                  <td>
                    {r.variants.map((v) => (
                      <div key={v.label} className={a.muted}>
                        {v.label}: <strong style={{ color: v.stock === 0 ? '#a5352a' : v.stock <= 5 ? 'var(--gold-dark)' : 'inherit' }}>{v.stock}</strong>
                      </div>
                    ))}
                  </td>
                  <td>{r.soldCount}</td>
                  {(['isActive', 'isFeatured', 'isRecommended'] as const).map((k) => (
                    <td key={k}>
                      <label className={a.check}>
                        <input type="checkbox" checked={r[k]} onChange={() => toggle(r, k)} aria-label={`${k} ${r.nameEn}`} />
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
