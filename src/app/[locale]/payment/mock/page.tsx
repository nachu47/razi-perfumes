import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import s from '@/styles/page.module.css';
import { prisma } from '@/lib/prisma';
import { getPaymentProvider } from '@/lib/payments';
import { formatMoney, toNum } from '@/lib/money';

export const metadata: Metadata = { title: 'Sandbox payment', robots: { index: false } };

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<Record<string, string | undefined>> };

// Hosted-payment-page simulator for the "mock" provider (development/testing only).
export default async function MockPaymentPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (getPaymentProvider()?.id !== 'mock') notFound();
  const { order: orderNumber = '', token = '', ref = '', method = 'CARD' } = await searchParams;
  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order || order.accessToken !== token || order.paymentReference !== ref) notFound();
  const t = await getTranslations();
  const lang = await getLocale();

  return (
    <div className={`${s.container} ${s.tiny}`}>
      <div className={s.cardWhite} style={{ textAlign: 'center' }}>
        <p className={s.chip} style={{ marginBottom: 16 }}>
          SANDBOX · {t(`checkout.methods.${method}`)}
        </p>
        <h1 className={s.title} style={{ fontSize: 22 }}>
          {t('mockPay.title')}
        </h1>
        <p className={s.muted} style={{ marginBottom: 24 }}>
          {t('mockPay.text')}
        </p>
        <p className={s.row} style={{ justifyContent: 'center', gap: 8 }}>
          <span>{t('order.number')}:</span> <strong>{order.orderNumber}</strong>
        </p>
        <p className={s.totalRow} style={{ justifyContent: 'center', gap: 12, border: 'none' }}>
          <span>{t('mockPay.amount')}:</span> <span>{formatMoney(toNum(order.total), order.currency, lang)}</span>
        </p>
        <form method="post" action="/api/payments/mock/complete" className={s.form} style={{ marginTop: 24 }}>
          <input type="hidden" name="order" value={order.orderNumber} />
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="ref" value={ref} />
          <button name="outcome" value="PAID" className={`${s.btnGold} ${s.block}`}>
            {t('mockPay.pay')}
          </button>
          <button name="outcome" value="FAILED" className={`${s.btnOutline} ${s.block}`}>
            {t('mockPay.decline')}
          </button>
        </form>
      </div>
    </div>
  );
}
