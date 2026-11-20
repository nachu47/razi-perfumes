import Image from 'next/image';
import { getLocale, getTranslations } from 'next-intl/server';
import s from '@/styles/page.module.css';
import { formatMoney } from '@/lib/money';
import { getCountry } from '@/lib/countries';
import type { OrderDTO } from '@/lib/order-dto';

export function statusChipClass(status: string): string {
  if (['DELIVERED', 'PAID', 'CONFIRMED', 'SHIPPED'].includes(status)) return s.chipGreen;
  if (['CANCELLED', 'FAILED', 'REFUNDED'].includes(status)) return s.chipRed;
  return s.chipGold;
}

/** Order summary + tracking timeline, shared by the success page and My Account. */
export default async function OrderDetails({ order }: { order: OrderDTO }) {
  const t = await getTranslations();
  const locale = await getLocale();
  const m = (n: number) => formatMoney(n, order.currency, locale);
  const a = order.shippingAddress as Record<string, string>;
  const country = getCountry(order.country);
  const dateFmt = (iso: string) =>
    new Date(iso).toLocaleString(locale === 'ar' ? 'ar-KW' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  const statusLabel = (st: string) => (t.has(`order.statuses.${st}`) ? t(`order.statuses.${st}`) : st);

  return (
    <div className={s.twoCol}>
      <div className={s.form} style={{ gap: 32 }}>
        <section className={s.cardWhite}>
          <div className={s.grid3} style={{ fontSize: 13 }}>
            <div>
              <div className={s.label}>{t('order.number')}</div>
              <strong>{order.orderNumber}</strong>
            </div>
            <div>
              <div className={s.label}>{t('order.date')}</div>
              {dateFmt(order.createdAt)}
            </div>
            <div>
              <div className={s.label}>{t('order.status')}</div>
              <span className={`${s.chip} ${statusChipClass(order.orderStatus)}`}>{statusLabel(order.orderStatus)}</span>
            </div>
            <div>
              <div className={s.label}>{t('order.payment')}</div>
              {t(`checkout.methods.${order.paymentMethod}`)}{' '}
              <span className={`${s.chip} ${statusChipClass(order.paymentStatus)}`}>{t(`order.paymentStatuses.${order.paymentStatus}`)}</span>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div className={s.label}>{t('checkout.shippingAddress')}</div>
              {[a.fullName, a.phone].filter(Boolean).join(' · ')}
              <br />
              {[a.area, a.block && `${t('checkout.block')} ${a.block}`, a.street && `${t('checkout.street')} ${a.street}`, a.building && `${t('checkout.building')} ${a.building}`, a.floor && `${t('checkout.floor')} ${a.floor}`, a.apartment && `${t('checkout.apartment')} ${a.apartment}`]
                .filter(Boolean)
                .join(', ')}
              <br />
              {[a.city, locale === 'ar' ? country.nameAr : country.nameEn].filter(Boolean).join(', ')}
            </div>
          </div>
        </section>

        {order.events.length > 0 && (
          <section>
            <h2 className={s.sectionTitle}>{t('order.tracking')}</h2>
            <ol className={s.timeline}>
              {order.events.map((e, i) => (
                <li key={i}>
                  <strong>{statusLabel(e.status)}</strong>
                  <span className={s.muted}> · {dateFmt(e.createdAt)}</span>
                  {e.note && <div className={s.muted}>{e.note}</div>}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      <aside className={s.card}>
        <h2 className={s.sectionTitle}>{t('order.items')}</h2>
        <div className={s.lines}>
          {order.items.map((i) => (
            <div key={i.id} className={`${s.line} ${s.lineSmall}`}>
              <div className={s.thumb} style={{ overflow: 'visible' }}>
                {i.image && <Image src={i.image} alt="" width={64} height={80} />}
                <span className={s.qtyBadge}>{i.quantity}</span>
              </div>
              <div>
                <div className={s.lineName} style={{ fontSize: 11 }}>
                  {i.name}
                </div>
                <div className={s.lineMeta}>{i.sizeLabel}</div>
              </div>
              <span className={s.linePrice}>{m(i.unitPrice * i.quantity)}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <div className={s.row}>
            <span>{t('common.subtotal')}</span>
            <span>{m(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className={s.row}>
              <span>
                {t('common.discount')} {order.couponCode && `(${order.couponCode})`}
              </span>
              <span>- {m(order.discount)}</span>
            </div>
          )}
          <div className={s.row}>
            <span>{t('common.shipping')}</span>
            <span>{order.shippingFee > 0 ? m(order.shippingFee) : t('common.free')}</span>
          </div>
          <div className={s.totalRow}>
            <span>{t('common.total')}</span>
            <span>{m(order.total)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
