'use client';
import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import s from '@/styles/page.module.css';
import { useStore } from '../providers/StoreProvider';
import { api } from '@/lib/client-api';
import { errorsFromDetails } from './CheckoutView';

export default function ContactForm() {
  const t = useTranslations('contact');
  const tc = useTranslations();
  const { toast } = useStore();
  const empty = { name: '', email: '', phone: '', subject: '', message: '', website: '' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await api('/api/contact', { body: form });
      setSent(true);
      setForm(empty);
      toast(tc('toast.messageSent'));
    } catch (err) {
      setErrors(errorsFromDetails(err));
      toast(err instanceof Error ? err.message : tc('common.genericError'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const err = (k: string) => errors[k] && <span className={s.fieldError}>{errors[k]}</span>;

  if (sent) {
    return (
      <div className={s.form}>
        <div className={s.alertSuccess}>{tc('toast.messageSent')}</div>
        <button className={s.btnOutline} onClick={() => setSent(false)}>
          {t('send')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={s.form}>
      <div className={s.grid2}>
        <div className={s.field}>
          <label className={s.label} htmlFor="c-name">{t('name')} *</label>
          <input id="c-name" className={s.input} value={form.name} onChange={set('name')} required autoComplete="name" />
          {err('name')}
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="c-email">{t('email')} *</label>
          <input id="c-email" type="email" className={s.input} value={form.email} onChange={set('email')} required autoComplete="email" />
          {err('email')}
        </div>
      </div>
      <div className={s.grid2}>
        <div className={s.field}>
          <label className={s.label} htmlFor="c-phone">{t('phone')}</label>
          <input id="c-phone" type="tel" className={s.input} value={form.phone} onChange={set('phone')} autoComplete="tel" />
          {err('phone')}
        </div>
        <div className={s.field}>
          <label className={s.label} htmlFor="c-subject">{t('subject')} *</label>
          <input id="c-subject" className={s.input} value={form.subject} onChange={set('subject')} required />
          {err('subject')}
        </div>
      </div>
      <div className={s.field}>
        <label className={s.label} htmlFor="c-message">{t('message')} *</label>
        <textarea id="c-message" className={s.textarea} value={form.message} onChange={set('message')} required minLength={10} maxLength={5000} />
        {err('message')}
      </div>
      <input tabIndex={-1} autoComplete="off" className="visually-hidden" aria-hidden="true" value={form.website} onChange={set('website')} name="website" />
      <button className={s.btn} disabled={busy}>
        {busy ? t('sending') : t('send')}
      </button>
    </form>
  );
}
