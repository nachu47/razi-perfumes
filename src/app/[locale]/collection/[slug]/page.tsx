import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import ProductListing from '@/components/ProductListing';
import { getCollectionBySlug } from '@/lib/catalog';
import { getRates, getVisitorCountry } from '@/lib/currency';
import { parseFilters, type RawSearchParams } from '@/lib/filters';
import { absoluteUrl, pick } from '@/lib/site';
import { flatQuery } from '@/lib/query';

type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const c = await getCollectionBySlug(slug);
  if (!c) return {};
  const title = pick(locale, c.nameEn, c.nameAr);
  const description = pick(locale, c.descriptionEn, c.descriptionAr) ?? undefined;
  const path = `/collection/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path, locale), languages: { en: absoluteUrl(path, 'en'), ar: absoluteUrl(path, 'ar') } },
    openGraph: { title, description, url: absoluteUrl(path, locale), images: c.image ? [{ url: c.image }] : undefined },
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound(); // only unknown slugs 404

  const sp = await searchParams;
  const [country, rates] = await Promise.all([getVisitorCountry(), getRates()]);
  const filters = { ...parseFilters(sp, country.currency, rates), collection: slug, pageSize: 12 };

  return (
    <ProductListing
      title={pick(locale, collection.nameEn, collection.nameAr)}
      filters={filters}
      baseQuery={flatQuery(sp)}
      basePath={`/collection/${slug}`}
    />
  );
}
