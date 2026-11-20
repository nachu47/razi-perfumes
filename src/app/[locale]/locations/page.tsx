import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import s from '@/styles/page.module.css';
import { getLocations } from '@/lib/catalog';
import { absoluteUrl, pick } from '@/lib/site';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('locationsTitle'),
    alternates: { canonical: absoluteUrl('/locations', locale), languages: { en: absoluteUrl('/locations', 'en'), ar: absoluteUrl('/locations', 'ar') } },
  };
}

export default async function LocationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const locations = await getLocations();

  const jsonLd = locations.map((l) => ({
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: l.nameEn,
    address: l.addressEn,
    telephone: l.phone || undefined,
    openingHours: l.openingHours || undefined,
    hasMap: l.mapUrl || undefined,
  }));

  return (
    <div className={`${s.container} ${s.narrow}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <nav className={s.breadcrumbs}>
        <Link href="/">{t('common.home')}</Link>
        <span className={s.separator}>/</span>
        <span className={s.current}>{t('locations.title')}</span>
      </nav>
      <header className={s.pageHeader}>
        <h1 className={s.title}>{t('locations.title')}</h1>
      </header>
      {locations.length === 0 ? (
        <p className={s.empty}>{t('locations.empty')}</p>
      ) : (
        <div className={s.addressGrid}>
          {locations.map((l) => (
            <article key={l.id} className={s.addressCard} style={{ padding: 28 }}>
              <h2 className={s.sectionTitle} style={{ marginBottom: 12 }}>
                {pick(locale, l.nameEn, l.nameAr)}
              </h2>
              <p>{pick(locale, l.addressEn, l.addressAr)}</p>
              {l.phone && (
                <p style={{ marginTop: 8 }}>
                  <a href={`tel:${l.phone.replace(/\s/g, '')}`} dir="ltr">
                    {l.phone}
                  </a>
                </p>
              )}
              {l.openingHours && (
                <p className={s.muted} style={{ marginTop: 8 }}>
                  {t('locations.hours')}: <span dir="ltr">{l.openingHours}</span>
                </p>
              )}
              {l.mapUrl && (
                <a href={l.mapUrl} target="_blank" rel="noopener noreferrer" className={s.btnOutline} style={{ marginTop: 18, padding: '12px 18px', fontSize: 10 }}>
                  {t('locations.openMap')}
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
