'use client';
import { useEffect, useState } from 'react';
import logo from '../assets/logo.png';
import TransparentLogo from './TransparentLogo';

// The original pre-home splash (ring + pulsing logo), shown on each full page load.
export default function Splash() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 2500);
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
