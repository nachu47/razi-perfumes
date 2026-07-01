'use client';
import { useState, useEffect, useRef } from 'react';
import styles from './HeroSlider.module.css';

const slides = [
  {
    id: 1,
    image: 'https://kw.gissah.com/web/image/website.content.config.hero/1/image_1920/1920x0?unique=cfbdcd5',
    titleEn: 'BEYOND ME',
    titleAr: 'عالم جديد من السحر',
    tagline: 'A memory held in time.',
    cta: 'DISCOVER',
  },
  {
    id: 2,
    image: 'https://kw.gissah.com/web/image/website.content.config.hero/2/image_1920/1920x0?unique=a787d79',
    titleEn: 'HUDSON VALLEY',
    titleAr: 'عبير يوقظ الذاكرة',
    tagline: 'Bring memories home, keep them close.',
    cta: 'DISCOVER',
  },
  {
    id: 3,
    image: 'https://kw.gissah.com/web/image/website.content.config.hero/3/image_1920/1920x0?unique=a787d79',
    titleEn: 'SIGNATURE COLLECTION',
    titleAr: 'فخامة التفاصيل',
    tagline: 'A fragrance that awakens memory and lingers like a whisper.',
    cta: 'DISCOVER',
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const intervalRef = useRef(null);

  const goTo = (idx) => {
    if (animating || idx === current) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(idx);
      setAnimating(false);
    }, 500);
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % slides.length);
        setAnimating(false);
      }, 500);
    }, 6000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const slide = slides[current];

  return (
    <section className={styles.hero}>
      {/* Background Images Layer */}
      {slides.map((s, idx) => (
        <div
          key={s.id}
          className={`${styles.slideBg} ${idx === current ? styles.active : ''} ${animating && idx === current ? styles.animating : ''}`}
          style={{ backgroundImage: `url(${s.image})` }}
        >
          <div className={styles.overlay} />
        </div>
      ))}

      {/* Floating Centered Content Overlay */}
      <div className={`${styles.contentWrapper} ${animating ? styles.contentOut : styles.contentIn}`}>
        <div className={styles.textBlock}>
          <span className={styles.subtitle}>{slide.tagline.toUpperCase()}</span>
          <h2 className={styles.titleAr}>{slide.titleAr}</h2>
          <h1 className={styles.titleEn}>{slide.titleEn}</h1>
          <div className={styles.ctaWrapper}>
            <a href="/shop" className={styles.cta}>
              {slide.cta}
            </a>
          </div>
        </div>
      </div>

      {/* Dots Indicator */}
      <div className={styles.dots}>
        {slides.map((s, i) => (
          <button
            key={s.id}
            className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

