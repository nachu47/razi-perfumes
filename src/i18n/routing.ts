import { defineRouting } from 'next-intl/routing';

// English is served without a prefix (/shop), Arabic under /ar (/ar/shop).
// This keeps the existing English URLs stable and gives clean hreflang pairs.
export const routing = defineRouting({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  localeCookie: { name: 'NEXT_LOCALE', maxAge: 60 * 60 * 24 * 365 },
});

export type Locale = (typeof routing.locales)[number];
