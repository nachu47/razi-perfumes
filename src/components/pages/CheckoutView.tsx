'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import s from '@/styles/page.module.css';
import { useStore } from '../providers/StoreProvider';
import { api, ClientApiError } from '@/lib/client-api';
import { COUNTRIES, type CountryCode } from '@/lib/countries';
import { pick } from '@/lib/site';
import type { Quote } from '@/lib/pricing';

type Address = {
  id?: string;
  fullName: string;
  phone: string;
  country: CountryCode;
  city: string;
  area: string;
  block?: string;
  street: string;
  building: string;
  floor?: string;
  apartment?: string;
  notes?: string;
  isDefault?: boolean;
};

const emptyAddress = (country: CountryCode): Address => ({
  fullName: '', phone: '', country, city: '', area: '', block: '', street: '', building: '', floor: '', apartment: '', notes: '',
});

type QuoteResponse = Quote & { paymentMethods: string[] };

export function AddressFields({
  value,
  onChange,
  errors,
  prefix = 'address',
}: {
  value: Address;
  onChange: (a: Address) => void;
  errors: Record<string, string>;
  prefix?: string;
}) {
  const t = useTranslations('checkout');
  const { locale } = useStore();
  const set = (k: keyof Address) => (e: { target: { value: string } }) => onChange({ ...value, [k]: e.target.value });
  const err = (k: string) => errors[`${prefix}.${k}`] && <span className={s.fieldError}>{errors[`${prefix}.${k}`]}</span>;
  const field = (k: keyof Address, label: string, opts: { required?: boolean; type?: string; autoComplete?: string } = {}) => (
    <div className={s.field}>
      <label className={s.label} htmlFor={`${prefix}-${k}`}>
        {label}
        {opts.required ? ' *' : ''}
      </label>
      <input
        id={`${prefix}-${k}`}
        className={s.input}
        value={(value[k] as string) ?? ''}
        onChange={set(k)}
        required={opts.required}
        type={opts.type ?? 'text'}
        autoComplete={opts.autoComplete}
      />
      {err(k)}
    </div>
  );
  return (
    <div className={s.form}>
      <div className={s.grid2}>
        {field('fullName', t('fullName'), { required: true, autoComplete: 'name' })}
        {field('phone', t('phone'), { required: true, type: 'tel', autoComplete: 'tel' })}
      </div>
      <div className={s.grid2}>
        <div className={s.field}>
          <label className={s.label} htmlFor={`${prefix}-country`}>
            {t('country')} *
          </label>
          <select id={`${prefix}-country`} className={s.select} value={value.country} onChange={set('country')}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {locale === 'ar' ? c.nameAr : c.nameEn}
              </option>
            ))}
          </select>
        </div>
        {field('city', t('city'), { required: true, autoComplete: 'address-level1' })}
      </div>
      <div className={s.grid2}>
        {field('area', t('area'), { required: true, autoComplete: 'address-level2' })}
        {field('block', t('block'))}
      </div>
      <div className={s.grid2}>
        {field('street', t('street'), { required: true, autoComplete: 'address-line1' })}
        {field('building', t('building'), { required: true })}
      </div>
      <div className={s.grid2}>
        {field('floor', t('floor'))}
        {field('apartment', t('apartment'))}
      </div>
      <div className={s.field}>
        <label className={s.label} htmlFor={`${prefix}-notes`}>
          {t('notes')}
        </label>
        <textarea id={`${prefix}-notes`} className={s.textarea} style={{ minHeight: 70 }} value={value.notes ?? ''} onChange={set('notes')} maxLength={500} />
      </div>
    </div>
  );
}

export function errorsFromDetails(err: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (err instanceof ClientApiError && Array.isArray(err.details)) {
    for (const d of err.details as { path: string; message: string }[]) out[d.path] = d.message;
  }
  return out;
}

