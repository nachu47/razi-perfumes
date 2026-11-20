'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import s from '@/styles/page.module.css';
import gridStyles from '../ProductListing.module.css';
import ProductCard, { defaultVariant } from '../ProductCard';
import { useStore } from '../providers/StoreProvider';
import { api } from '@/lib/client-api';
import type { ProductCardDTO } from '@/lib/catalog';

export default function WishlistView() {
  const t = useTranslations();
  const { wishlist, addToCart, toggleWishlist, toast } = useStore();
  const [items, setItems] = useState<ProductCardDTO[] | null>(null);

  // Reload cards whenever the wishlist ids change (hearts toggled anywhere)
  const key = wishlist.join(',');
  useEffect(() => {
    let cancelled = false;
    api<{ items: ProductCardDTO[] }>('/api/wishlist?full=1')
      .then((d) => !cancelled && setItems(d.items))
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, [key]);

  const moveToCart = async (p: ProductCardDTO) => {
    const v = defaultVariant(p);
    if (!v) return;
    if (await addToCart(v.id, 1, { openDrawer: false, silent: true })) {
      await toggleWishlist(p.id);
      toast(t('toast.movedToCart'));
    }
  };

  return (
    <div className={s.container}>
      <nav className={s.breadcrumbs}>
        <Link href="/">{t('common.home')}</Link>
        <span className={s.separator}>/</span>
        <span className={s.current}>{t('wishlist.title')}</span>
      </nav>
      <header className={s.pageHeader}>
        <h1 className={s.title}>{t('wishlist.title')}</h1>
        {items && <p className={s.muted}>{t('common.products', { count: items.length })}</p>}
      </header>

      {items === null ? (
        <div className="spinner" />
      ) : items.length === 0 ? (
        <div className={s.center}>
          <p className={s.empty}>{t('wishlist.empty')}</p>
          <p className={s.muted} style={{ marginBottom: 28 }}>
            {t('wishlist.emptyHint')}
          </p>
          <Link href="/shop" className={s.btn}>
            {t('common.continueShopping')}
          </Link>
        </div>
      ) : (
        <div className={gridStyles.grid}>
          {items.map((p) => (
            <div key={p.id}>
              <ProductCard product={p} styles={gridStyles} />
              <button
                className={`${s.btnOutline} ${s.block}`}
                style={{ marginTop: 12, padding: '12px', letterSpacing: '0.2em', fontSize: 10 }}
                onClick={() => moveToCart(p)}
                disabled={!defaultVariant(p) || defaultVariant(p)!.stock <= 0}
              >
                {defaultVariant(p)?.stock ? t('wishlist.moveToCart') : t('common.outOfStock')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
