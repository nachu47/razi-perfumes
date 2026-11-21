'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import logo from '../assets/logo.png';
import { useTransparentLogo } from './TransparentLogo';
import s from './Splash.module.css';

const KEY = 'razi_splash_seen';
const FILL_MS = 2200; // liquid rises
const HOLD_MS = 700; // shine + pause before fading into the site

/**
 * Runs before first paint: if the splash was already shown in this browser session,
 * hide it immediately so full page loads (e.g. returning from the payment page)
 * don't replay the intro.
 */
export const splashBootScript = `try{if(sessionStorage.getItem('${KEY}'))document.documentElement.setAttribute('data-splash-seen','1')}catch(e){}`;

// Bubble positions (left %, delay s, size px) — fixed so server and client render the same
const BUBBLES: [number, number, number][] = [
  [18, 0.2, 4], [34, 0.9, 3], [47, 0.4, 5], [58, 1.3, 3], [66, 0.1, 4], [79, 0.7, 3], [27, 1.6, 3], [88, 1.1, 4],
];

/** Intro: the Razi logo fills with liquid gold, then fades into the store. Once per session. */
export default function Splash() {
  const [show, setShow] = useState(true);
  const [percent, setPercent] = useState(0);
  // White logo on black: the processed image's alpha channel becomes the fill mask
  const { dataUrl, ready } = useTransparentLogo(logo, true);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) {
        setShow(false);
        return;
      }
    } catch {
      /* storage blocked — just play the splash */
    }
    if (!ready) return;

    // Percentage counter synced with the CSS fill easing (approximate ease-in-out)
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / FILL_MS);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setPercent(Math.round(eased * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const done = setTimeout(() => {
      setShow(false);
      try {
        sessionStorage.setItem(KEY, '1');
      } catch {
        /* ignore */
      }
    }, FILL_MS + HOLD_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(done);
    };
  }, [ready]);

  // Safety net: never block the site if the logo fails to load
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 6000);
    return () => clearTimeout(t);
  }, []);

  const maskStyle: CSSProperties = { WebkitMaskImage: `url(${dataUrl})`, maskImage: `url(${dataUrl})` };

  return (
    <div className={`pre-home-overlay ${!show ? 'hidden' : ''}`} aria-hidden="true">
      {ready && (
        <div className={s.stage} style={{ ['--fill-ms' as string]: `${FILL_MS}ms` }}>
          <div className={s.logoWrap}>
            <div className={s.mask} style={maskStyle}>
              <div className={s.glass} />
              <div className={s.liquid}>
                <div className={s.waveBack} />
                <div className={s.wave} />
                {BUBBLES.map(([left, delay, size], i) => (
                  <span key={i} className={s.bubble} style={{ left: `${left}%`, animationDelay: `${delay}s`, width: size, height: size }} />
                ))}
              </div>
              <div className={s.shine} />
            </div>
          </div>
          <div className={s.meter}>
            <span className={s.percent}>{percent}%</span>
            <div className={s.track}>
              <div className={s.bar} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
