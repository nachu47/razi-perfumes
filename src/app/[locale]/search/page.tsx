import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ProductListing from '@/components/ProductListing';
import { getRates, getVisitorCountry } from '@/lib/currency';
import { parseFilters, type RawSearchParams } from '@/lib/filters';
import { flatQuery } from '@/lib/query';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  const q = String((await searchParams).q ?? '').slice(0, 100);
  const t = await getTranslations({ locale, namespace: 'meta' });
  // Search result pages shouldn't be indexed
  return { title: t('searchTitle', { q }), robots: { index: false, follow: true } };
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations();
  const q = String(sp.q ?? '').trim().slice(0, 100);
  const [country, rates] = await Promise.all([getVisitorCountry(), getRates()]);
  const filters = { ...parseFilters(sp, country.currency, rates), q: q || undefined, pageSize: 12 };

  return (
    <ProductListing
      title={q ? t('meta.searchTitle', { q }) : t('common.search')}
      breadcrumbs={[{ label: t('common.search') }]}
      filters={filters}
      baseQuery={flatQuery(sp)}
      basePath="/search"
      showCollectionFilter
      emptyText={q ? t('common.searchNoResults', { q }) : t('common.searchHint')}
    />
  );
}
