'use client';
import { useEffect, useState } from 'react';
import logo from '../assets/logo.png';
import TransparentLogo from './TransparentLogo';

const KEY = 'razi_splash_seen';

/**
 * Runs before first paint: if the splash was already shown in this browser session,
 * hide it immediately so full page loads (e.g. returning from the payment page)
 * don't replay the 2.5s intro.
 */
export const splashBootScript = `try{if(sessionStorage.getItem('${KEY}'))document.documentElement.setAttribute('data-splash-seen','1')}catch(e){}`;

// The original pre-home splash (ring + pulsing logo), shown once per browser session.
export default function Splash() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY)) {
        setShow(false);
        return;
      }
    } catch {
      /* storage blocked — just play the splash */
    }
    const timer = setTimeout(() => {
      setShow(false);
      try {
        sessionStorage.setItem(KEY, '1');
      } catch {
        /* ignore */
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className={`pre-home-overlay ${!show ? 'hidden' : ''}`} aria-hidden="true">
      <div className="pre-home-container">
        <div className="pre-home-ring"></div>
        <TransparentLogo src={logo} invertToWhite={true} alt="Razi Perfumes" className="pre-home-logo-img" />
      </div>
    </div>
  );
}
