import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import s from '@/styles/page.module.css';
import { getPage } from '@/lib/catalog';
import { absoluteUrl, pick } from '@/lib/site';

/**
 * Renders admin-editable page content. Format (kept simple for non-technical editors):
 *   "## Heading" lines → headings, "- item" lines → bullet lists, blank lines → paragraphs.
 * Content is rendered as text (never as HTML), so it can't inject markup.
 */
function renderContent(text: string) {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/);
  return blocks.map((block, i) => {
    const lines = block.split('\n').filter((l) => l.trim() !== '');
    if (!lines.length) return null;
    if (lines.length === 1 && lines[0].startsWith('## ')) return <h2 key={i}>{lines[0].slice(3)}</h2>;
    if (lines.every((l) => l.trim().startsWith('- '))) {
      return (
        <ul key={i}>
          {lines.map((l, j) => (
            <li key={j}>{l.trim().slice(2)}</li>
          ))}
        </ul>
      );
    }
    const [first, ...rest] = lines;
    if (first.startsWith('## ')) {
      return (
        <div key={i}>
          <h2>{first.slice(3)}</h2>
          <p>{rest.join(' ')}</p>
        </div>
      );
    }
    return <p key={i}>{lines.join(' ')}</p>;
  });
}

export async function contentMetadata(slug: string, locale: string): Promise<Metadata> {
  const page = await getPage(slug);
  if (!page) return {};
  const title = pick(locale, page.titleEn, page.titleAr);
  const description = pick(locale, page.contentEn, page.contentAr).replace(/##\s*/g, '').replace(/\s+/g, ' ').slice(0, 160);
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/${slug}`, locale), languages: { en: absoluteUrl(`/${slug}`, 'en'), ar: absoluteUrl(`/${slug}`, 'ar') } },
  };
}

export default async function ContentPage({ slug, locale }: { slug: string; locale: string }) {
  const page = await getPage(slug);
  if (!page) notFound();
  const t = await getTranslations('common');
  const title = pick(locale, page.titleEn, page.titleAr);
  return (
    <div className={`${s.container} ${s.narrow}`}>
      <nav className={s.breadcrumbs}>
        <Link href="/">{t('home')}</Link>
        <span className={s.separator}>/</span>
        <span className={s.current}>{locale === 'ar' ? title : title.toUpperCase()}</span>
      </nav>
      <header className={s.pageHeader}>
        <h1 className={s.title}>{title}</h1>
      </header>
      <article className={s.prose}>{renderContent(pick(locale, page.contentEn, page.contentAr))}</article>
    </div>
  );
}