export default function CheckoutView() {
  const t = useTranslations();
  const params = useSearchParams();
  const { user, country, locale, money, refreshCart, cart } = useStore();
  const buyNowId = params.get('buyNow');
  const buyNow = buyNowId ? { variantId: buyNowId, quantity: Math.min(20, Math.max(1, Number(params.get('qty')) || 1)) } : undefined;

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState<string>('new');
  const [address, setAddress] = useState<Address>(emptyAddress(country.code));
  const [saveAddress, setSaveAddress] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [couponInput, setCouponInput] = useState('');
  const [couponCode, setCouponCode] = useState<string | undefined>(undefined);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [placing, setPlacing] = useState(false);

  // Prefill contact + saved addresses for signed-in customers
  useEffect(() => {
    if (!user) return;
    api<{ email: string; phone: string | null; name: string | null }>('/api/account/profile')
      .then((p) => {
        setEmail((e) => e || p.email);
        setPhone((ph) => ph || p.phone || '');
        setAddress((a) => (a.fullName ? a : { ...a, fullName: p.name ?? '', phone: p.phone ?? '' }));
      })
      .catch(() => {});
    api<Address[]>('/api/account/addresses')
      .then((list) => {
        setAddresses(list);
        const def = list.find((a) => a.isDefault) ?? list[0];
        if (def?.id) {
          setSelected(def.id);
          setAddress({ ...emptyAddress(country.code), ...def });
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Re-price whenever the delivery country, coupon or basket changes
  const loadQuote = useCallback(async () => {
    try {
      const q = await api<QuoteResponse>('/api/checkout/quote', {
        body: { country: address.country, couponCode: couponCode ?? '', buyNow },
      });
      setQuote(q);
      if (!q.paymentMethods.includes(paymentMethod)) setPaymentMethod('COD');
    } catch (e) {
      setFormError(e instanceof Error ? e.message : t('common.genericError'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address.country, couponCode, buyNowId, params.get('qty'), cart?.count, cart?.coupon?.code]);

  useEffect(() => {
    void loadQuote();
  }, [loadQuote]);

  const chooseAddress = (id: string) => {
    setSelected(id);
    const a = addresses.find((x) => x.id === id);
    setAddress(a ? { ...emptyAddress(country.code), ...a } : { ...emptyAddress(address.country), fullName: address.fullName, phone: address.phone });
  };

  const applyCoupon = (e: FormEvent) => {
    e.preventDefault();
    setCouponCode(couponInput.trim().toUpperCase());
  };

  const placeOrder = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setFormError('');
    setPlacing(true);
    try {
      const { id: _id, isDefault: _d, ...addr } = address;
      const res = await api<{ redirectUrl: string }>('/api/checkout', {
        body: {
          email,
          phone: phone || address.phone,
          address: addr,
          saveAddress: Boolean(user) && selected === 'new' && saveAddress,
          paymentMethod,
          couponCode: couponCode ?? (buyNow ? '' : (cart?.coupon?.valid ? cart.coupon.code : '')),
          locale,
          buyNow,
        },
      });
      if (!buyNow) void refreshCart();
      window.location.assign(res.redirectUrl);
    } catch (err) {
      setErrors(errorsFromDetails(err));
      setFormError(err instanceof Error ? err.message : t('common.genericError'));
      setPlacing(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const items = quote?.items ?? [];
  const isEmpty = quote !== null && items.length === 0;
  const payLabel = quote ? money(quote.total, quote.currency) : '';

  return (
    <div className={s.container}>
      <nav className={s.breadcrumbs}>
        <Link href="/">{t('common.home')}</Link>
        <span className={s.separator}>/</span>
        <Link href="/cart">{t('cart.title')}</Link>
        <span className={s.separator}>/</span>
        <span className={s.current}>{t('checkout.title')}</span>
      </nav>
      <header className={s.pageHeader}>
        <h1 className={s.title}>{t('checkout.title')}</h1>
        {buyNow && <p className={s.muted}>{t('checkout.buyNowNote')}</p>}
      </header>

      {quote === null ? (
        <div className="spinner" />
      ) : isEmpty ? (
        <div className={s.center}>
          <p className={s.empty}>{t('checkout.empty')}</p>
          <Link href="/shop" className={s.btn}>
            {t('common.continueShopping')}
          </Link>
        </div>
      ) : (
        <form onSubmit={placeOrder} className={s.twoCol} noValidate={false}>
          <div className={s.form} style={{ gap: 36 }}>
            {formError && <div className={s.alertError} role="alert">{formError}</div>}

            <section>
              <h2 className={s.sectionTitle}>{t('checkout.contact')}</h2>
              {!user && (
                <p className={s.muted} style={{ marginBottom: 14 }}>
                  {t('checkout.guestNote')}{' '}
                  <Link href={`/account/login?callbackUrl=${encodeURIComponent('/checkout' + (buyNow ? `?buyNow=${buyNow.variantId}&qty=${buyNow.quantity}` : ''))}`} className={s.linkBtn}>
                    {t('checkout.signInPrompt')}
                  </Link>
                </p>
              )}
              <div className={s.grid2}>
                <div className={s.field}>
                  <label className={s.label} htmlFor="co-email">
                    {t('checkout.email')} *
                  </label>
                  <input id="co-email" type="email" required className={s.input} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                  {errors.email && <span className={s.fieldError}>{errors.email}</span>}
                </div>
                <div className={s.field}>
                  <label className={s.label} htmlFor="co-phone">
                    {t('checkout.phone')} *
                  </label>
                  <input id="co-phone" type="tel" required className={s.input} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder={country.phonePrefix} />
                  {errors.phone && <span className={s.fieldError}>{errors.phone}</span>}
                </div>
              </div>
            </section>

            <section>
              <h2 className={s.sectionTitle}>{t('checkout.shippingAddress')}</h2>
              {addresses.length > 0 && (
                <div className={s.options} style={{ marginBottom: 20 }}>
                  {addresses.map((a) => (
                    <label key={a.id} className={`${s.option} ${selected === a.id ? s.optionActive : ''}`}>
                      <input type="radio" name="addr" checked={selected === a.id} onChange={() => chooseAddress(a.id!)} />
                      <span>
                        <span className={s.optionTitle}>{a.fullName}</span>
                        <span className={s.optionHint} style={{ display: 'block' }}>
                          {[a.area, a.block && `Block ${a.block}`, a.street, a.building, a.city, a.country].filter(Boolean).join(', ')}
                        </span>
                      </span>
                    </label>
                  ))}
                  <label className={`${s.option} ${selected === 'new' ? s.optionActive : ''}`}>
                    <input type="radio" name="addr" checked={selected === 'new'} onChange={() => chooseAddress('new')} />
                    <span className={s.optionTitle}>{t('checkout.newAddress')}</span>
                  </label>
                </div>
              )}
              {(selected === 'new' || addresses.length === 0) && (
                <>
                  <AddressFields value={address} onChange={setAddress} errors={errors} />
                  {user && (
                    <label className={s.checkbox} style={{ marginTop: 14 }}>
                      <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                      {t('checkout.saveAddress')}
                    </label>
                  )}
                </>
              )}
              {!quote.shipping.available && <p className={s.alertError} style={{ marginTop: 14 }}>{t('checkout.noShipping')}</p>}
            </section>

            <section>
              <h2 className={s.sectionTitle}>{t('checkout.payment')}</h2>
              <div className={s.options}>
                {quote.paymentMethods.map((m) => (
                  <label key={m} className={`${s.option} ${paymentMethod === m ? s.optionActive : ''}`}>
                    <input type="radio" name="payment" value={m} checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} />
                    <span>
                      <span className={s.optionTitle}>{t(`checkout.methods.${m}`)}</span>
                      <span className={s.optionHint} style={{ display: 'block' }}>
                        {t(`checkout.methodHints.${m}`)}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <p className={s.muted} style={{ marginTop: 12 }}>
                {t('checkout.chargedIn', { currency: quote.currency })}
              </p>
            </section>
          </div>

          <aside className={`${s.card} ${s.sticky}`}>
            <h2 className={s.sectionTitle}>{t('cart.summary')}</h2>
            <div className={s.lines} style={{ marginBottom: 16 }}>
              {items.map((i) => (
                <div key={i.variantId} className={`${s.line} ${s.lineSmall}`}>
                  <div className={s.thumb} style={{ overflow: 'visible' }}>
                    {i.image && <Image src={i.image} alt="" width={64} height={80} />}
                    <span className={s.qtyBadge}>{i.quantity}</span>
                  </div>
                  <div>
                    <div className={s.lineName} style={{ fontSize: 11 }}>
                      {pick(locale, i.nameEn, i.nameAr)}
                    </div>
                    <div className={s.lineMeta}>{i.label}</div>
                    {i.quantity > i.stock && (
                      <div className={s.fieldError}>{i.stock > 0 ? t('common.onlyLeft', { count: i.stock }) : t('common.outOfStock')}</div>
                    )}
                  </div>
                  <span className={s.linePrice}>{money(i.lineTotal, quote.currency)}</span>
                </div>
              ))}
            </div>

            {quote.coupon?.valid ? (
              <div className={s.alertSuccess}>{t('common.couponApplied', { code: quote.coupon.code })}</div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className={s.input} value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder={t('common.couponCode')} aria-label={t('common.couponCode')} maxLength={40} />
                  <button type="button" className={s.btnOutline} style={{ padding: '0 18px', letterSpacing: '0.15em' }} onClick={applyCoupon}>
                    {t('common.apply')}
                  </button>
                </div>
                {quote.coupon && !quote.coupon.valid && <p className={s.fieldError} style={{ marginTop: 6 }}>{quote.coupon.error}</p>}
              </div>
            )}

            <div style={{ marginTop: 18 }}>
              <div className={s.row}>
                <span>{t('common.subtotal')}</span>
                <span>{money(quote.subtotal, quote.currency)}</span>
              </div>
              {quote.discount > 0 && (
                <div className={s.row}>
                  <span>{t('common.discount')}</span>
                  <span>- {money(quote.discount, quote.currency)}</span>
                </div>
              )}
              <div className={s.row}>
                <span>
                  {t('common.shipping')}
                  {quote.shipping.estimatedDays && (
                    <span className={s.muted} style={{ display: 'block', fontSize: 11 }}>
                      {t('common.deliveryEstimate', { days: quote.shipping.estimatedDays })}
                    </span>
                  )}
                </span>
                <span>{quote.shippingFee > 0 ? money(quote.shippingFee, quote.currency) : t('common.free')}</span>
              </div>
              <div className={s.totalRow}>
                <span>{t('common.total')}</span>
                <span>{money(quote.total, quote.currency)}</span>
              </div>
            </div>

            <button type="submit" className={`${s.btn} ${s.block}`} style={{ marginTop: 22 }} disabled={placing || !quote.shipping.available}>
              {placing ? t('checkout.placing') : paymentMethod === 'COD' ? t('checkout.placeOrder') : t('checkout.payNow', { amount: payLabel })}
            </button>
            <p className={s.muted} style={{ marginTop: 12, fontSize: 11, textAlign: 'center' }}>
              {t('checkout.agree')}
            </p>
          </aside>
        </form>
      )}
    </div>
  );
}
