'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import styles from './SidebarDrawer.module.css';

export default function SidebarDrawer({
  isOpen,
  onClose,
  title,
  children,
  rightAlign = true,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  rightAlign?: boolean;
}) {
  const t = useTranslations('common');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && isOpen && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!mounted) return null;

  return (
    <>
      <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`} onClick={onClose} />
      <div
        className={`${styles.drawer} ${isOpen ? styles.open : ''} ${rightAlign ? styles.right : styles.left}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-hidden={!isOpen}
      >
        <div className={styles.header}>
          <h2>{title}</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            {t('close')}
          </button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </>
  );
}
