'use client';
import { useEffect, useState, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import styles from './ProductListing.module.css';
import { useStore } from './providers/StoreProvider';
import { pick } from '@/lib/site';

const NOTES = ['spicy', 'woody', 'sweet', 'fruity', 'floral', 'musky', 'oud'] as const;

// Filters are kept in the URL so results are shareable, crawlable and server-rendered.
export default function FilterBar({
  sizes,
  collections,
  showCollection,
}: {
  sizes: number[];
  collections?: { slug: string; nameEn: string; nameAr: string }[];
  showCollection?: boolean;
}) {
  const t = useTranslations('filters');
  const { country, locale } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [min, setMin] = useState(params.get('min') ?? '');
  const [max, setMax] = useState(params.get('max') ?? '');

  useEffect(() => {
    setMin(params.get('min') ?? '');
    setMax(params.get('max') ?? '');
  }, [params]);

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === '' || v === 'all') next.delete(k);
      else next.set(k, v);
    }
    next.delete('page'); // any filter change goes back to page 1
    const qs = next.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };

  const get = (k: string) => params.get(k) ?? 'all';
  const active = ['gender', 'size', 'note', 'min', 'max', 'collection', 'sort', 'featured'].some((k) => params.has(k));

  return (
    <div className={styles.filterBar} style={{ opacity: pending ? 0.6 : 1, transition: 'opacity .2s' }}>
      {showCollection && collections && (
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="f-collection">
            {t('collection')}
          </label>
          <select id="f-collection" value={get('collection')} onChange={(e) => update({ collection: e.target.value })} className={styles.filterSelect}>
            <option value="all">{t('allCollections')}</option>
            {collections.map((c) => (
              <option key={c.slug} value={c.slug}>
                {pick(locale, c.nameEn, c.nameAr).toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel} htmlFor="f-gender">
          {t('gender')}
        </label>
        <select id="f-gender" value={get('gender')} onChange={(e) => update({ gender: e.target.value })} className={styles.filterSelect}>
          <option value="all">{t('allGenders')}</option>
          <option value="male">{t('male')}</option>
          <option value="female">{t('female')}</option>
          <option value="unisex">{t('unisex')}</option>
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel} htmlFor="f-size">
          {t('volume')}
        </label>
        <select id="f-size" value={get('size')} onChange={(e) => update({ size: e.target.value })} className={styles.filterSelect}>
          <option value="all">{t('allSizes')}</option>
          {sizes.map((s) => (
            <option key={s} value={String(s)}>
              {s}ML
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel} htmlFor="f-note">
          {t('scent')}
        </label>
        <select id="f-note" value={get('note')} onChange={(e) => update({ note: e.target.value })} className={styles.filterSelect}>
          <option value="all">{t('allScents')}</option>
          {NOTES.map((n) => (
            <option key={n} value={n}>
              {t(`notes.${n}`)}
            </option>
          ))}
        </select>
      </div>

      <form
        className={styles.filterGroup}
        onSubmit={(e) => {
          e.preventDefault();
          update({ min, max });
        }}
      >
        <span className={styles.filterLabel}>{t('price', { currency: country.currency })}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="number"
            min={0}
            inputMode="decimal"
            placeholder={t('min')}
            value={min}
            onChange={(e) => setMin(e.target.value)}
            onBlur={() => min !== (params.get('min') ?? '') && update({ min })}
            className={styles.filterSelect}
            style={{ width: 90, backgroundImage: 'none', padding: '10px 12px' }}
            aria-label={t('min')}
          />
          <input
            type="number"
            min={0}
            inputMode="decimal"
            placeholder={t('max')}
            value={max}
            onChange={(e) => setMax(e.target.value)}
            onBlur={() => max !== (params.get('max') ?? '') && update({ max })}
            className={styles.filterSelect}
            style={{ width: 90, backgroundImage: 'none', padding: '10px 12px' }}
            aria-label={t('max')}
          />
        </div>
      </form>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel} htmlFor="f-sort">
          {t('sort')}
        </label>
        <select id="f-sort" value={params.get('sort') ?? 'newest'} onChange={(e) => update({ sort: e.target.value === 'newest' ? null : e.target.value })} className={styles.filterSelect}>
          <option value="newest">{t('newest')}</option>
          <option value="price-asc">{t('priceAsc')}</option>
          <option value="price-desc">{t('priceDesc')}</option>
          <option value="best-selling">{t('bestSelling')}</option>
        </select>
      </div>

      {active && (
        <button
          onClick={() => {
            const q = params.get('q');
            startTransition(() => router.push(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname, { scroll: false }));
          }}
          className={styles.clearBtn}
        >
          {t('reset')}
        </button>
      )}
    </div>
  );
}
