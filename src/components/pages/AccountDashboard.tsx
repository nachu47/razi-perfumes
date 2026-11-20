'use client';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { signOut } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import s from '@/styles/page.module.css';
import { useStore } from '../providers/StoreProvider';
import { api } from '@/lib/client-api';
import { formatMoney } from '@/lib/money';
import { getCountry, type CountryCode } from '@/lib/countries';
import { AddressFields, errorsFromDetails } from './CheckoutView';
import type { OrderDTO } from '@/lib/order-dto';

type Tab = 'dashboard' | 'orders' | 'addresses' | 'profile' | 'password';
interface Profile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  emailVerified: string | null;
  hasPassword: boolean;
  createdAt: string;
}
interface Address {
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
}

function chip(status: string) {
  if (['DELIVERED', 'PAID', 'CONFIRMED', 'SHIPPED'].includes(status)) return s.chipGreen;
  if (['CANCELLED', 'FAILED', 'REFUNDED'].includes(status)) return s.chipRed;
  return s.chipGold;
}

function OrdersTable({ orders }: { orders: OrderDTO[] }) {
  const t = useTranslations();
  const locale = useLocale();
  if (!orders.length) {
    return (
      <div className={s.center}>
        <p className={s.empty}>{t('account.noOrders')}</p>
        <Link href="/shop" className={s.btn}>
          {t('common.continueShopping')}
        </Link>
      </div>
    );
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className={s.table}>
        <thead>
          <tr>
            <th>{t('order.number')}</th>
            <th>{t('order.date')}</th>
            <th>{t('order.status')}</th>
            <th>{t('order.payment')}</th>
            <th>{t('common.total')}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <strong>{o.orderNumber}</strong>
              </td>
              <td>{new Date(o.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-KW' : 'en-GB')}</td>
              <td>
                <span className={`${s.chip} ${chip(o.orderStatus)}`}>{t(`order.statuses.${o.orderStatus}`)}</span>
              </td>
              <td>
                <span className={`${s.chip} ${chip(o.paymentStatus)}`}>{t(`order.paymentStatuses.${o.paymentStatus}`)}</span>
              </td>
              <td>{formatMoney(o.total, o.currency, locale)}</td>
              <td>
                <Link href={`/account/orders/${o.orderNumber}`} className={s.linkBtn}>
                  {t('account.viewDetails')}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddressBook() {
  const t = useTranslations();
  const { toast, country, locale } = useStore();
  const [list, setList] = useState<Address[] | null>(null);
  const [editing, setEditing] = useState<Address | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api<Address[]>('/api/account/addresses').then(setList).catch(() => setList([])), []);
  useEffect(() => {
    void load();
  }, [load]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setErrors({});
    try {
      const { id, ...body } = editing;
      await api(id ? `/api/account/addresses/${id}` : '/api/account/addresses', { method: id ? 'PUT' : 'POST', body: { ...body, isDefault: Boolean(body.isDefault) } });
      toast(t('toast.addressSaved'));
      setEditing(null);
      await load();
    } catch (err) {
      setErrors(errorsFromDetails(err));
      toast(err instanceof Error ? err.message : t('common.genericError'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await api(`/api/account/addresses/${id}`, { method: 'DELETE' });
      toast(t('toast.addressDeleted'));
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('common.genericError'), 'error');
    }
  };

  const makeDefault = async (a: Address) => {
    const { id, ...body } = a;
    await api(`/api/account/addresses/${id}`, { method: 'PUT', body: { ...body, isDefault: true } }).catch(() => {});
    await load();
  };

  if (editing) {
    return (
      <form onSubmit={save} className={s.form} style={{ maxWidth: 720 }}>
        <AddressFields value={editing} onChange={setEditing} errors={errors} />
        <label className={s.checkbox}>
          <input type="checkbox" checked={Boolean(editing.isDefault)} onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })} />
          {t('account.makeDefault')}
        </label>
        <div className={s.actionsRow}>
          <button className={s.btn} disabled={busy}>
            {busy ? t('common.saving') : t('common.save')}
          </button>
          <button type="button" className={s.btnOutline} onClick={() => setEditing(null)}>
            {t('common.cancel')}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      {list === null ? (
        <div className="spinner" />
      ) : list.length === 0 ? (
        <p className={s.empty}>{t('account.noAddresses')}</p>
      ) : (
        <div className={s.addressGrid}>
          {list.map((a) => (
            <div key={a.id} className={`${s.addressCard} ${a.isDefault ? s.addressCardActive : ''}`}>
              {a.isDefault && <span className={`${s.chip} ${s.chipGold}`}>{t('account.default')}</span>}
              <div style={{ marginTop: 8 }}>
                <strong>{a.fullName}</strong> · {a.phone}
                <br />
                {[a.area, a.block && `${t('checkout.block')} ${a.block}`, a.street, a.building].filter(Boolean).join(', ')}
                <br />
                {a.city}, {locale === 'ar' ? getCountry(a.country).nameAr : getCountry(a.country).nameEn}
              </div>
              <div className={s.actionsRow}>
                <button className={s.linkBtn} onClick={() => setEditing(a)}>
                  {t('common.edit')}
                </button>
                <button className={s.linkBtn} onClick={() => remove(a.id!)}>
                  {t('common.delete')}
                </button>
                {!a.isDefault && (
                  <button className={s.linkBtn} onClick={() => makeDefault(a)}>
                    {t('account.makeDefault')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <button
        className={s.btn}
        style={{ marginTop: 24 }}
        onClick={() => setEditing({ fullName: '', phone: '', country: country.code, city: '', area: '', street: '', building: '' })}
      >
        {t('account.addAddress')}
      </button>
    </div>
  );
}

function ProfileForm({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const t = useTranslations();
  const { toast } = useStore();
  const [name, setName] = useState(profile.name ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/api/account/profile', { method: 'PATCH', body: { name, phone } });
      toast(t('toast.saved'));
      onSaved();
    } catch (err) {
      toast(err instanceof Error ? err.message : t('common.genericError'), 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className={s.form} style={{ maxWidth: 520 }}>
      <div className={s.field}>
        <label className={s.label} htmlFor="pf-name">
          {t('auth.name')}
        </label>
        <input id="pf-name" className={s.input} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
      </div>
      <div className={s.field}>
        <label className={s.label} htmlFor="pf-email">
          {t('auth.email')}
        </label>
        <input id="pf-email" className={s.input} value={profile.email} disabled />
      </div>
      <div className={s.field}>
        <label className={s.label} htmlFor="pf-phone">
          {t('auth.phone')}
        </label>
        <input id="pf-phone" className={s.input} value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
      </div>
      <button className={s.btn} disabled={busy}>
        {busy ? t('common.saving') : t('common.save')}
      </button>
    </form>
  );
}

function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const t = useTranslations();
  const { toast } = useStore();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (next !== confirm) return toast(t('auth.mismatch'), 'error');
    setBusy(true);
    try {
      await api('/api/account/password', { body: { currentPassword: current || undefined, newPassword: next } });
      toast(t('toast.passwordChanged'));
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      toast(err instanceof Error ? err.message : t('common.genericError'), 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className={s.form} style={{ maxWidth: 520 }}>
      {hasPassword && (
        <div className={s.field}>
          <label className={s.label} htmlFor="pw-current">
            {t('account.currentPassword')}
          </label>
          <input id="pw-current" type="password" className={s.input} value={current} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" />
        </div>
      )}
      <div className={s.field}>
        <label className={s.label} htmlFor="pw-new">
          {t('auth.newPassword')}
        </label>
        <input id="pw-new" type="password" className={s.input} value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} autoComplete="new-password" />
      </div>
      <div className={s.field}>
        <label className={s.label} htmlFor="pw-confirm">
          {t('auth.confirmPassword')}
        </label>
        <input id="pw-confirm" type="password" className={s.input} value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} autoComplete="new-password" />
      </div>
      <button className={s.btn} disabled={busy}>
        {busy ? t('common.saving') : t('auth.resetButton')}
      </button>
    </form>
  );
}

export default function AccountDashboard() {
  const t = useTranslations();
  const locale = useLocale();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user, toast } = useStore();
  const tab = (params.get('tab') as Tab) || 'dashboard';
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<OrderDTO[] | null>(null);

  const loadProfile = useCallback(() => api<Profile>('/api/account/profile').then(setProfile).catch(() => {}), []);
  useEffect(() => {
    void loadProfile();
    api<OrderDTO[]>('/api/account/orders').then(setOrders).catch(() => setOrders([]));
  }, [loadProfile]);

  const verified = params.get('verified');
  const setTab = (next: Tab) => router.replace(next === 'dashboard' ? pathname : `${pathname}?tab=${next}`, { scroll: false });

  const logout = async () => {
    await signOut({ redirect: false });
    toast(t('toast.signedOut'));
    window.location.assign(locale === 'ar' ? '/ar' : '/');
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: t('account.dashboard') },
    { id: 'orders', label: t('account.orders') },
    { id: 'addresses', label: t('account.addresses') },
    { id: 'profile', label: t('account.profile') },
    { id: 'password', label: t('account.password') },
  ];

  return (
    <div className={s.container}>
      <nav className={s.breadcrumbs}>
        <Link href="/">{t('common.home')}</Link>
        <span className={s.separator}>/</span>
        <span className={s.current}>{t('account.title')}</span>
      </nav>
      <header className={s.pageHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className={s.title}>{t('account.title')}</h1>
          <p className={s.muted}>{t('account.hello', { name: profile?.name || user?.name || user?.email || '' })}</p>
        </div>
        <div className={s.actionsRow}>
          {user?.role === 'ADMIN' && (
            <a href="/admin" className={s.btnGold}>
              {t('account.admin')}
            </a>
          )}
          <button className={s.btnOutline} onClick={logout}>
            {t('auth.signOut')}
          </button>
        </div>
      </header>

      {verified === '1' && <div className={s.alertSuccess} style={{ marginBottom: 24 }}>{t('account.verified')}</div>}
      {verified === '0' && <div className={s.alertError} style={{ marginBottom: 24 }}>{t('account.verifyFailed')}</div>}
      {profile && !profile.emailVerified && !verified && <div className={s.alert} style={{ marginBottom: 24 }}>{t('account.unverified')}</div>}

      <div className={s.tabs} role="tablist">
        {tabs.map((x) => (
          <button key={x.id} role="tab" aria-selected={tab === x.id} className={`${s.tab} ${tab === x.id ? s.tabActive : ''}`} onClick={() => setTab(x.id)}>
            {x.label}
          </button>
        ))}
        <Link href="/wishlist" className={s.tab}>
          {t('account.wishlist')}
        </Link>
      </div>

      {tab === 'dashboard' && (
        <div className={s.form} style={{ gap: 32 }}>
          {profile && (
            <p className={s.muted}>
              {t('account.memberSince', { date: new Date(profile.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-KW' : 'en-GB', { year: 'numeric', month: 'long' }) })}
            </p>
          )}
          <section>
            <h2 className={s.sectionTitle}>{t('account.recentOrders')}</h2>
            {orders === null ? <div className="spinner" /> : <OrdersTable orders={orders.slice(0, 5)} />}
          </section>
        </div>
      )}
      {tab === 'orders' && (orders === null ? <div className="spinner" /> : <OrdersTable orders={orders} />)}
      {tab === 'addresses' && <AddressBook />}
      {tab === 'profile' && (profile ? <ProfileForm profile={profile} onSaved={loadProfile} /> : <div className="spinner" />)}
      {tab === 'password' && (profile ? <PasswordForm hasPassword={profile.hasPassword} /> : <div className="spinner" />)}
    </div>
  );
}
