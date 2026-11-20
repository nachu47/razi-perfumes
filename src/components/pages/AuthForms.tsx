'use client';
import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import s from '@/styles/page.module.css';
import { api } from '@/lib/client-api';
import { errorsFromDetails } from './CheckoutView';

/** Only allow same-site relative redirects; add the /ar prefix for Arabic storefront pages. */
export function safeCallback(raw: string | null, locale: string, fallback = '/account'): string {
  let url = raw && raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\') ? raw : fallback;
  if (locale === 'ar' && !url.startsWith('/ar') && !url.startsWith('/admin')) url = `/ar${url === '/' ? '' : url}`;
  return url;
}

function GoogleButton({ callbackUrl }: { callbackUrl: string }) {
  const t = useTranslations('auth');
  return (
    <>
      <div className={s.divider}>{t('or')}</div>
      <button type="button" className={`${s.btnOutline} ${s.block}`} onClick={() => signIn('google', { redirectTo: callbackUrl })}>
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {t('google')}
      </button>
    </>
  );
}

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const params = useSearchParams();
  const callbackUrl = safeCallback(params.get('callbackUrl'), locale);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(params.get('error') === 'admin_only' ? t('adminOnly') : params.get('error') ? t('invalid') : '');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await signIn('credentials', { email, password, redirect: false });
    if (!res || res.error) {
      setError(t('invalid'));
      setBusy(false);
      return;
    }
    // Full navigation so server components pick up the new session (and the guest cart merges)
    window.location.assign(callbackUrl);
  };

  return (
    <form onSubmit={submit} className={s.form}>
      {error && <div className={s.alertError} role="alert">{error}</div>}
      <div className={s.field}>
        <label className={s.label} htmlFor="login-email">
          {t('email')}
        </label>
        <input id="login-email" type="email" required className={s.input} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <div className={s.field}>
        <label className={s.label} htmlFor="login-password">
          {t('password')}
        </label>
        <input id="login-password" type="password" required className={s.input} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </div>
      <div style={{ textAlign: 'end' }}>
        <Link href="/account/forgot-password" className={s.linkBtn}>
          {t('forgot')}
        </Link>
      </div>
      <button className={`${s.btn} ${s.block}`} disabled={busy}>
        {busy ? t('signingIn') : t('signIn')}
      </button>
      {googleEnabled && <GoogleButton callbackUrl={callbackUrl} />}
      <p className={s.center} style={{ fontSize: 13, marginTop: 8 }}>
        {t('noAccount')}{' '}
        <Link href={`/account/register${params.get('callbackUrl') ? `?callbackUrl=${encodeURIComponent(params.get('callbackUrl')!)}` : ''}`} className={s.linkBtn}>
          {t('register')}
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ googleEnabled }: { googleEnabled: boolean }) {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const locale = useLocale();
  const params = useSearchParams();
  const callbackUrl = safeCallback(params.get('callbackUrl'), locale);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setErrors({});
    try {
      await api('/api/account/register', { body: { ...form, locale } });
      const res = await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      if (res?.error) throw new Error(tc('genericError'));
      window.location.assign(callbackUrl);
    } catch (err) {
      setErrors(errorsFromDetails(err));
      setError(err instanceof Error ? err.message : tc('genericError'));
      setBusy(false);
    }
  };

  const field = (k: keyof typeof form, label: string, type: string, autoComplete: string, required = true) => (
    <div className={s.field}>
      <label className={s.label} htmlFor={`reg-${k}`}>
        {label}
      </label>
      <input id={`reg-${k}`} type={type} required={required} className={s.input} value={form[k]} onChange={set(k)} autoComplete={autoComplete} minLength={k === 'password' ? 8 : undefined} />
      {k === 'password' && !errors.password && <span className={s.muted} style={{ fontSize: 11 }}>{t('passwordHint')}</span>}
      {errors[k] && <span className={s.fieldError}>{errors[k]}</span>}
    </div>
  );

  return (
    <form onSubmit={submit} className={s.form}>
      {error && <div className={s.alertError} role="alert">{error}</div>}
      {field('name', t('name'), 'text', 'name')}
      {field('email', t('email'), 'email', 'email')}
      {field('phone', t('phone'), 'tel', 'tel', false)}
      {field('password', t('password'), 'password', 'new-password')}
      <button className={`${s.btn} ${s.block}`} disabled={busy}>
        {busy ? t('registering') : t('register')}
      </button>
      {googleEnabled && <GoogleButton callbackUrl={callbackUrl} />}
      <p className={s.center} style={{ fontSize: 13, marginTop: 8 }}>
        {t('haveAccount')}{' '}
        <Link href="/account/login" className={s.linkBtn}>
          {t('signIn')}
        </Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/account/forgot-password', { body: { email, locale } });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '');
    } finally {
      setBusy(false);
    }
  };

  if (sent) return <div className={s.alertSuccess}>{t('linkSent')}</div>;
  return (
    <form onSubmit={submit} className={s.form}>
      {error && <div className={s.alertError}>{error}</div>}
      <div className={s.field}>
        <label className={s.label} htmlFor="fp-email">
          {t('email')}
        </label>
        <input id="fp-email" type="email" required className={s.input} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <button className={`${s.btn} ${s.block}`} disabled={busy}>
        {t('sendLink')}
      </button>
      <p className={s.center}>
        <Link href="/account/login" className={s.linkBtn}>
          {t('signIn')}
        </Link>
      </p>
    </form>
  );
}

export function ResetForm() {
  const t = useTranslations('auth');
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError(t('mismatch'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('/api/account/reset-password', { body: { token, password } });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className={s.form}>
        <div className={s.alertSuccess}>{t('resetDone')}</div>
        <Link href="/account/login" className={`${s.btn} ${s.block}`}>
          {t('signIn')}
        </Link>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className={s.form}>
      {error && <div className={s.alertError}>{error}</div>}
      <div className={s.field}>
        <label className={s.label} htmlFor="rp-pw">
          {t('newPassword')}
        </label>
        <input id="rp-pw" type="password" required minLength={8} className={s.input} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        <span className={s.muted} style={{ fontSize: 11 }}>{t('passwordHint')}</span>
      </div>
      <div className={s.field}>
        <label className={s.label} htmlFor="rp-pw2">
          {t('confirmPassword')}
        </label>
        <input id="rp-pw2" type="password" required minLength={8} className={s.input} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
      </div>
      <button className={`${s.btn} ${s.block}`} disabled={busy || !token}>
        {t('resetButton')}
      </button>
    </form>
  );
}
