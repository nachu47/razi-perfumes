export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
export const SITE_NAME = 'Razi Perfumes';

/** Absolute URL for a path, honouring the locale prefix strategy (English is unprefixed). */
export function absoluteUrl(path: string, locale: string = 'en'): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (locale === 'en') return `${SITE_URL}${p}`;
  return `${SITE_URL}/${locale}${p === '/' ? '' : p}`;
}

/** Choose the Arabic value when the locale is Arabic and a translation exists. */
export function pick<T>(locale: string, en: T, ar: T | null | undefined): T {
  return locale === 'ar' && ar ? ar : en;
}
