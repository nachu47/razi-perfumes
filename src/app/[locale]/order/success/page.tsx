import type { Metadata } from 'next';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { Link, redirect } from '@/i18n/navigation';
import s from '@/styles/page.module.css';
import OrderDetails from '@/components/OrderDetails';
import { getAccessibleOrder } from '@/lib/order-access';
import { serializeOrder } from '@/lib/order-dto';
import { formatMoney } from '@/lib/money';
import { auth } from '@/auth';

export const metadata: Metadata = { title: 'Order', robots: { index: false } };

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ order?: string; token?: string }> };

export default async function OrderSuccessPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { order: orderNumber = '', token } = await searchParams;
  const t = await getTranslations();
  const row = orderNumber ? await getAccessibleOrder(orderNumber, token) : null;

  if (!row) {
    return (
      <div className={`${s.container} ${s.narrow} ${s.center}`}>
        <p className={s.empty}>{t('order.notFound')}</p>
        <Link href="/" className={s.btn}>
          {t('common.backToHome')}
        </Link>
      </div>
    );
  }
  // An unpaid online order belongs on the failure/retry page
  if (row.paymentMethod !== 'COD' && row.paymentStatus !== 'PAID') {
    redirect({ href: `/order/failed?order=${row.orderNumber}&token=${row.accessToken}`, locale: await getLocale() });
  }
  const order = serializeOrder(row);
  const session = await auth();

  return (
    <div className={s.container}>
      <div className={s.center} style={{ marginBottom: 48 }}>
        <div className={s.bigIcon}>✓</div>
        <h1 className={s.title}>{t('order.successTitle')}</h1>
        <p className={s.subtitle} style={{ marginBottom: 8 }}>
          {t('order.successText', { number: order.orderNumber, email: order.email })}
        </p>
        <p className={s.muted}>
          {order.paymentMethod === 'COD'
            ? t('order.codText', { amount: formatMoney(order.total, order.currency, locale) })
            : t('order.paidText')}
        </p>
      </div>
      <OrderDetails order={order} />
      <div className={s.center} style={{ marginTop: 48, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/shop" className={s.btn}>
          {t('common.continueShopping')}
        </Link>
        {session?.user && (
          <Link href="/account?tab=orders" className={s.btnOutline}>
            {t('order.viewOrders')}
          </Link>
        )}
      </div>
    </div>
  );
}
