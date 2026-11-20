'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import SidebarDrawer from './SidebarDrawer';
import { useStore } from './providers/StoreProvider';
import { api } from '@/lib/client-api';
import { pick } from '@/lib/site';
import type { CollectionDTO } from '@/lib/catalog';
import d from './Drawers.module.css';

/* ───────────────────────── Shop menu (left drawer) ───────────────────────── */
export function ShopMenuDrawer({ collections }: { collections: CollectionDTO[] }) {
  const t = useTranslations();
  const { menuOpen, setMenuOpen, locale, user } = useStore();
  const close = () => setMenuOpen(false);
  return (
    <SidebarDrawer isOpen={menuOpen} onClose={close} title={t('common.shop')} rightAlign={false}>
      <nav className={d.menu}>
        <Link href="/shop" onClick={close} className={d.menuLinkStrong}>
          {t('common.shopAll')}
        </Link>
        <Link href="/shop?featured=1" onClick={close} className={d.menuLink}>
          {t('filters.luxuryLine')}
        </Link>
        <span className={d.menuHeading}>{t('common.collections')}</span>
        {collections.map((c) => (
          <Link key={c.id} href={`/collection/${c.slug}`} onClick={close} className={d.menuLink}>
            {pick(locale, c.nameEn, c.nameAr)}
          </Link>
        ))}
        <span className={d.menuHeading} />
        <Link href={user ? '/account' : '/account/login'} onClick={close} className={d.menuLink}>
          {t('common.account')}
        </Link>
        <Link href="/wishlist" onClick={close} className={d.menuLink}>
          {t('common.wishlist')}
        </Link>
        <Link href="/locations" onClick={close} className={d.menuLink}>
          {t('footer.locations')}
        </Link>
        <Link href="/contact" onClick={close} className={d.menuLink}>
          {t('footer.contact')}
        </Link>
      </nav>
    </SidebarDrawer>
  );
}

/* ───────────────────────── Search (live suggestions) ───────────────────────── */
interface Suggestion {
  slug: string;
  nameEn: string;
  nameAr: string;
  image: string | null;
  priceFromKWD: number;
}

export function SearchDrawer() {
  const t = useTranslations('common');
  const { searchOpen, setSearchOpen, locale, price } = useStore();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<{ items: Suggestion[]; total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 350);
  }, [searchOpen]);

  // Debounced live search; aborts stale requests
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults(null);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await api(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal }));
      } catch {
        /* aborted or failed */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  const close = () => setSearchOpen(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    close();
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <SidebarDrawer isOpen={searchOpen} onClose={close} title={t('search')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <form onSubmit={submit} role="search">
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            className={d.searchInput}
          />
        </form>
        {!results && !loading && <p className={d.hint}>{t('searchHint')}</p>}
        {loading && <div className="spinner" />}
        {results && !loading && results.items.length === 0 && <p className={d.hint}>{t('searchNoResults', { q: q.trim() })}</p>}
        {results && results.items.length > 0 && (
          <ul className={d.suggestions}>
            {results.items.map((s) => (
              <li key={s.slug}>
                <Link href={`/product/${s.slug}`} onClick={close} className={d.suggestion}>
                  <span className={d.thumb}>{s.image && <Image src={s.image} alt="" width={64} height={80} />}</span>
                  <span>
                    <span className={d.itemName}>{pick(locale, s.nameEn, s.nameAr)}</span>
                    <span className={d.itemPrice}>{price(s.priceFromKWD)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {results && results.total > results.items.length && (
          <Link href={`/search?q=${encodeURIComponent(q.trim())}`} onClick={close} className={d.primaryBtn}>
            {t('searchViewAll', { count: results.total })}
          </Link>
        )}
      </div>
    </SidebarDrawer>
  );
}

/* ───────────────────────── Cart drawer ───────────────────────── */
export function QtyStepper({ value, onChange, max = 20 }: { value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <div className={d.qty}>
      <button onClick={() => onChange(value - 1)} disabled={value <= 1} aria-label="Decrease quantity">
        -
      </button>
      <span aria-live="polite">{value}</span>
      <button onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        +
      </button>
    </div>
  );
}

export function CartDrawer() {
  const t = useTranslations();
  const { cart, cartOpen, setCartOpen, locale, money, updateCartItem, removeCartItem, cartLoading } = useStore();
  const router = useRouter();
  const close = () => setCartOpen(false);
  const items = cart?.items ?? [];

  return (
    <SidebarDrawer isOpen={cartOpen} onClose={close} title={t('common.basket')}>
      {cartLoading && !cart ? (
        <div className="spinner" />
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <p className={d.hint} style={{ textAlign: 'center' }}>
            {t('common.emptyBasket')}
          </p>
          <Link href="/shop" onClick={close} className={d.primaryBtn} style={{ marginTop: 24 }}>
            {t('common.continueShopping')}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {items.map((item) => (
              <div key={item.cartItemId} className={d.line}>
                <Link href={`/product/${item.slug}`} onClick={close} className={d.lineImage}>
                  {item.image && <Image src={item.image} alt={pick(locale, item.nameEn, item.nameAr)} width={80} height={100} />}
                </Link>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <h4 className={d.lineName}>{pick(locale, item.nameEn, item.nameAr)}</h4>
                      <button onClick={() => removeCartItem(item.cartItemId!)} className={d.remove} aria-label={t('common.remove')}>
                        ✕
                      </button>
                    </div>
                    <p className={d.lineSize}>{item.label}</p>
                    {(!item.available || item.stock < item.quantity) && (
                      <p className={d.warn}>{!item.available ? t('cart.unavailable') : item.stock > 0 ? t('common.onlyLeft', { count: item.stock }) : t('common.outOfStock')}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <QtyStepper value={item.quantity} max={Math.min(20, Math.max(item.stock, 1))} onChange={(q) => updateCartItem(item.cartItemId!, q)} />
                    <p className={d.linePrice}>{money(item.lineTotal, cart!.currency)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--light-gray)', paddingTop: '24px', marginTop: 'auto' }}>
            {cart!.discount > 0 && (
              <div className={d.row}>
                <span>
                  {t('common.discount')} ({cart!.coupon?.code})
                </span>
                <span>- {money(cart!.discount, cart!.currency)}</span>
              </div>
            )}
            {cart!.shipping.remainingForFree !== null && cart!.shipping.remainingForFree > 0 && (
              <p className={d.hint} style={{ marginBottom: 12, fontSize: 13 }}>
                {t('common.freeShippingRemaining', { amount: money(cart!.shipping.remainingForFree, cart!.currency) })}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em' }}>{t('common.total')}</span>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gold-dark)' }}>{money(cart!.subtotal - cart!.discount, cart!.currency)}</span>
            </div>
            <button
              onClick={() => {
                close();
                router.push('/checkout');
              }}
              className={d.checkoutBtn}
            >
              {t('common.proceedToCheckout')}
            </button>
            <Link href="/cart" onClick={close} className={d.secondaryLink}>
              {t('common.viewBasket')}
            </Link>
          </div>
        </div>
      )}
    </SidebarDrawer>
  );
}
