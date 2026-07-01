'use client';
import { useEffect, useState } from 'react';
import styles from './SidebarDrawer.module.css';

export default function SidebarDrawer({ isOpen, onClose, title, children, rightAlign = true }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <>
      <div 
        className={`${styles.overlay} ${isOpen ? styles.open : ''}`} 
        onClick={onClose}
      />
      <div className={`${styles.drawer} ${isOpen ? styles.open : ''} ${rightAlign ? styles.right : styles.left}`}>
        <div className={styles.header}>
          <h2>{title}</h2>
          <button onClick={onClose} className={styles.closeBtn}>✕ CLOSE</button>
        </div>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </>
  );
}
