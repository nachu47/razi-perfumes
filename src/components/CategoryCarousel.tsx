'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import styles from './CategorySection.module.css';

/**
 * Category tiles. Desktop: centered rows. Mobile: a swipeable 2-row carousel showing
 * 2×2 tiles at a time, with prev/next arrows (CSS scroll-snap does the snapping).
 */
export default function CategoryCarousel({ children }: { children: ReactNode }) {
  const t = useTranslations('home');
  const rtl = useLocale() === 'ar';
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => {
      // In RTL, Chrome/Safari report scrollLeft as 0 → negative; abs() normalises both directions
      const pos = Math.abs(el.scrollLeft);
      const max = el.scrollWidth - el.clientWidth;
      setAtStart(pos <= 2);
      setAtEnd(max <= 2 || pos >= max - 2);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const page = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    // One "page" = the visible width (two columns on mobile); mirrored for RTL
    el.scrollBy({ left: dir * el.clientWidth * (rtl ? -1 : 1), behavior: 'smooth' });
  };

  return (
    <div className={styles.carousel}>
      <button type="button" className={`${styles.arrow} ${styles.arrowPrev}`} onClick={() => page(-1)} disabled={atStart} aria-label={t('categoriesPrev')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <div ref={trackRef} className={styles.grid}>
        {children}
      </div>
      <button type="button" className={`${styles.arrow} ${styles.arrowNext}`} onClick={() => page(1)} disabled={atEnd} aria-label={t('categoriesNext')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}
