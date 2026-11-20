import type { Metadata } from 'next';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { Link, redirect } from '@/i18n/navigation';
import s from '@/styles/page.module.css';
import RetryPayment from '@/components/pages/RetryPayment';
import { getAccessibleOrder } from '@/lib/order-access';
import { enabledPaymentMethods } from '@/lib/payments';

export const metadata: Metadata = { title: 'Payment', robots: { index: false } };

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ order?: string; token?: string }> };

export default async function OrderFailedPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { order: orderNumber = '', token } = await searchParams;
  const t = await getTranslations();
  const order = orderNumber ? await getAccessibleOrder(orderNumber, token) : null;

  if (!order) {
    return (
      <div className={`${s.container} ${s.narrow} ${s.center}`}>
        <p className={s.empty}>{t('order.notFound')}</p>
        <Link href="/" className={s.btn}>
          {t('common.backToHome')}
        </Link>
      </div>
    );
  }
  // Already paid / confirmed → nothing to retry
  if (order.paymentStatus === 'PAID' || order.stockDeducted) {
    redirect({ href: `/order/success?order=${order.orderNumber}&token=${order.accessToken}`, locale: await getLocale() });
  }

  return (
    <div className={`${s.container} ${s.narrow} ${s.center}`}>
      <div className={s.bigIcon} style={{ color: '#b03a2e', borderColor: '#b03a2e' }}>
        !
      </div>
      <h1 className={s.title}>{t('order.failedTitle')}</h1>
      <p className={s.subtitle}>{t('order.failedText', { number: order.orderNumber })}</p>
      <RetryPayment orderNumber={order.orderNumber} token={order.accessToken} methods={enabledPaymentMethods()} current={order.paymentMethod} />
      <p style={{ marginTop: 32 }}>
        <Link href="/cart" className={s.linkBtn}>
          {t('common.viewBasket')}
        </Link>
      </p>
    </div>
  );
}
