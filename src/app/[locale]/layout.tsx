import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { auth } from '@/auth';
import { getRates, getVisitorCountry } from '@/lib/currency';
import { getCollections } from '@/lib/catalog';
import { COUNTRY_COOKIE } from '@/lib/countries';
import { SITE_URL, absoluteUrl } from '@/lib/site';
import StoreProvider from '@/components/providers/StoreProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CountryModal from '@/components/CountryModal';
import Splash from '@/components/Splash';
import { CartDrawer, SearchDrawer, ShopMenuDrawer } from '@/components/Drawers';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = { themeColor: '#120F0D', width: 'device-width', initialScale: 1 };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t('title'), template: `%s | ${locale === 'ar' ? 'رازي للعطور' : 'Razi Perfumes'}` },
    description: t('description'),
    keywords: ['Razi Perfumes', 'luxury perfume', 'Arabian fragrance', 'Kuwait', 'oud', 'signature collection', 'عطور', 'رازي'],
    alternates: {
      canonical: absoluteUrl('/', locale),
      languages: { en: absoluteUrl('/', 'en'), ar: absoluteUrl('/', 'ar'), 'x-default': absoluteUrl('/', 'en') },
    },
    openGraph: {
      type: 'website',
      siteName: locale === 'ar' ? 'رازي للعطور' : 'Razi Perfumes',
      locale: locale === 'ar' ? 'ar_KW' : 'en_US',
      title: t('title'),
      description: t('description'),
    },
    twitter: { card: 'summary_large_image', title: t('title'), description: t('description') },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const [messages, session, rates, country, collections, cookieStore] = await Promise.all([
    getMessages(),
    auth(),
    getRates(),
    getVisitorCountry(),
    getCollections(),
    cookies(),
  ]);
  const user = session?.user?.id
    ? { id: session.user.id, name: session.user.name, email: session.user.email, role: session.user.role }
    : null;

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <StoreProvider initialCountry={country.code} hasCountryCookie={cookieStore.has(COUNTRY_COOKIE)} rates={rates} user={user}>
            <div style={{ background: 'var(--ivory)', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden', width: '100%' }}>
              <Splash />
              <Header />
              <main style={{ flex: 1 }}>{children}</main>
              <Suspense>
                <Footer />
                <CountryModal />
              </Suspense>
              <ShopMenuDrawer collections={collections} />
              <SearchDrawer />
              <CartDrawer />
            </div>
          </StoreProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
