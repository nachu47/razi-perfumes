'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import s from '@/styles/page.module.css';
import { api } from '@/lib/client-api';

export default function RetryPayment({ orderNumber, token, methods, current }: { orderNumber: string; token: string; methods: string[]; current: string }) {
  const t = useTranslations();
  const online = methods.filter((m) => m !== 'COD');
  const [method, setMethod] = useState(online.includes(current) ? current : online[0]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  const retry = async (paymentMethod: string) => {
    setBusy(paymentMethod);
    setError('');
    try {
      const { redirectUrl } = await api<{ redirectUrl: string }>(`/api/orders/${orderNumber}/retry`, { body: { token, paymentMethod } });
      window.location.assign(redirectUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.genericError'));
      setBusy(null);
    }
  };

  return (
    <div className={s.form} style={{ maxWidth: 460, margin: '0 auto' }}>
      {error && <div className={s.alertError}>{error}</div>}
      {online.length > 0 && (
        <>
          <div className={s.field}>
            <label className={s.label} htmlFor="retry-method">
              {t('order.retryWith')}
            </label>
            <select id="retry-method" className={s.select} value={method} onChange={(e) => setMethod(e.target.value)}>
              {online.map((m) => (
                <option key={m} value={m}>
                  {t(`checkout.methods.${m}`)}
                </option>
              ))}
            </select>
          </div>
          <button className={`${s.btn} ${s.block}`} onClick={() => retry(method)} disabled={busy !== null}>
            {busy === method ? t('checkout.placing') : t('order.retry')}
          </button>
        </>
      )}
      <button className={`${s.btnOutline} ${s.block}`} onClick={() => retry('COD')} disabled={busy !== null}>
        {busy === 'COD' ? t('checkout.placing') : t('order.switchCod')}
      </button>
    </div>
  );
}
