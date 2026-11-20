import 'server-only';
import { formatMoney } from './money';
import { SITE_URL, absoluteUrl } from './site';

// Minimal inline-styled templates that match the store's gold/ivory palette.

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function layout(body: string, locale: string = 'en'): string {
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  return `<!doctype html><html dir="${dir}"><body style="margin:0;background:#F9F5EF;font-family:Montserrat,Arial,sans-serif;color:#120F0D">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F9F5EF;padding:32px 12px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFDF9;border:1px solid #EAE5DF;border-radius:8px">
<tr><td style="background:#120F0D;padding:24px;text-align:center;border-radius:8px 8px 0 0">
<a href="${SITE_URL}" style="color:#CBA600;font-family:Cinzel,Georgia,serif;font-size:22px;letter-spacing:6px;text-decoration:none">RAZI PERFUMES</a>
</td></tr>
<tr><td style="padding:32px;font-size:14px;line-height:1.7;text-align:${locale === 'ar' ? 'right' : 'left'}">${body}</td></tr>
<tr><td style="padding:20px;text-align:center;font-size:11px;color:#7E756C;border-top:1px solid #EAE5DF">© ${new Date().getFullYear()} RAZI PERFUMES</td></tr>
</table></td></tr></table></body></html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:28px 0;text-align:center"><a href="${href}" style="background:#120F0D;color:#fff;padding:14px 28px;text-decoration:none;font-size:11px;letter-spacing:3px;font-weight:700;border-radius:4px">${esc(label)}</a></p>`;
}

export interface OrderEmailData {
  orderNumber: string;
  accessToken: string;
  locale: string;
  currency: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  email: string;
  phone: string;
  shippingAddress: Record<string, unknown>;
  items: { name: string; sizeLabel: string; quantity: number; unitPrice: number }[];
}

function orderTable(o: OrderEmailData): string {
  const ar = o.locale === 'ar';
  const m = (n: number) => formatMoney(n, o.currency, o.locale);
  const rows = o.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #EAE5DF">${esc(i.name)} <span style="color:#7E756C">(${esc(i.sizeLabel)})</span> × ${i.quantity}</td><td style="padding:8px 0;border-bottom:1px solid #EAE5DF;text-align:${ar ? 'left' : 'right'}">${m(i.unitPrice * i.quantity)}</td></tr>`,
    )
    .join('');
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:4px 0;${bold ? 'font-weight:700' : ''}">${label}</td><td style="padding:4px 0;text-align:${ar ? 'left' : 'right'};${bold ? 'font-weight:700;color:#9E8100' : ''}">${value}</td></tr>`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">${rows}
${line(ar ? 'المجموع الفرعي' : 'Subtotal', m(o.subtotal))}
${o.discount > 0 ? line(ar ? 'الخصم' : 'Discount', `- ${m(o.discount)}`) : ''}
${line(ar ? 'الشحن' : 'Shipping', o.shippingFee > 0 ? m(o.shippingFee) : ar ? 'مجاني' : 'Free')}
${line(ar ? 'الإجمالي' : 'Total', m(o.total), true)}</table>`;
}

function addressBlock(a: Record<string, unknown>): string {
  const parts = ['fullName', 'phone', 'area', 'block', 'street', 'building', 'floor', 'apartment', 'city', 'country']
    .map((k) => {
      const v = a[k];
      if (!v) return null;
      const label = { block: 'Block', street: 'Street', building: 'Building', floor: 'Floor', apartment: 'Apt' }[k];
      return label ? `${label} ${esc(String(v))}` : esc(String(v));
    })
    .filter(Boolean);
  return parts.join(', ');
}

const paymentLabel: Record<string, { en: string; ar: string }> = {
  COD: { en: 'Cash on Delivery', ar: 'الدفع عند الاستلام' },
  KNET: { en: 'KNET', ar: 'كي نت' },
  CARD: { en: 'Credit / Debit Card', ar: 'بطاقة ائتمان / خصم' },
  APPLE_PAY: { en: 'Apple Pay', ar: 'Apple Pay' },
};

export function orderConfirmationEmail(o: OrderEmailData) {
  const ar = o.locale === 'ar';
  const url = absoluteUrl(`/order/success?order=${o.orderNumber}&token=${o.accessToken}`, o.locale);
  const pay = paymentLabel[o.paymentMethod]?.[ar ? 'ar' : 'en'] ?? o.paymentMethod;
  const body = ar
    ? `<h2 style="font-family:Cinzel,Georgia,serif;font-weight:500">شكراً لطلبك</h2><p>تم استلام طلبك <strong>${o.orderNumber}</strong> وهو قيد التجهيز.</p>${orderTable(o)}<p style="margin-top:20px"><strong>طريقة الدفع:</strong> ${pay}<br/><strong>عنوان الشحن:</strong> ${addressBlock(o.shippingAddress)}</p>${button(url, 'عرض الطلب')}`
    : `<h2 style="font-family:Cinzel,Georgia,serif;font-weight:500">Thank you for your order</h2><p>We've received your order <strong>${o.orderNumber}</strong> and it is being prepared.</p>${orderTable(o)}<p style="margin-top:20px"><strong>Payment:</strong> ${pay}<br/><strong>Ship to:</strong> ${addressBlock(o.shippingAddress)}</p>${button(url, 'VIEW ORDER')}`;
  return {
    subject: ar ? `تأكيد الطلب ${o.orderNumber} — رازي للعطور` : `Order confirmed ${o.orderNumber} — Razi Perfumes`,
    html: layout(body, o.locale),
  };
}

