'use client';
import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import styles from './HeroSlider.module.css';
import type { HeroSlideDTO } from '@/lib/catalog';
import { pick } from '@/lib/site';

export default function HeroSlider({ slides }: { slides: HeroSlideDTO[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const goTo = (idx: number) => {
    if (animating || idx === current) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
    }, 500);
  };

  useEffect(() => {
    if (slides.length < 2) return;
    intervalRef.current = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
        setAnimating(false);
      }, 500);
    }, 6000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [slides.length]);

  if (!slides.length) return null;
  const slide = slides[current] ?? slides[0];
  const tagline = pick(locale, slide.taglineEn, slide.taglineAr);

  return (
    <section className={styles.hero}>
      {slides.map((s, idx) => (
        <div
          key={s.id}
          className={`${styles.slideBg} ${idx === current ? styles.active : ''} ${animating && idx === current ? styles.animating : ''}`}
          style={{ backgroundImage: `url(${isMobile && s.imageMobile ? s.imageMobile : s.imageDesktop})` }}
        >
          <div className={styles.overlay} />
        </div>
      ))}

      <div className={`${styles.contentWrapper} ${animating ? styles.contentOut : styles.contentIn}`}>
        <div className={styles.textBlock}>
          {tagline && <span className={styles.subtitle}>{locale === 'ar' ? tagline : tagline.toUpperCase()}</span>}
          <h2 className={styles.titleAr} lang="ar" dir="rtl">
            {slide.titleAr}
          </h2>
          <h1 className={styles.titleEn}>{slide.titleEn}</h1>
          <div className={styles.ctaWrapper}>
            <Link href={slide.link || '/shop'} className={styles.cta}>
              {t('common.discover')}
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.dots}>
        {slides.map((s, i) => (
          <button
            key={s.id}
            className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
            onClick={() => goTo(i)}
            aria-label={t('home.slide', { n: i + 1 })}
          />
        ))}
      </div>
    </section>
  );
}
