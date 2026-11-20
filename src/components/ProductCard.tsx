'use client';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useStore } from './providers/StoreProvider';
import { pick } from '@/lib/site';
import type { ProductCardDTO } from '@/lib/catalog';

type Styles = Record<string, string>;

/** Price text for a card: single price, or "min - max" for multi-size products (as in the original design). */
export function usePriceRange() {
  const { price } = useStore();
  return (p: ProductCardDTO) => {
    const prices = p.variants.map((v) => v.priceKWD);
    if (!prices.length) return price(p.priceFromKWD);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? price(min) : `${price(min)} - ${price(max)}`;
  };
}

/** Default variant for card-level Add to Cart / Buy Now: first one in stock. */
export function defaultVariant(p: ProductCardDTO) {
  return p.variants.find((v) => v.stock > 0) ?? p.variants[0] ?? null;
}

export default function ProductCard({ product: p, styles, priority = false }: { product: ProductCardDTO; styles: Styles; priority?: boolean }) {
  const t = useTranslations('common');
  const { locale, addToCart, buyNow, isWishlisted, toggleWishlist } = useStore();
  const router = useRouter();
  const priceRange = usePriceRange();
  const name = pick(locale, p.nameEn, p.nameAr);
  const variant = defaultVariant(p);
  const soldOut = !variant || variant.stock <= 0;
  const wished = isWishlisted(p.id);
  const href = `/product/${p.slug}`;

  // Multi-size products open the product page so the customer can pick a size
  const onAdd = () => (p.variants.length > 1 ? router.push(href) : variant && addToCart(variant.id, 1));
  const onBuy = () => (p.variants.length > 1 ? router.push(href) : variant && buyNow(variant.id, 1));

  return (
    <div className={styles.card}>
      <div className={styles.imageWrap}>
        <Link href={href} aria-label={name} style={{ display: 'contents' }}>
          {p.image && (
            <Image
              src={p.image}
              alt={name}
              width={600}
              height={750}
              sizes="(max-width: 480px) 90vw, (max-width: 768px) 45vw, 25vw"
              className={styles.productImage}
              priority={priority}
              style={{ cursor: 'pointer' }}
            />
          )}
        </Link>

        <button
          className={`${styles.wishlistIcon} ${wished ? styles.wishlisted : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            void toggleWishlist(p.id);
          }}
          aria-label={wished ? t('removeFromWishlist') : t('addToWishlist')}
          aria-pressed={wished}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={wished ? 'var(--gold)' : 'none'} stroke={wished ? 'var(--gold)' : 'currentColor'} strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        <div className={styles.actionOverlay}>
          {soldOut ? (
            <button className={styles.actionBtn} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }}>
              {t('outOfStock')}
            </button>
          ) : (
            <>
              <button className={styles.actionBtn} onClick={onAdd}>
                {t('addToCart')}
              </button>
              <button className={`${styles.actionBtn} ${styles.buyNowBtn}`} onClick={onBuy}>
                {t('buyNow')}
              </button>
            </>
          )}
        </div>

        <div className={styles.mobileActions}>
          {soldOut ? (
            <span className={styles.mobileBuyBtn} style={{ opacity: 0.8 }}>
              {t('outOfStock')}
            </span>
          ) : (
            <>
              <button className={styles.mobileBuyBtn} onClick={onBuy} aria-label={t('buyNow')}>
                {t('buyShort')}
              </button>
              <button className={styles.mobileAddBtn} onClick={onAdd} aria-label={t('addToCart')}>
                +
              </button>
            </>
          )}
        </div>
      </div>

      <Link href={href} className={styles.info} style={{ cursor: 'pointer', display: 'block' }}>
        <h3 className={styles.name}>{name}</h3>
        <p className={styles.volume}>{p.variants.map((v) => v.label).join(' / ')}</p>
        <p className={styles.price}>{priceRange(p)}</p>
      </Link>
    </div>
  );
}
