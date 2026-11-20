import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { serializeOrder } from '@/lib/order-dto';
import { formatMoney } from '@/lib/money';
import { getCountry } from '@/lib/countries';
import PrintButton from '@/components/admin/PrintButton';

export const metadata = { title: 'Invoice' };

// Printable invoice (the admin sidebar is hidden by print CSS)
export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!row) notFound();
  const o = serializeOrder(row);
  const m = (n: number) => formatMoney(n, o.currency);
  const addr = o.shippingAddress as Record<string, string>;
  const cell: React.CSSProperties = { padding: '10px 8px', borderBottom: '1px solid #EAE5DF', fontSize: 13 };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', background: '#fff', padding: 48, fontFamily: 'var(--font-body)', color: '#120F0D' }}>
      <div className="noPrint" style={{ textAlign: 'end', marginBottom: 20 }}>
        <PrintButton />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #CBA600', paddingBottom: 20 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26, letterSpacing: '0.3em', color: '#9E8100' }}>RAZI</div>
          <div style={{ fontSize: 10, letterSpacing: '0.4em' }}>PERFUMES</div>
        </div>
        <div style={{ textAlign: 'end', fontSize: 13 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, letterSpacing: '0.15em' }}>INVOICE</div>
          <div>#{o.orderNumber}</div>
          <div>{new Date(o.createdAt).toLocaleDateString('en-GB', { dateStyle: 'long' })}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, margin: '28px 0', fontSize: 13, lineHeight: 1.7 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: '#7E756C' }}>BILL / SHIP TO</div>
          <strong>{addr.fullName}</strong>
          <br />
          {[addr.area, addr.block && `Block ${addr.block}`, addr.street && `Street ${addr.street}`, addr.building && `Bldg ${addr.building}`, addr.floor && `Floor ${addr.floor}`, addr.apartment && `Apt ${addr.apartment}`].filter(Boolean).join(', ')}
          <br />
          {addr.city}, {getCountry(o.country).nameEn}
          <br />
          {o.phone} · {o.email}
        </div>
        <div style={{ textAlign: 'end' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', color: '#7E756C' }}>PAYMENT</div>
          {o.paymentMethod} — {o.paymentStatus}
          <br />
          Status: {o.orderStatus}
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#F9F5EF' }}>
            <th style={{ ...cell, textAlign: 'start' }}>Item</th>
            <th style={{ ...cell, textAlign: 'start' }}>Size</th>
            <th style={{ ...cell, textAlign: 'end' }}>Unit price</th>
            <th style={{ ...cell, textAlign: 'end' }}>Qty</th>
            <th style={{ ...cell, textAlign: 'end' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((i) => (
            <tr key={i.id}>
              <td style={cell}>{i.name}</td>
              <td style={cell}>{i.sizeLabel}</td>
              <td style={{ ...cell, textAlign: 'end' }}>{m(i.unitPrice)}</td>
              <td style={{ ...cell, textAlign: 'end' }}>{i.quantity}</td>
              <td style={{ ...cell, textAlign: 'end' }}>{m(i.unitPrice * i.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <table style={{ marginInlineStart: 'auto', marginTop: 16, fontSize: 13, minWidth: 280 }}>
        <tbody>
          <tr><td style={{ padding: 4 }}>Subtotal</td><td style={{ padding: 4, textAlign: 'end' }}>{m(o.subtotal)}</td></tr>
          {o.discount > 0 && <tr><td style={{ padding: 4 }}>Discount {o.couponCode && `(${o.couponCode})`}</td><td style={{ padding: 4, textAlign: 'end' }}>- {m(o.discount)}</td></tr>}
          <tr><td style={{ padding: 4 }}>Shipping</td><td style={{ padding: 4, textAlign: 'end' }}>{o.shippingFee > 0 ? m(o.shippingFee) : 'Free'}</td></tr>
          <tr style={{ fontWeight: 700, fontSize: 15 }}>
            <td style={{ padding: '8px 4px', borderTop: '2px solid #CBA600' }}>Total</td>
            <td style={{ padding: '8px 4px', borderTop: '2px solid #CBA600', textAlign: 'end' }}>{m(o.total)}</td>
          </tr>
        </tbody>
      </table>

      <p style={{ marginTop: 48, fontSize: 11, color: '#7E756C', textAlign: 'center' }}>Thank you for choosing Razi Perfumes.</p>
    </div>
  );
}
