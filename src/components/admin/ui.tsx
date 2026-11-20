'use client';
import { useRef, useState, type ReactNode } from 'react';
import a from './admin.module.css';
import { useAdminToast } from './AdminShell';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className={a.topbar}>
      <div>
        <h1 className={a.h1}>{title}</h1>
        {description && <p className={a.desc}>{description}</p>}
      </div>
      {actions && <div className={a.toolbar} style={{ marginBottom: 0 }}>{actions}</div>}
    </div>
  );
}

export function StatusChip({ status }: { status: string }) {
  const cls = ['DELIVERED', 'PAID', 'CONFIRMED', 'ACTIVE', 'APPROVED'].includes(status)
    ? a.chipGreen
    : ['CANCELLED', 'FAILED', 'REFUNDED', 'INACTIVE'].includes(status)
      ? a.chipRed
      : ['SHIPPED', 'PROCESSING'].includes(status)
        ? a.chipBlue
        : a.chipGold;
  return <span className={`${a.chip} ${cls}`}>{status.replace(/_/g, ' ')}</span>;
}

export function kd(n: number) {
  return `${n.toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} KD`;
}

/** Upload one or more images to /api/admin/upload and report their URLs. */
export function ImageUploader({ onUploaded, folder = 'products', multiple = true, label = '+ Upload image' }: { onUploaded: (urls: string[]) => void; folder?: string; multiple?: boolean; label?: string }) {
  const toast = useAdminToast();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const json = await res.json().catch(() => null);
      if (json?.ok) urls.push(json.data.url);
      else toast(json?.error || `Upload failed: ${file.name}`, 'error');
    }
    setBusy(false);
    if (ref.current) ref.current.value = '';
    if (urls.length) onUploaded(urls);
  };
  return (
    <label className={a.uploadTile} aria-busy={busy}>
      {busy ? 'Uploading…' : label}
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={multiple} hidden onChange={(e) => upload(e.target.files)} />
    </label>
  );
}

/** Single image field: preview + upload + URL text input. */
export function ImageField({ value, onChange, folder }: { value: string; onChange: (v: string) => void; folder?: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      {value ? (
        <div className={a.imageTile}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" />
          <button type="button" onClick={() => onChange('')} aria-label="Remove image">
            ✕
          </button>
        </div>
      ) : (
        <ImageUploader folder={folder} multiple={false} onUploaded={(u) => onChange(u[0])} />
      )}
      <input className={a.input} style={{ flex: 1 }} value={value} onChange={(e) => onChange(e.target.value)} placeholder="…or paste an image URL" />
    </div>
  );
}

/** Small helper for admin JSON calls that shows errors as toasts. */
export function useAdminApi() {
  const toast = useAdminToast();
  return async function call<T>(url: string, opts: { method?: string; body?: unknown } = {}): Promise<T | null> {
    const res = await fetch(url, {
      method: opts.method ?? (opts.body ? 'POST' : 'GET'),
      headers: opts.body ? { 'content-type': 'application/json' } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: 'no-store',
    });
    const json = await res.json().catch(() => null);
    if (!json?.ok) {
      toast(json?.error || `Request failed (${res.status})`, 'error');
      return null;
    }
    return json.data as T;
  };
}