export function adminNewOrderEmail(o: OrderEmailData) {
  const pay = paymentLabel[o.paymentMethod]?.en ?? o.paymentMethod;
  const body = `<h2 style="font-family:Cinzel,Georgia,serif;font-weight:500">New order ${o.orderNumber}</h2>
<p><strong>Customer:</strong> ${esc(o.email)} · ${esc(o.phone)}<br/><strong>Payment:</strong> ${pay} (${o.paymentStatus})<br/><strong>Ship to:</strong> ${addressBlock(o.shippingAddress)}</p>
${orderTable({ ...o, locale: 'en' })}${button(`${SITE_URL}/admin/orders`, 'OPEN ADMIN')}`;
  return { subject: `New order ${o.orderNumber} — ${formatMoney(o.total, o.currency)}`, html: layout(body) };
}

const statusText: Record<string, { en: string; ar: string }> = {
  PENDING: { en: 'is pending', ar: 'قيد الانتظار' },
  CONFIRMED: { en: 'has been confirmed', ar: 'تم تأكيده' },
  PROCESSING: { en: 'is being prepared', ar: 'قيد التجهيز' },
  SHIPPED: { en: 'has been shipped', ar: 'تم شحنه' },
  DELIVERED: { en: 'has been delivered', ar: 'تم توصيله' },
  CANCELLED: { en: 'has been cancelled', ar: 'تم إلغاؤه' },
};

export function orderStatusEmail(o: OrderEmailData, note?: string | null) {
  const ar = o.locale === 'ar';
  const s = statusText[o.orderStatus] ?? { en: o.orderStatus, ar: o.orderStatus };
  const url = absoluteUrl(`/order/success?order=${o.orderNumber}&token=${o.accessToken}`, o.locale);
  const body = ar
    ? `<h2 style="font-family:Cinzel,Georgia,serif;font-weight:500">تحديث الطلب</h2><p>طلبك <strong>${o.orderNumber}</strong> ${s.ar}.</p>${note ? `<p>${esc(note)}</p>` : ''}${button(url, 'تتبع الطلب')}`
    : `<h2 style="font-family:Cinzel,Georgia,serif;font-weight:500">Order update</h2><p>Your order <strong>${o.orderNumber}</strong> ${s.en}.</p>${note ? `<p>${esc(note)}</p>` : ''}${button(url, 'TRACK ORDER')}`;
  return { subject: ar ? `تحديث الطلب ${o.orderNumber}` : `Your order ${o.orderNumber} ${s.en}`, html: layout(body, o.locale) };
}

export function passwordResetEmail(url: string, locale: string) {
  const ar = locale === 'ar';
  const body = ar
    ? `<h2 style="font-family:Cinzel,Georgia,serif;font-weight:500">إعادة تعيين كلمة المرور</h2><p>اضغط الزر أدناه لاختيار كلمة مرور جديدة. ينتهي هذا الرابط خلال ساعة.</p>${button(url, 'إعادة التعيين')}<p style="color:#7E756C;font-size:12px">إذا لم تطلب ذلك، تجاهل هذه الرسالة.</p>`
    : `<h2 style="font-family:Cinzel,Georgia,serif;font-weight:500">Reset your password</h2><p>Click the button below to choose a new password. This link expires in 1 hour.</p>${button(url, 'RESET PASSWORD')}<p style="color:#7E756C;font-size:12px">If you didn't request this, you can ignore this email.</p>`;
  return { subject: ar ? 'إعادة تعيين كلمة المرور — رازي للعطور' : 'Reset your password — Razi Perfumes', html: layout(body, locale), text: `Reset your password: ${url}` };
}

export function verifyEmail(url: string, locale: string) {
  const ar = locale === 'ar';
  const body = ar
    ? `<h2 style="font-family:Cinzel,Georgia,serif;font-weight:500">مرحباً بك في رازي للعطور</h2><p>يرجى تأكيد بريدك الإلكتروني.</p>${button(url, 'تأكيد البريد')}`
    : `<h2 style="font-family:Cinzel,Georgia,serif;font-weight:500">Welcome to Razi Perfumes</h2><p>Please confirm your email address.</p>${button(url, 'VERIFY EMAIL')}`;
  return { subject: ar ? 'تأكيد البريد الإلكتروني — رازي للعطور' : 'Verify your email — Razi Perfumes', html: layout(body, locale), text: `Verify your email: ${url}` };
}

export function contactAdminEmail(m: { name: string; email: string; phone?: string | null; subject: string; message: string }) {
  const body = `<h2 style="font-family:Cinzel,Georgia,serif;font-weight:500">New contact message</h2>
<p><strong>From:</strong> ${esc(m.name)} &lt;${esc(m.email)}&gt;${m.phone ? ` · ${esc(m.phone)}` : ''}<br/><strong>Subject:</strong> ${esc(m.subject)}</p>
<p style="white-space:pre-wrap;background:#F9F5EF;padding:16px;border-radius:4px">${esc(m.message)}</p>${button(`${SITE_URL}/admin/messages`, 'OPEN INBOX')}`;
  return { subject: `Contact form: ${m.subject}`, html: layout(body) };
}
