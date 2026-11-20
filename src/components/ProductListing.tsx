import { Suspense } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import styles from './ProductListing.module.css';
import ProductCard from './ProductCard';
import FilterBar from './FilterBar';
import { getAvailableSizes, getCollections, listProducts, type ProductFilters } from '@/lib/catalog';

/**
 * Server-rendered product grid with URL-driven filters + pagination.
 * Used by /shop, /collection/[slug] and /search — same look as the original collection view.
 */
export default async function ProductListing({
  title,
  filters,
  baseQuery,
  showCollectionFilter = false,
  emptyText,
  breadcrumbs,
  basePath,
}: {
  basePath: string;
  title: string;
  filters: ProductFilters;
  baseQuery: Record<string, string>;
  showCollectionFilter?: boolean;
  emptyText?: string;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  const t = await getTranslations();
  const locale = await getLocale();
  const [result, sizes, collections] = await Promise.all([listProducts(filters), getAvailableSizes(), getCollections()]);

  const pageHref = (page: number) => {
    const qs = new URLSearchParams({ ...baseQuery, ...(page > 1 ? { page: String(page) } : {}) });
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  return (
    <div className={styles.container}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/" className={styles.breadcrumbLink}>
          {t('common.home')}
        </Link>
        {(breadcrumbs ?? [{ label: title }]).map((b, i) => (
          <span key={i} style={{ display: 'contents' }}>
            <span className={styles.separator}>/</span>
            {b.href ? (
              <Link href={b.href} className={styles.breadcrumbLink}>
                {locale === 'ar' ? b.label : b.label.toUpperCase()}
              </Link>
            ) : (
              <span className={styles.current}>{locale === 'ar' ? b.label : b.label.toUpperCase()}</span>
            )}
          </span>
        ))}
      </nav>

      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.count}>{t('common.products', { count: result.total })}</p>
      </header>

      <Suspense>
        <FilterBar sizes={sizes} collections={collections} showCollection={showCollectionFilter} />
      </Suspense>

      {result.items.length === 0 ? (
        <p className={styles.empty}>{emptyText ?? t('filters.noMatch')}</p>
      ) : (
        <div className={styles.grid}>
          {result.items.map((p, i) => (
            <ProductCard key={p.id} product={p} styles={styles} priority={i < 4} />
          ))}
        </div>
      )}

      {result.pageCount > 1 && (
        <nav className={styles.pagination} aria-label="Pagination">
          {result.page > 1 ? (
            <Link href={pageHref(result.page - 1)} className={styles.pageBtn} rel="prev">
              {t('filters.prev')}
            </Link>
          ) : (
            <span />
          )}
          <span className={styles.count}>{t('filters.page', { page: result.page, total: result.pageCount })}</span>
          {result.page < result.pageCount ? (
            <Link href={pageHref(result.page + 1)} className={styles.pageBtn} rel="next">
              {t('filters.next')}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
