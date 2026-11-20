'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import a from './admin.module.css';
import { ImageField, PageHeader, useAdminApi } from './ui';
import { useAdminToast } from './AdminShell';
import { RESOURCES, type FieldDef } from '@/lib/admin/resources';

type Row = Record<string, unknown>;

function displayCell(f: FieldDef | undefined, key: string, v: unknown) {
  if (v === null || v === undefined || v === '') return <span className={a.muted}>—</span>;
  if (typeof v === 'boolean') return <span className={`${a.chip} ${v ? a.chipGreen : a.chipRed}`}>{v ? 'YES' : 'NO'}</span>;
  if (f?.type === 'image' || key.startsWith('image')) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={String(v)} alt="" className={a.thumb} />;
  }
  if (f?.type === 'datetime' || key === 'updatedAt' || key === 'createdAt') return new Date(String(v)).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  const s = String(v);
  return <span dir={f?.dir}>{s.length > 60 ? `${s.slice(0, 60)}…` : s}</span>;
}

function toInputValue(f: FieldDef, v: unknown): string | boolean {
  if (f.type === 'bool') return Boolean(v);
  if (v === null || v === undefined) return '';
  if (f.type === 'datetime') {
    const d = new Date(String(v));
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  return String(v);
}

export default function ResourceManager({ resource }: { resource: string }) {
  const def = RESOURCES[resource];
  const call = useAdminApi();
  const toast = useAdminToast();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<{ id: string | null; values: Record<string, string | boolean> } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setRows((await call<Row[]>(`/api/admin/resources/${resource}${q ? `?q=${encodeURIComponent(q)}` : ''}`)) ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, q]);
  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  if (!def) return <p className={a.empty}>Unknown section.</p>;
  const fieldsByName = Object.fromEntries(def.fields.map((f) => [f.name, f]));

  const openNew = () =>
    setEditing({ id: null, values: Object.fromEntries(def.fields.map((f) => [f.name, f.type === 'bool' ? f.name === 'isActive' : f.type === 'int' ? '0' : ''])) });
  const openEdit = (row: Row) =>
    setEditing({ id: String(row[def.idField]), values: Object.fromEntries(def.fields.map((f) => [f.name, toInputValue(f, row[f.name])])) });

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const body: Record<string, unknown> = {};
    for (const f of def.fields) {
      if (editing.id && f.readOnlyOnEdit) continue;
      const v = editing.values[f.name];
      body[f.name] = f.type === 'datetime' && v ? new Date(String(v)).toISOString() : v;
    }
    const res = await call(editing.id ? `/api/admin/resources/${resource}/${encodeURIComponent(editing.id)}` : `/api/admin/resources/${resource}`, {
      method: editing.id ? 'PUT' : 'POST',
      body,
    });
    setSaving(false);
    if (res) {
      toast(`${def.singular} saved`);
      setEditing(null);
      void load();
    }
  };

  const remove = async (row: Row) => {
    if (!confirm(`Delete this ${def.singular.toLowerCase()}?`)) return;
    if (await call(`/api/admin/resources/${resource}/${encodeURIComponent(String(row[def.idField]))}`, { method: 'DELETE' })) {
      toast(`${def.singular} deleted`);
      void load();
    }
  };

  const input = (f: FieldDef) => {
    const v = editing!.values[f.name];
    const set = (val: string | boolean) => setEditing({ ...editing!, values: { ...editing!.values, [f.name]: val } });
    const disabled = Boolean(editing!.id && f.readOnlyOnEdit);
    switch (f.type) {
      case 'bool':
        return (
          <label className={a.check}>
            <input type="checkbox" checked={Boolean(v)} onChange={(e) => set(e.target.checked)} /> {f.label}
          </label>
        );
      case 'select':
        return (
          <select className={a.select} value={String(v)} onChange={(e) => set(e.target.value)} required={f.required} disabled={disabled}>
            <option value="">— Select —</option>
            {f.options!.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );
      case 'textarea':
        return <textarea className={a.textarea} dir={f.dir} value={String(v)} onChange={(e) => set(e.target.value)} required={f.required} />;
      case 'longtext':
        return <textarea className={`${a.textarea} ${a.long}`} dir={f.dir} value={String(v)} onChange={(e) => set(e.target.value)} required={f.required} />;
      case 'image':
        return <ImageField value={String(v)} onChange={set} folder={resource} />;
      case 'datetime':
        return <input className={a.input} type="datetime-local" value={String(v)} onChange={(e) => set(e.target.value)} />;
      case 'int':
        return <input className={a.input} type="number" step={1} min={0} value={String(v)} onChange={(e) => set(e.target.value)} required={f.required} />;
      case 'decimal':
        return <input className={a.input} type="number" step="0.000001" min={0} value={String(v)} onChange={(e) => set(e.target.value)} required={f.required} />;
      default:
        return <input className={a.input} dir={f.dir} value={String(v)} onChange={(e) => set(e.target.value)} required={f.required} disabled={disabled} />;
    }
  };

  return (
    <>
      <PageHeader
        title={def.title}
        description={def.description}
        actions={
          def.canCreate !== false && (
            <button className={a.btnGold} onClick={openNew}>
              + New {def.singular.toLowerCase()}
            </button>
          )
        }
      />
      {def.searchable && (
        <div className={a.toolbar}>
          <input className={a.input} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 240 }} />
        </div>
      )}
      <div className={a.tableWrap}>
        {rows === null ? (
          <div className="spinner" />
        ) : rows.length === 0 ? (
          <p className={a.empty}>Nothing here yet.</p>
        ) : (
          <table className={a.table}>
            <thead>
              <tr>
                {def.columns.map((c) => (
                  <th key={c}>{fieldsByName[c]?.label ?? c.replace(/([A-Z])/g, ' $1')}</th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={String(row[def.idField])}>
                  {def.columns.map((c) => (
                    <td key={c}>{displayCell(fieldsByName[c], c, row[c])}</td>
                  ))}
                  <td style={{ whiteSpace: 'nowrap', textAlign: 'end' }}>
                    <button className={a.btnGhost} onClick={() => openEdit(row)}>
                      Edit
                    </button>{' '}
                    {def.canDelete !== false && (
                      <button className={a.btnDanger} onClick={() => remove(row)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div className={a.modalBackdrop} onClick={(e) => e.target === e.currentTarget && setEditing(null)}>
          <form className={a.modal} onSubmit={save}>
            <h2 className={a.h1} style={{ fontSize: 18, marginBottom: 20 }}>
              {editing.id ? `Edit ${def.singular.toLowerCase()}` : `New ${def.singular.toLowerCase()}`}
            </h2>
            <div className={a.form}>
              {def.fields.map((f) => (
                <div key={f.name} className={`${a.field} ${['longtext', 'textarea', 'image'].includes(f.type) ? a.full : ''}`}>
                  {f.type !== 'bool' && (
                    <span className={a.label}>
                      {f.label}
                      {f.required ? ' *' : ''}
                    </span>
                  )}
                  {input(f)}
                  {f.help && <span className={a.help}>{f.help}</span>}
                </div>
              ))}
            </div>
            <div className={a.formActions}>
              <button type="button" className={a.btnGhost} onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className={a.btnGold} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
