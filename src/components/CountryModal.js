'use client';
import { useState } from 'react';
import styles from './CountryModal.module.css';

const countries = [
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', currency: 'KD', domain: 'https://kw.gissah.com' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currency: 'SR', domain: 'https://sa.gissah.com' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', currency: 'AED', domain: 'https://ae.gissah.com' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', currency: 'QR', domain: 'https://qa.gissah.com' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', currency: 'OMR', domain: 'https://om.gissah.com' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭', currency: 'BD', domain: 'https://bh.gissah.com' },
];

export default function CountryModal({ onClose, onSelectCountry }) {
  const [selectedLang, setSelectedLang] = useState('en');
  const [selectedCountry, setSelectedCountry] = useState('KW');

  const handleConfirm = () => {
    const country = countries.find(c => c.code === selectedCountry);
    onSelectCountry && onSelectCountry(country, selectedLang);
    onClose();
  };

  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        {/* Logo and Branding */}
        <div className={styles.logoContainer}>
          <span className={styles.logoAr}>رازي</span>
          <span className={styles.logoEn}>RAZI PERFUMES</span>
        </div>

        <h3 className={styles.title}>CHOOSE YOUR LANGUAGE & REGION</h3>
        <p className={styles.subtitle}>Discover collections tailored for your country</p>

        {/* Form Container */}
        <div className={styles.selectorsGroup}>
          <div className={styles.control}>
            <label className={styles.label}>LANGUAGE</label>
            <div className={styles.selectWrapper}>
              <select 
                value={selectedLang} 
                onChange={(e) => setSelectedLang(e.target.value)} 
                className={styles.dropdown}
              >
                <option value="en">ENGLISH (US)</option>
                <option value="ar">ARABIC / الْعَرَبيّة</option>
              </select>
              <span className={styles.chevron}>▼</span>
            </div>
          </div>

          <div className={styles.control}>
            <label className={styles.label}>COUNTRY / REGION</label>
            <div className={styles.selectWrapper}>
              <select 
                value={selectedCountry} 
                onChange={(e) => setSelectedCountry(e.target.value)} 
                className={styles.dropdown}
              >
                {countries.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name.toUpperCase()} ({c.currency})
                  </option>
                ))}
              </select>
              <span className={styles.chevron}>▼</span>
            </div>
          </div>
        </div>

        {/* Enter Button */}
        <button className={styles.enterBtn} onClick={handleConfirm}>
          ENTER
        </button>
      </div>
    </div>
  );
}

