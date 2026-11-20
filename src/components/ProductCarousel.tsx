'use client';
import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import styles from './ProductCarousel.module.css';
import ProductCard from './ProductCard';
import type { ProductCardDTO } from '@/lib/catalog';

export default function ProductCarousel({ title, products }: { title: string; products: ProductCardDTO[] }) {
  const t = useTranslations('home');
  const scrollRef = useRef<HTMLDivElement>(null);

  // scrollBy is physical (negative = visually left) in both LTR and RTL, so the arrows need no mirroring
  const scroll = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: direction === 'left' ? -340 : 340, behavior: 'smooth' });
  };

  if (!products.length) return null;

  return (
    <section className={styles.carouselSection}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.controls}>
          <button className={styles.scrollBtn} onClick={() => scroll('left')} aria-label={t('scrollLeft')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <button className={styles.scrollBtn} onClick={() => scroll('right')} aria-label={t('scrollRight')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.track} ref={scrollRef}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} styles={styles} />
        ))}
      </div>
    </section>
  );
}
