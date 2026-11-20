'use client';
import { useState, useTransition, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import styles from './Footer.module.css';
import logo from '../assets/logo.png';
import TransparentLogo from './TransparentLogo';
import { useStore } from './providers/StoreProvider';
import { COUNTRIES, type CountryCode } from '@/lib/countries';
import { api } from '@/lib/client-api';

const aboutLinks = [
  { href: '/about', key: 'aboutUs' },
  { href: '/our-story', key: 'ourStory' },
  { href: '/locations', key: 'locations' },
  { href: '/contact', key: 'contact' },
] as const;

const collectionLinks = [
  { href: '/collection/signature', key: 'signature' },
  { href: '/shop?featured=1', key: 'luxury' },
  { href: '/collection/hair-mist-body-cream', key: 'hairBody' },
  { href: '/collection/gift-sets', key: 'sets' },
] as const;

const policyLinks = [
  { href: '/terms', key: 'terms' },
  { href: '/shipping-policy', key: 'shipping' },
  { href: '/privacy-policy', key: 'privacy' },
  { href: '/return-policy', key: 'returns' },
] as const;

export function useSwitchLocale() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  return (next: 'en' | 'ar') => {
    const qs = searchParams.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { locale: next }));
  };
}

function NewsletterForm() {
  const t = useTranslations();
  const { toast } = useStore();
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/api/newsletter', { body: { email, website } });
      toast(t('toast.subscribed'));
      setEmail('');
    } catch (err) {
      toast(err instanceof Error ? err.message : t('common.genericError'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className={styles.newsletterForm}>
      <label className={styles.linkTitle} htmlFor="newsletter-email">
        {t('footer.newsletter')}
      </label>
      <p className={styles.newsletterHint}>{t('footer.newsletterText')}</p>
      <div className={styles.newsletterRow}>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('footer.emailPlaceholder')}
          className={styles.newsletterInput}
          autoComplete="email"
        />
        <button type="submit" className={styles.newsletterBtn} disabled={busy}>
          {t('footer.subscribe')}
        </button>
      </div>
      {/* Honeypot for bots */}
      <input tabIndex={-1} autoComplete="off" className="visually-hidden" aria-hidden="true" value={website} onChange={(e) => setWebsite(e.target.value)} name="website" />
    </form>
  );
}

export default function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();
  const { country, setCountry } = useStore();
  const switchLocale = useSwitchLocale();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (name: string) => setActiveSection(activeSection === name ? null : name);

  const socials = (
    <div className={styles.socials}>
      <a href="https://www.instagram.com/raziperfumes/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">IG</a>
      <a href="https://www.facebook.com/raziperfumes/" target="_blank" rel="noopener noreferrer" aria-label="Facebook">FB</a>
      <a href="https://www.tiktok.com/@raziperfumes" target="_blank" rel="noopener noreferrer" aria-label="TikTok">TT</a>
      <a href="https://www.linkedin.com/company/razi-perfumes" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">LI</a>
    </div>
  );

  const list = (links: readonly { href: string; key: string }[]) => (
    <ul className={styles.linkList}>
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href}>{t(l.key)}</Link>
        </li>
      ))}
    </ul>
  );

  const accordion = (id: string, title: string, links: readonly { href: string; key: string }[]) => (
    <div className={styles.accordionSection}>
      <button className={styles.accordionHeader} onClick={() => toggleSection(id)} aria-expanded={activeSection === id}>
        <span>{title}</span>
        <span className={`${styles.chevron} ${activeSection === id ? styles.chevronOpen : ''}`}>▼</span>
      </button>
      <div className={`${styles.accordionContent} ${activeSection === id ? styles.accordionContentOpen : ''}`}>{list(links)}</div>
    </div>
  );

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* DESKTOP VIEW */}
        <div className={styles.desktopLayout}>
          <div className={styles.column}>
            <div className={styles.logoWrap}>
              <TransparentLogo src={logo} invertToWhite={true} alt="Razi Perfumes" className={styles.footerLogo} />
            </div>
            <p className={styles.newsletterText}>{t('tagline')}</p>
            {socials}
            <NewsletterForm />
          </div>

          <div className={styles.linksColumn}>
            <h4 className={styles.linkTitle}>{t('about')}</h4>
            {list(aboutLinks)}
          </div>
          <div className={styles.linksColumn}>
            <h4 className={styles.linkTitle}>{t('collections')}</h4>
            {list(collectionLinks)}
          </div>
          <div className={styles.linksColumn}>
            <h4 className={styles.linkTitle}>{t('policies')}</h4>
            {list(policyLinks)}
          </div>
        </div>

        {/* MOBILE VIEW */}
        <div className={styles.mobileLayout}>
          <div className={styles.mobileBrand}>
            <div className={styles.logoWrap}>
              <TransparentLogo src={logo} invertToWhite={true} alt="Razi Perfumes" className={styles.footerLogo} />
            </div>
            {socials}
          </div>
          {accordion('about', t('about'), aboutLinks)}
          {accordion('collections', t('collections'), collectionLinks)}
          {accordion('policies', t('policies'), policyLinks)}
          <div className={styles.mobileNewsletter}>
            <NewsletterForm />
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.bottomInner}>
          <p className={styles.copyright}>{t('rights', { year: new Date().getFullYear() })}</p>
          <div className={styles.selectors}>
            <div className={styles.selectWrapper}>
              <select
                className={styles.footerSelect}
                aria-label={t('selectCountry')}
                value={country.code}
                onChange={(e) => void setCountry(e.target.value as CountryCode)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {locale === 'ar' ? `${c.nameAr} (${c.symbolAr})` : `${c.nameEn.toUpperCase()} (${c.currency === 'KWD' ? 'KD' : c.currency})`}
                  </option>
                ))}
              </select>
              <span className={styles.selectChevron}>▼</span>
            </div>
            <div className={styles.selectWrapper}>
              <select
                className={styles.footerSelect}
                aria-label={t('selectLanguage')}
                value={locale}
                onChange={(e) => switchLocale(e.target.value as 'en' | 'ar')}
              >
                <option value="en">{t('english')}</option>
                <option value="ar">{t('arabic')}</option>
              </select>
              <span className={styles.selectChevron}>▼</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
