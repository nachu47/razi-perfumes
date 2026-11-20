'use client';
import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import styles from './ProductDetailView.module.css';
import { useStore } from './providers/StoreProvider';
import { api } from '@/lib/client-api';
import { pick } from '@/lib/site';
import type { ProductDetailDTO } from '@/lib/catalog';

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className={styles.stars} aria-label={`${value} / 5`}>
      {'★'.repeat(full)}
      <span style={{ color: 'var(--light-gray)' }}>{'★'.repeat(5 - full)}</span>
    </span>
  );
}

export default function ProductDetail({ product }: { product: ProductDetailDTO }) {
  const t = useTranslations();
  const { locale, price, addToCart, buyNow, isWishlisted, toggleWishlist, user, toast } = useStore();
  const firstAvailable = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
  const [variantId, setVariantId] = useState(firstAvailable?.id);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'notes' | 'ingredients'>('notes');
  const [activeImage, setActiveImage] = useState(0);
  const [busy, setBusy] = useState(false);

  const variant = product.variants.find((v) => v.id === variantId) ?? firstAvailable;
  const name = pick(locale, product.nameEn, product.nameAr);
  const collectionName = product.collection ? pick(locale, product.collection.nameEn, product.collection.nameAr) : '';
  const wished = isWishlisted(product.id);
  const stock = variant?.stock ?? 0;
  const maxQty = Math.max(1, Math.min(20, stock));
  const images = product.images.length ? product.images : [];

  const notes = {
    top: pick(locale, product.notesTop, product.notesTopAr),
    heart: pick(locale, product.notesHeart, product.notesHeartAr),
    base: pick(locale, product.notesBase, product.notesBaseAr),
  };

  const onAdd = async () => {
    if (!variant) return;
    setBusy(true);
    await addToCart(variant.id, qty);
    setBusy(false);
  };

  return (
    <div className={styles.container}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/" className={styles.breadcrumbLink}>
          {t('common.home')}
        </Link>
        {product.collection && (
          <>
            <span className={styles.separator}>/</span>
            <Link href={`/collection/${product.collection.slug}`} className={styles.breadcrumbLink}>
              {locale === 'ar' ? collectionName : collectionName.toUpperCase()}
            </Link>
          </>
        )}
        <span className={styles.separator}>/</span>
        <span className={styles.current}>{locale === 'ar' ? name : name.toUpperCase()}</span>
      </nav>

      <div className={styles.wrapper}>
        {/* Left: gallery */}
        <div className={styles.imageColumn}>
          <div className={styles.imageBox}>
            {images[activeImage] && (
              <Image src={images[activeImage]} alt={name} width={900} height={1035} priority sizes="(max-width: 768px) 100vw, 50vw" className={styles.mainImage} />
            )}
          </div>
          {images.length > 1 && (
            <div className={styles.thumbs}>
              {images.map((src, i) => (
                <button key={src + i} className={`${styles.thumb} ${i === activeImage ? styles.thumbActive : ''}`} onClick={() => setActiveImage(i)} aria-label={`Image ${i + 1}`}>
                  <Image src={src} alt="" width={72} height={84} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: details */}
        <div className={styles.detailsColumn}>
          <div className={styles.meta}>
            <div className={styles.metaHeader}>
              <span className={styles.categoryLabel}>{collectionName}</span>
              <span className={styles.genderBadge}>{t(`common.gender.${product.gender}`)}</span>
            </div>
            <h1 className={styles.title}>{name}</h1>
            {product.reviewCount > 0 && (
              <a href="#reviews" className={styles.ratingRow}>
                <Stars value={product.rating} /> {t('product.basedOn', { count: product.reviewCount })}
              </a>
            )}
            <p className={styles.price}>
              {variant && price(variant.priceKWD)}
              {variant?.compareAtPriceKWD && variant.compareAtPriceKWD > variant.priceKWD && (
                <span className={styles.compareAt}>{price(variant.compareAtPriceKWD)}</span>
              )}
            </p>
            <p className={`${styles.stock} ${stock <= 0 ? styles.stockOut : stock <= 5 ? styles.stockLow : ''}`}>
              {stock <= 0 ? t('common.outOfStock') : stock <= 5 ? t('common.onlyLeft', { count: stock }) : t('common.inStock')}
            </p>
          </div>

          {product.variants.length > 1 ? (
            <div className={styles.specSection}>
              <span className={styles.specTitle}>{t('common.selectSize')}</span>
              <div className={styles.sizeOptions}>
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setVariantId(v.id);
                      setQty(1);
                    }}
                    disabled={v.stock <= 0}
                    className={`${styles.sizeBtn} ${variant?.id === v.id ? styles.sizeBtnActive : ''}`}
                    aria-pressed={variant?.id === v.id}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.specSection}>
              <span className={styles.specTitle}>{t('common.size')}</span>
              <p className={styles.volumeStatic}>{variant?.label}</p>
            </div>
          )}

          {product.noteTags.length > 0 && (
            <div className={styles.specSection}>
              <span className={styles.specTitle}>{t('product.smellNature')}</span>
              <div className={styles.tagsContainer}>
                {product.noteTags.map((tag) => (
                  <Link key={tag} href={`/shop?note=${tag}`} className={styles.tagChip}>
                    {t.has(`filters.notes.${tag}`) ? t(`filters.notes.${tag}`) : tag.toUpperCase()}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <p className={styles.description}>{pick(locale, product.descriptionEn, product.descriptionAr)}</p>

          <div className={styles.tabsContainer}>
            <div className={styles.tabsHeaders} role="tablist">
              <button role="tab" aria-selected={activeTab === 'notes'} className={`${styles.tabHeader} ${activeTab === 'notes' ? styles.activeTab : ''}`} onClick={() => setActiveTab('notes')}>
                {t('product.fragranceNotes')}
              </button>
              <button role="tab" aria-selected={activeTab === 'ingredients'} className={`${styles.tabHeader} ${activeTab === 'ingredients' ? styles.activeTab : ''}`} onClick={() => setActiveTab('ingredients')}>
                {t('product.ingredients')}
              </button>
            </div>
            <div className={styles.tabBody} role="tabpanel">
              {activeTab === 'notes' ? (
                <div className={styles.notesList}>
                  {notes.top && (
                    <div className={styles.noteItem}>
                      <strong className={styles.noteLabel}>{t('product.topNotes')}</strong>
                      <span className={styles.noteValue}>{notes.top}</span>
                    </div>
                  )}
                  {notes.heart && (
                    <div className={styles.noteItem}>
                      <strong className={styles.noteLabel}>{t('product.heartNotes')}</strong>
                      <span className={styles.noteValue}>{notes.heart}</span>
                    </div>
                  )}
                  {notes.base && (
                    <div className={styles.noteItem}>
                      <strong className={styles.noteLabel}>{t('product.baseNotes')}</strong>
                      <span className={styles.noteValue}>{notes.base}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className={styles.ingredients}>{pick(locale, product.ingredientsEn, product.ingredientsAr)}</p>
              )}
            </div>
          </div>

          <div className={styles.actionsBlock}>
            <div className={styles.qtyLabel}>{t('common.quantity')}</div>
            <div className={styles.qtyRow}>
              <div className={styles.qtySelector}>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className={styles.qtyBtn} aria-label="Decrease quantity">
                  -
                </button>
                <span className={styles.qtyValue} aria-live="polite">
                  {qty}
                </span>
                <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} className={styles.qtyBtn} aria-label="Increase quantity" disabled={qty >= maxQty}>
                  +
                </button>
              </div>

              <button
                className={`${styles.wishlistBtn} ${wished ? styles.wishlisted : ''}`}
                onClick={() => toggleWishlist(product.id)}
                aria-label={wished ? t('common.removeFromWishlist') : t('common.addToWishlist')}
                aria-pressed={wished}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={wished ? 'var(--gold)' : 'none'} stroke={wished ? 'var(--gold)' : 'currentColor'} strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>

            <div className={styles.buttonGroup}>
              <button onClick={onAdd} className={styles.addToCartBtn} disabled={busy || stock <= 0}>
                {stock <= 0 ? t('common.outOfStock') : t('common.addToBasket')}
              </button>
              <button onClick={() => variant && buyNow(variant.id, qty)} className={styles.buyNowBtn} disabled={stock <= 0}>
                {t('common.buyNow')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Reviews product={product} signedIn={Boolean(user)} onDone={() => toast(t('toast.reviewSubmitted'))} />
    </div>
  );
}

function Reviews({ product, signedIn, onDone }: { product: ProductDetailDTO; signedIn: boolean; onDone: () => void }) {
  const t = useTranslations();
  const { toast, locale } = useStore();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/api/products/${product.slug}/reviews`, { body: { rating, comment } });
      setSent(true);
      setComment('');
      onDone();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('common.genericError'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.reviewsSection} id="reviews">
      <h2 className={styles.sectionTitle}>{t('product.reviews')}</h2>
      {product.reviews.length === 0 ? (
        <p className={styles.muted} style={{ marginBottom: 32 }}>
          {t('product.noReviews')}
        </p>
      ) : (
        <div className={styles.reviewList}>
          {product.reviews.map((r) => (
            <article key={r.id} className={styles.review}>
              <Stars value={r.rating} />
              <p className={styles.reviewText}>“{r.comment}”</p>
              <p className={styles.reviewAuthor}>
                {r.author} · {new Date(r.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-KW' : 'en-GB')}
              </p>
            </article>
          ))}
        </div>
      )}

      {signedIn ? (
        sent ? (
          <p className={styles.muted}>{t('toast.reviewSubmitted')}</p>
        ) : (
          <form onSubmit={submit} className={styles.reviewForm}>
            <span className={styles.specTitle} style={{ textAlign: 'center' }}>
              {t('product.writeReview')}
            </span>
            <div className={styles.starPicker} role="radiogroup" aria-label={t('product.yourRating')}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} className={n <= rating ? 'on' : ''} onClick={() => setRating(n)} role="radio" aria-checked={n === rating} aria-label={`${n}`}>
                  ★
                </button>
              ))}
            </div>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('product.yourReview')} required minLength={3} maxLength={2000} />
            <button type="submit" className={styles.addToCartBtn} disabled={busy}>
              {t('product.submitReview')}
            </button>
          </form>
        )
      ) : (
        <p className={styles.muted}>
          <Link href={`/account/login?callbackUrl=/product/${product.slug}`} style={{ textDecoration: 'underline' }}>
            {t('product.signInToReview')}
          </Link>
        </p>
      )}
    </section>
  );
}
