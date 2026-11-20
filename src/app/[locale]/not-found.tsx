import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import s from '@/styles/page.module.css';

export default async function NotFound() {
  const t = await getTranslations('notFound');
  return (
    <div className={`${s.container} ${s.narrow} ${s.center}`} style={{ paddingTop: 200 }}>
      <p style={{ fontFamily: 'var(--font-heading)', fontSize: 80, color: 'var(--gold)', letterSpacing: '0.2em', lineHeight: 1 }}>404</p>
      <h1 className={s.title} style={{ marginTop: 20 }}>{t('title')}</h1>
      <p className={s.subtitle}>{t('text')}</p>
      <Link href="/" className={s.btn}>{t('cta')}</Link>
    </div>
  );
}
