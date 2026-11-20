import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link, redirect } from '@/i18n/navigation';
import s from '@/styles/page.module.css';
import OrderDetails from '@/components/OrderDetails';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { serializeOrder } from '@/lib/order-dto';

export const metadata: Metadata = { title: 'Order details', robots: { index: false } };

export default async function AccountOrderPage({ params }: { params: Promise<{ locale: string; orderNumber: string }> }) {
  const { locale, orderNumber } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user) redirect({ href: `/account/login?callbackUrl=/account/orders/${orderNumber}`, locale });
  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: session!.user.id },
    include: { items: true, events: true },
  });
  if (!order) notFound();
  const t = await getTranslations();
  return (
    <div className={s.container}>
      <nav className={s.breadcrumbs}>
        <Link href="/">{t('common.home')}</Link>
        <span className={s.separator}>/</span>
        <Link href="/account?tab=orders">{t('account.title')}</Link>
        <span className={s.separator}>/</span>
        <span className={s.current}>{order.orderNumber}</span>
      </nav>
      <header className={s.pageHeader}>
        <h1 className={s.title}>
          {t('order.number')} {order.orderNumber}
        </h1>
      </header>
      <OrderDetails order={serializeOrder(order)} />
    </div>
  );
}
