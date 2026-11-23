import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import HeroSlider from '@/components/HeroSlider';
import ProductCarousel from '@/components/ProductCarousel';
import CategorySection from '@/components/CategorySection';
import { getCollections, getHeroSlides, listProducts } from '@/lib/catalog';
import { SITE_URL } from '@/lib/site';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  const [slides, recommended, luxury, collections, topSeller, newest] = await Promise.all([
    getHeroSlides(),
    listProducts({ recommended: true, pageSize: 12, sort: 'newest' }),
    listProducts({ featured: true, pageSize: 12, sort: 'newest' }),
    getCollections(),
    listProducts({ sort: 'best-selling', pageSize: 1 }),
    listProducts({ sort: 'newest', pageSize: 1 }),
  ]);
  // Circles under the categories use a real product photo each
  const highlights = [
    { key: 'bestSellers' as const, href: '/shop?sort=best-selling', image: topSeller.items[0]?.image ?? null },
    { key: 'newArrivals' as const, href: '/shop?sort=newest', image: newest.items[0]?.image ?? null },
  ];
  const setsCollection = collections.find((c) => c.slug === 'gift-sets');

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Razi Perfumes',
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    sameAs: [
      'https://www.instagram.com/raziperfumes/',
      'https://www.facebook.com/raziperfumes/',
      'https://www.tiktok.com/@raziperfumes',
      'https://www.linkedin.com/company/razi-perfumes',
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <HeroSlider slides={slides} />

      <ProductCarousel title={t('recommended')} products={recommended.items} />

      <CategorySection collections={collections} highlights={highlights} />

      {/* Category Highlight Section */}
      <section
        className="highlightSection"
        style={{
          backgroundImage: `url('https://kw.gissah.com/web/image/product.public.category/18/background_image/1920x0?unique=1ab1e03')`,
        }}
      >
        <div className="highlightOverlay" />
        <div className="highlightContent">
          <span className="highlightSubtitle">{t('setsLine')}</span>
          <h2 className="highlightTitle">{t('setsTitle')}</h2>
          <Link href={`/collection/${setsCollection?.slug ?? 'gift-sets'}`} className="highlightCta">
            {locale === 'ar' ? 'اكتشف' : 'DISCOVER'}
          </Link>
        </div>
      </section>

      <ProductCarousel title={t('luxuryLine')} products={luxury.items} />
    </>
  );
}
