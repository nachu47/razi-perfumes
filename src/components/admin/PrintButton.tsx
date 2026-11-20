'use client';
import a from './admin.module.css';

export default function PrintButton() {
  return (
    <button className={a.btnGold} onClick={() => window.print()}>
      Print / Save as PDF
    </button>
  );
}
