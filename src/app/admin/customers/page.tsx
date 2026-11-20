'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import a from '@/components/admin/admin.module.css';
import { PageHeader, kd, useAdminApi } from '@/components/admin/ui';

interface Customer {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  createdAt: string;
  emailVerified: string | null;
  orders: number;
  spentKWD: number;
}

export default function AdminCustomersPage() {
  const call = useAdminApi();
  const [rows, setRows] = useState<Customer[] | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    const t = setTimeout(async () => setRows((await call<Customer[]>(`/api/admin/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`)) ?? []), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <>
      <PageHeader title="Customers" description="Registered accounts. Guest orders appear under Orders." />
      <div className={a.toolbar}>
        <input className={a.input} placeholder="Search name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 260 }} />
      </div>
      <div className={a.tableWrap}>
        {rows === null ? (
          <div className="spinner" />
        ) : rows.length === 0 ? (
          <p className={a.empty}>No customers found.</p>
        ) : (
          <table className={a.table}>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Orders</th>
                <th>Spent</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/admin/customers/${c.id}`} className={a.link}>
                      {c.name || '—'}
                    </Link>
                    <div className={a.muted}>
                      {c.email} {c.emailVerified && '✓'}
                    </div>
                  </td>
                  <td>{c.phone || <span className={a.muted}>—</span>}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString('en-GB')}</td>
                  <td>{c.orders}</td>
                  <td>{kd(c.spentKWD)}</td>
                  <td>
                    <span className={`${a.chip} ${c.role === 'ADMIN' ? a.chipGold : ''}`}>{c.role}</span>
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
