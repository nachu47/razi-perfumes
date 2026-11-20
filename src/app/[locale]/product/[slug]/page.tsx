import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ProductDetail from '@/components/ProductDetail';
import ProductCarousel from '@/components/ProductCarousel';
import { getProductBySlug, listProducts } from '@/lib/catalog';
import { getRates, getVisitorCountry } from '@/lib/currency';
import { convertFromKWD } from '@/lib/money';
import { absoluteUrl, pick } from '@/lib/site';

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateStaticParams() {
  const { items } = await listProducts({ pageSize: 48 }).catch(() => ({ items: [] }));
  return items.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  const name = pick(locale, p.nameEn, p.nameAr);
  const description = (pick(locale, p.descriptionEn, p.descriptionAr) ?? '').slice(0, 160);
  const path = `/product/${slug}`;
  return {
    title: name,
    description,
    alternates: { canonical: absoluteUrl(path, locale), languages: { en: absoluteUrl(path, 'en'), ar: absoluteUrl(path, 'ar') } },
    openGraph: { type: 'website', title: name, description, url: absoluteUrl(path, locale), images: p.images.map((url) => ({ url, alt: name })) },
    twitter: { card: 'summary_large_image', title: name, description, images: p.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const t = await getTranslations('product');
  const [related, country, rates] = await Promise.all([
    listProducts({ collection: product.collection?.slug, excludeId: product.id, pageSize: 8, sort: 'best-selling' }),
    getVisitorCountry(),
    getRates(),
  ]);

  // JSON-LD Product schema (offers in the visitor's currency)
  const name = pick(locale, product.nameEn, product.nameAr);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    image: product.images,
    description: pick(locale, product.descriptionEn, product.descriptionAr),
    sku: product.variants[0]?.sku,
    brand: { '@type': 'Brand', name: 'Razi Perfumes' },
    category: product.collection?.nameEn,
    ...(product.reviewCount > 0
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviewCount } }
      : {}),
    offers: product.variants.map((v) => ({
      '@type': 'Offer',
      sku: v.sku,
      name: `${name} ${v.label}`,
      price: convertFromKWD(v.priceKWD, country.currency, rates),
      priceCurrency: country.currency,
      availability: v.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: absoluteUrl(`/product/${product.slug}`, locale),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <ProductDetail product={product} />
      {related.items.length > 0 && <ProductCarousel title={t('related')} products={related.items} />}
    </>
  );
}
