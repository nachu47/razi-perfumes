'use client';
import { useCallback, useEffect, useState } from 'react';
import a from '@/components/admin/admin.module.css';
import { PageHeader, useAdminApi } from '@/components/admin/ui';
import { useAdminToast } from '@/components/admin/AdminShell';

interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
}

export default function AdminSubscribersPage() {
  const call = useAdminApi();
  const toast = useAdminToast();
  const [rows, setRows] = useState<Subscriber[] | null>(null);
  const [q, setQ] = useState('');

  const load = useCallback(async () => setRows((await call<Subscriber[]>('/api/admin/subscribers')) ?? []), [call]);
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const remove = async (s: Subscriber) => {
    if (!confirm(`Remove ${s.email} from the newsletter list?`)) return;
    if (await call(`/api/admin/subscribers/${s.id}`, { method: 'DELETE' })) {
      toast('Subscriber removed');
      void load();
    }
  };

  const shown = rows?.filter((r) => r.email.includes(q.toLowerCase())) ?? null;

  return (
    <>
      <PageHeader
        title="Newsletter"
        description={rows ? `${rows.length} subscribers from the footer signup form.` : undefined}
        actions={
          <a href="/api/admin/subscribers?format=csv" className={a.btnGold}>
            Export CSV
          </a>
        }
      />
      <div className={a.toolbar}>
        <input className={a.input} placeholder="Filter by email" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 240 }} />
      </div>
      <div className={a.tableWrap}>
        {shown === null ? (
          <div className="spinner" />
        ) : shown.length === 0 ? (
          <p className={a.empty}>No subscribers yet.</p>
        ) : (
          <table className={a.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Subscribed</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((s) => (
                <tr key={s.id}>
                  <td>{s.email}</td>
                  <td>{new Date(s.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  <td style={{ textAlign: 'end' }}>
                    <button className={a.btnDanger} onClick={() => remove(s)}>
                      Remove
                    </button>
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
