'use client';
import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import styles from './CountryModal.module.css';
import logo from '../assets/logo.png';
import TransparentLogo from './TransparentLogo';
import { useStore } from './providers/StoreProvider';
import { useSwitchLocale } from './Footer';
import { COUNTRIES, type CountryCode } from '@/lib/countries';

export default function CountryModal() {
  const t = useTranslations('country');
  const locale = useLocale();
  const { country, setCountry, countryModalOpen, setCountryModalOpen } = useStore();
  const switchLocale = useSwitchLocale();
  const [selectedLang, setSelectedLang] = useState(locale);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(country.code);

  useEffect(() => {
    if (countryModalOpen) {
      setSelectedLang(locale);
      setSelectedCountry(country.code);
    }
  }, [countryModalOpen, locale, country.code]);

  if (!countryModalOpen) return null;

  const handleConfirm = async () => {
    setCountryModalOpen(false);
    await setCountry(selectedCountry); // always stored so the first-visit modal doesn't reappear
    if (selectedLang !== locale) switchLocale(selectedLang as 'en' | 'ar');
  };

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && setCountryModalOpen(false)}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="country-modal-title">
        <div className={styles.logoContainer}>
          <TransparentLogo src={logo} invertToWhite={false} alt="Razi Perfumes" className={styles.logoImg} />
        </div>

        <h3 className={styles.title} id="country-modal-title">
          {t('title')}
        </h3>
        <p className={styles.subtitle}>{t('subtitle')}</p>

        <div className={styles.selectorsGroup}>
          <div className={styles.control}>
            <label className={styles.label} htmlFor="cm-lang">
              {t('language')}
            </label>
            <div className={styles.selectWrapper}>
              <select id="cm-lang" value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} className={styles.dropdown}>
                <option value="en">{t('english')}</option>
                <option value="ar">{t('arabic')}</option>
              </select>
              <span className={styles.chevron}>▼</span>
            </div>
          </div>

          <div className={styles.control}>
            <label className={styles.label} htmlFor="cm-country">
              {t('region')}
            </label>
            <div className={styles.selectWrapper}>
              <select id="cm-country" value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value as CountryCode)} className={styles.dropdown}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {locale === 'ar' ? `${c.nameAr} (${c.symbolAr})` : `${c.nameEn.toUpperCase()} (${c.currency === 'KWD' ? 'KD' : c.currency})`}
                  </option>
                ))}
              </select>
              <span className={styles.chevron}>▼</span>
            </div>
          </div>
        </div>

        <button className={styles.enterBtn} onClick={handleConfirm}>
          {t('enter')}
        </button>
      </div>
    </div>
  );
}
