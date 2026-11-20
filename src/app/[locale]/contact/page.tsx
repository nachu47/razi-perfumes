import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import s from '@/styles/page.module.css';
import ContactForm from '@/components/pages/ContactForm';
import { absoluteUrl } from '@/lib/site';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('contactTitle'),
    alternates: { canonical: absoluteUrl('/contact', locale), languages: { en: absoluteUrl('/contact', 'en'), ar: absoluteUrl('/contact', 'ar') } },
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  return (
    <div className={`${s.container} ${s.narrow}`}>
      <nav className={s.breadcrumbs}>
        <Link href="/">{t('common.home')}</Link>
        <span className={s.separator}>/</span>
        <span className={s.current}>{t('contact.title')}</span>
      </nav>
      <header className={s.pageHeader}>
        <h1 className={s.title}>{t('contact.title')}</h1>
        <p className={s.subtitle} style={{ marginBottom: 0 }}>{t('contact.intro')}</p>
      </header>
      <div className={s.cardWhite}>
        <ContactForm />
      </div>
    </div>
  );
}
