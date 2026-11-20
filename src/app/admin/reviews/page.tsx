'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import a from '@/components/admin/admin.module.css';
import { PageHeader, useAdminApi } from '@/components/admin/ui';
import { useAdminToast } from '@/components/admin/AdminShell';

interface Review {
  id: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  product: { nameEn: string; slug: string };
  user: { name: string | null; email: string };
}

export default function AdminReviewsPage() {
  const call = useAdminApi();
  const toast = useAdminToast();
  const router = useRouter();
  const [status, setStatus] = useState('pending');
  const [rows, setRows] = useState<Review[] | null>(null);

  const load = useCallback(async () => {
    setRows((await call<Review[]>(`/api/admin/reviews?status=${status}`)) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
  useEffect(() => {
    void load();
  }, [load]);

  const setApproved = async (r: Review, isApproved: boolean) => {
    if (await call(`/api/admin/reviews/${r.id}`, { method: 'PATCH', body: { isApproved } })) {
      toast(isApproved ? 'Review approved — now visible on the product page' : 'Review hidden');
      void load();
      router.refresh(); // update sidebar badge
    }
  };
  const remove = async (r: Review) => {
    if (!confirm('Delete this review permanently?')) return;
    if (await call(`/api/admin/reviews/${r.id}`, { method: 'DELETE' })) {
      toast('Review deleted');
      void load();
      router.refresh();
    }
  };

  return (
    <>
      <PageHeader title="Reviews" description="Customer reviews are hidden until you approve them." />
      <div className={a.toolbar}>
        <select className={a.select} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Awaiting approval</option>
          <option value="approved">Approved</option>
          <option value="">All</option>
        </select>
      </div>
      <div className={a.tableWrap}>
        {rows === null ? (
          <div className="spinner" />
        ) : rows.length === 0 ? (
          <p className={a.empty}>No reviews here.</p>
        ) : (
          <table className={a.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Customer</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/product/${r.product.slug}`} target="_blank" className={a.link}>
                      {r.product.nameEn}
                    </Link>
                  </td>
                  <td style={{ color: 'var(--gold)', whiteSpace: 'nowrap' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
                  <td style={{ maxWidth: 380 }}>{r.comment}</td>
                  <td>
                    {r.user.name || '—'}
                    <div className={a.muted}>{r.user.email}</div>
                  </td>
                  <td>{new Date(r.createdAt).toLocaleDateString('en-GB')}</td>
                  <td style={{ whiteSpace: 'nowrap', textAlign: 'end' }}>
                    {r.isApproved ? (
                      <button className={a.btnGhost} onClick={() => setApproved(r, false)}>Hide</button>
                    ) : (
                      <button className={a.btnGold} onClick={() => setApproved(r, true)}>Approve</button>
                    )}{' '}
                    <button className={a.btnDanger} onClick={() => remove(r)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
