'use client';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import a from './admin.module.css';

type ToastFn = (message: string, kind?: 'success' | 'error') => void;
const ToastContext = createContext<ToastFn>(() => {});
export const useAdminToast = () => useContext(ToastContext);

const NAV: { group: string; links: { href: string; label: string; badge?: 'messages' | 'reviews' | 'enquiries' }[] }[] = [
  { group: 'OVERVIEW', links: [{ href: '/admin', label: 'Dashboard' }] },
  {
    group: 'SALES',
    links: [
      { href: '/admin/orders', label: 'Orders' },
      { href: '/admin/enquiries', label: 'WhatsApp enquiries', badge: 'enquiries' },
      { href: '/admin/customers', label: 'Customers' },
      { href: '/admin/resources/coupons', label: 'Coupons' },
    ],
  },
  {
    group: 'CATALOG',
    links: [
      { href: '/admin/products', label: 'Products' },
      { href: '/admin/resources/collections', label: 'Collections' },
      { href: '/admin/reviews', label: 'Reviews', badge: 'reviews' },
    ],
  },
  {
    group: 'STORE SETTINGS',
    links: [
      { href: '/admin/resources/shipping', label: 'Shipping rates' },
      { href: '/admin/resources/currencies', label: 'Currency rates' },
      { href: '/admin/settings', label: 'WhatsApp & payments' },
    ],
  },
  {
    group: 'CONTENT',
    links: [
      { href: '/admin/resources/hero-slides', label: 'Hero slides' },
      { href: '/admin/resources/pages', label: 'Content pages' },
      { href: '/admin/resources/locations', label: 'Store locations' },
    ],
  },
  {
    group: 'ENGAGEMENT',
    links: [
      { href: '/admin/messages', label: 'Messages', badge: 'messages' },
      { href: '/admin/subscribers', label: 'Newsletter' },
    ],
  },
];

export default function AdminShell({ children, user, counts }: { children: ReactNode; user: { name?: string | null; email?: string | null }; counts: { messages: number; reviews: number; enquiries: number } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; kind: string }[]>([]);
  const idRef = useRef(0);

  const toast = useCallback<ToastFn>((message, kind = 'success') => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  return (
    <ToastContext.Provider value={toast}>
      <div className={a.shell}>
        <aside className={`${a.sidebar} ${open ? a.sidebarOpen : ''}`}>
          <Link href="/admin" className={a.brand}>
            RAZI
            <small>ADMIN PANEL</small>
          </Link>
          <nav>
            {NAV.map((g) => (
              <div key={g.group}>
                <div className={a.navGroup}>{g.group}</div>
                {g.links.map((l) => (
                  <Link key={l.href} href={l.href} className={`${a.navLink} ${isActive(l.href) ? a.navActive : ''}`} onClick={() => setOpen(false)}>
                    {l.label}
                    {l.badge && counts[l.badge] > 0 && <span className={a.badge}>{counts[l.badge]}</span>}
                  </Link>
                ))}
              </div>
            ))}
            <div className={a.navGroup}>ACCOUNT</div>
            <a href="/" className={a.navLink} target="_blank" rel="noopener">
              View store ↗
            </a>
            <button className={a.navLink} style={{ width: '100%' }} onClick={() => signOut({ redirectTo: '/' })}>
              Sign out
            </button>
            <p className={a.muted} style={{ padding: '16px 10px', color: 'rgba(255,255,255,.4)' }}>
              {user.name || user.email}
            </p>
          </nav>
        </aside>
        <div className={a.main}>
          <button className={`${a.btnGhost} ${a.menuToggle} ${a.noPrint}`} onClick={() => setOpen(!open)} style={{ marginBottom: 16 }}>
            ☰ Menu
          </button>
          {children}
        </div>
      </div>
      <div className={a.toastStack} role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`${a.toast} ${t.kind === 'error' ? a.toastError : ''}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
