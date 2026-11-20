'use client';
import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import s from '@/styles/page.module.css';
import { useStore } from '../providers/StoreProvider';
import { QtyStepper } from '../Drawers';
import { pick } from '@/lib/site';

export function CouponForm() {
  const t = useTranslations('common');
  const { cart, applyCoupon, removeCoupon } = useStore();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    if (await applyCoupon(code.trim())) setCode('');
    setBusy(false);
  };
  if (cart?.coupon?.valid) {
    return (
      <div className={s.alertSuccess} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span>{t('couponApplied', { code: cart.coupon.code })}</span>
        <button className={s.linkBtn} onClick={() => removeCoupon()}>
          {t('removeCoupon')}
        </button>
      </div>
    );
  }
  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8 }}>
      <input className={s.input} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t('couponCode')} aria-label={t('couponCode')} maxLength={40} />
      <button className={s.btnOutline} disabled={busy} style={{ padding: '0 18px', letterSpacing: '0.15em' }}>
        {t('apply')}
      </button>
    </form>
  );
}

export default function CartView() {
  const t = useTranslations();
  const { cart, cartLoading, locale, money, updateCartItem, removeCartItem, country } = useStore();
  const items = cart?.items ?? [];

  return (
    <div className={s.container}>
      <nav className={s.breadcrumbs}>
        <Link href="/">{t('common.home')}</Link>
        <span className={s.separator}>/</span>
        <span className={s.current}>{t('cart.title')}</span>
      </nav>
      <header className={s.pageHeader}>
        <h1 className={s.title}>{t('cart.title')}</h1>
      </header>

      {cartLoading && !cart ? (
        <div className="spinner" />
      ) : items.length === 0 ? (
        <div className={s.center}>
          <p className={s.empty}>{t('common.emptyBasket')}</p>
          <Link href="/shop" className={s.btn}>
            {t('common.continueShopping')}
          </Link>
        </div>
      ) : (
        <div className={s.twoCol}>
          <div className={s.lines}>
            {items.map((item) => {
              const name = pick(locale, item.nameEn, item.nameAr);
              return (
                <div key={item.cartItemId} className={s.line}>
                  <Link href={`/product/${item.slug}`} className={s.thumb}>
                    {item.image && <Image src={item.image} alt={name} width={90} height={112} />}
                  </Link>
                  <div>
                    <Link href={`/product/${item.slug}`} className={s.lineName}>
                      {name}
                    </Link>
                    <p className={s.lineMeta}>
                      {item.label} · {money(item.unitPrice, cart!.currency)}
                    </p>
                    {(!item.available || item.stock < item.quantity) && (
                      <p className={s.fieldError}>
                        {!item.available ? t('cart.unavailable') : item.stock > 0 ? t('common.onlyLeft', { count: item.stock }) : t('common.outOfStock')}
                      </p>
                    )}
                    <div className={s.actionsRow}>
                      <QtyStepper value={item.quantity} max={Math.min(20, Math.max(item.stock, 1))} onChange={(q) => updateCartItem(item.cartItemId!, q)} />
                      <button className={s.linkBtn} onClick={() => removeCartItem(item.cartItemId!)}>
                        {t('common.remove')}
                      </button>
                    </div>
                  </div>
                  <span className={s.linePrice}>{money(item.lineTotal, cart!.currency)}</span>
                </div>
              );
            })}
            <div style={{ marginTop: 28 }}>
              <Link href="/shop" className={s.linkBtn}>
                ← {t('common.continueShopping')}
              </Link>
            </div>
          </div>

          <aside className={`${s.card} ${s.sticky}`}>
            <h2 className={s.sectionTitle}>{t('cart.summary')}</h2>
            <CouponForm />
            <div style={{ marginTop: 20 }}>
              <div className={s.row}>
                <span>{t('common.subtotal')}</span>
                <span>{money(cart!.subtotal, cart!.currency)}</span>
              </div>
              {cart!.discount > 0 && (
                <div className={s.row}>
                  <span>{t('common.discount')}</span>
                  <span>- {money(cart!.discount, cart!.currency)}</span>
                </div>
              )}
              <div className={s.row}>
                <span>{t('cart.estimatedShipping', { country: locale === 'ar' ? country.nameAr : country.nameEn })}</span>
                <span>{cart!.shippingFee > 0 ? money(cart!.shippingFee, cart!.currency) : t('common.free')}</span>
              </div>
              <div className={s.totalRow}>
                <span>{t('common.total')}</span>
                <span>{money(cart!.total, cart!.currency)}</span>
              </div>
              {cart!.shipping.remainingForFree !== null && cart!.shipping.remainingForFree > 0 ? (
                <p className={s.muted} style={{ marginTop: 12 }}>
                  {t('common.freeShippingRemaining', { amount: money(cart!.shipping.remainingForFree, cart!.currency) })}
                </p>
              ) : cart!.shipping.freeThreshold !== null ? (
                <p className={s.muted} style={{ marginTop: 12 }}>
                  {t('common.freeShippingUnlocked')}
                </p>
              ) : null}
              <p className={s.muted} style={{ marginTop: 8, fontSize: 12 }}>
                {t('cart.taxesNote')}
              </p>
              <Link href="/checkout" className={`${s.btn} ${s.block}`} style={{ marginTop: 20 }}>
                {t('common.proceedToCheckout')}
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
