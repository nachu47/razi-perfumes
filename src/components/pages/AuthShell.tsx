import type { ReactNode } from 'react';
import s from '@/styles/page.module.css';

/** Centered card layout used by sign-in / register / password pages. */
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className={`${s.container} ${s.tiny}`}>
      <div className={s.center} style={{ marginBottom: 32 }}>
        <h1 className={s.title}>{title}</h1>
        {subtitle && <p className={s.subtitle} style={{ marginBottom: 0 }}>{subtitle}</p>}
      </div>
      <div className={s.cardWhite}>{children}</div>
    </div>
  );
}
