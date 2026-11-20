'use client';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import a from '@/components/admin/admin.module.css';
import { PageHeader, useAdminApi } from '@/components/admin/ui';
import { useAdminToast } from '@/components/admin/AdminShell';

interface Message {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminMessagesPage() {
  const call = useAdminApi();
  const toast = useAdminToast();
  const router = useRouter();
  const [filter, setFilter] = useState('');
  const [rows, setRows] = useState<Message[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows((await call<Message[]>(`/api/admin/messages${filter ? `?filter=${filter}` : ''}`)) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);
  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (m: Message, isRead: boolean) => {
    if (await call(`/api/admin/messages/${m.id}`, { method: 'PATCH', body: { isRead } })) {
      setRows((rs) => rs?.map((r) => (r.id === m.id ? { ...r, isRead } : r)) ?? null);
      router.refresh();
    }
  };
  const toggle = (m: Message) => {
    setOpen(open === m.id ? null : m.id);
    if (!m.isRead) void markRead(m, true);
  };
  const remove = async (m: Message) => {
    if (!confirm('Delete this message?')) return;
    if (await call(`/api/admin/messages/${m.id}`, { method: 'DELETE' })) {
      toast('Message deleted');
      void load();
      router.refresh();
    }
  };

  return (
    <>
      <PageHeader title="Messages" description="Submissions from the Contact Us form. Each one is also emailed to the admin address." />
      <div className={a.toolbar}>
        <select className={a.select} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All messages</option>
          <option value="unread">Unread</option>
        </select>
      </div>
      <div className={a.tableWrap}>
        {rows === null ? (
          <div className="spinner" />
        ) : rows.length === 0 ? (
          <p className={a.empty}>Inbox is empty.</p>
        ) : (
          <table className={a.table}>
            <tbody>
              {rows.map((m) => (
                <Fragment key={m.id}>
                  <tr style={{ cursor: 'pointer', fontWeight: m.isRead ? 400 : 700 }} onClick={() => toggle(m)}>
                    <td style={{ width: 12 }}>{!m.isRead && <span className={a.badge}>●</span>}</td>
                    <td>
                      {m.name}
                      <div className={a.muted}>{m.email}</div>
                    </td>
                    <td>{m.subject}</td>
                    <td className={a.muted} style={{ whiteSpace: 'nowrap' }}>{new Date(m.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  </tr>
                  {open === m.id && (
                    <tr>
                      <td />
                      <td colSpan={3} style={{ background: 'var(--cream)' }}>
                        <p style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.7 }}>{m.message}</p>
                        <div className={a.toolbar} style={{ marginTop: 12, marginBottom: 0 }}>
                          <a className={a.btnGold} href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}>Reply by email</a>
                          {m.phone && <a className={a.btnGhost} href={`tel:${m.phone}`}>Call {m.phone}</a>}
                          <button className={a.btnGhost} onClick={() => markRead(m, false)}>Mark unread</button>
                          <button className={a.btnDanger} onClick={() => remove(m)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
