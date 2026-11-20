import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ProductListing from '@/components/ProductListing';
import { getRates, getVisitorCountry } from '@/lib/currency';
import { parseFilters, type RawSearchParams } from '@/lib/filters';
import { absoluteUrl } from '@/lib/site';
import { flatQuery } from '@/lib/query';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const tf = await getTranslations({ locale, namespace: 'filters' });
  const title = sp.featured ? tf('luxuryLine') : t('shopTitle');
  return {
    title,
    alternates: { canonical: absoluteUrl('/shop', locale), languages: { en: absoluteUrl('/shop', 'en'), ar: absoluteUrl('/shop', 'ar') } },
    openGraph: { title, url: absoluteUrl('/shop', locale) },
  };
}

export default async function ShopPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations();
  const [country, rates] = await Promise.all([getVisitorCountry(), getRates()]);
  const filters = { ...parseFilters(sp, country.currency, rates), pageSize: 12 };
  const title = filters.featured ? t('filters.luxuryLine') : t('common.shopAll');

  return (
    <ProductListing title={title} filters={filters} baseQuery={flatQuery(sp)} basePath="/shop" showCollectionFilter />
  );
}
