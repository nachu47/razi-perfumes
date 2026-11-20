import 'server-only';
import type { Coupon } from '@prisma/client';
import { prisma } from './prisma';
import { getRates } from './currency';
import { round, toNum } from './money';
import { getCountryByCurrency } from './countries';

// The pricing engine. Every price the customer sees in the cart and every amount
// charged at checkout is computed here from DB prices — client-sent prices are never used.

export interface QuoteLineInput {
  variantId: string;
  quantity: number;
  cartItemId?: string;
}

export interface QuoteItem {
  cartItemId?: string;
  variantId: string;
  productId: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  image: string | null;
  label: string;
  sizeMl: number | null;
  quantity: number;
  stock: number;
  available: boolean; // product active and variant exists
  unitPriceKWD: number;
  unitPrice: number; // in quote currency
  lineTotal: number;
}

export interface Quote {
  currency: string;
  rate: number;
  items: QuoteItem[];
  count: number;
  subtotal: number;
  subtotalKWD: number;
  discount: number;
  discountKWD: number;
  shippingFee: number;
  total: number;
  totalKWD: number;
  coupon: { code: string; valid: boolean; error?: string } | null;
  shipping: { country: string; estimatedDays: string | null; freeThreshold: number | null; remainingForFree: number | null; available: boolean };
}

export class CouponError extends Error {}

/** Validates a coupon against a KWD subtotal. Returns the discount in KWD. */
export function evaluateCoupon(coupon: Coupon | null, subtotalKWD: number): number {
  if (!coupon || !coupon.isActive) throw new CouponError('This coupon code is not valid.');
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) throw new CouponError('This coupon is not active yet.');
  if (coupon.expiresAt && coupon.expiresAt < now) throw new CouponError('This coupon has expired.');
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) throw new CouponError('This coupon has reached its usage limit.');
  const minOrder = toNum(coupon.minOrder);
  if (subtotalKWD < minOrder) throw new CouponError(`This coupon requires a minimum order of ${minOrder.toFixed(3)} KD.`);
  const value = toNum(coupon.value);
  const discount = coupon.type === 'PERCENT' ? (subtotalKWD * Math.min(value, 100)) / 100 : value;
  return Math.min(discount, subtotalKWD);
}

export async function buildQuote(opts: {
  lines: QuoteLineInput[];
  currency: string;
  shippingCountry: string;
  couponCode?: string | null;
}): Promise<Quote> {
  const { currency, shippingCountry } = opts;
  const decimals = getCountryByCurrency(currency).decimals;
  const rates = await getRates();
  const rate = rates[currency] ?? 1;

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: opts.lines.map((l) => l.variantId) } },
    include: { product: true },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));

  const items: QuoteItem[] = [];
  for (const line of opts.lines) {
    const v = byId.get(line.variantId);
    if (!v) continue;
    const unitPriceKWD = toNum(v.priceKWD);
    const unitPrice = round(unitPriceKWD * rate, decimals);
    items.push({
      cartItemId: line.cartItemId,
      variantId: v.id,
      productId: v.productId,
      slug: v.product.slug,
      nameEn: v.product.nameEn,
      nameAr: v.product.nameAr,
      image: v.product.images[0] ?? null,
      label: v.label,
      sizeMl: v.sizeMl,
      quantity: line.quantity,
      stock: v.stock,
      available: v.product.isActive,
      unitPriceKWD,
      unitPrice,
      lineTotal: round(unitPrice * line.quantity, decimals),
    });
  }

  const purchasable = items.filter((i) => i.available);
  const subtotal = round(purchasable.reduce((s, i) => s + i.lineTotal, 0), decimals);
  const subtotalKWD = round(purchasable.reduce((s, i) => s + i.unitPriceKWD * i.quantity, 0), 3);

  let discountKWD = 0;
  let coupon: Quote['coupon'] = null;
  if (opts.couponCode) {
    const code = opts.couponCode.toUpperCase();
    try {
      const row = await prisma.coupon.findUnique({ where: { code } });
      discountKWD = evaluateCoupon(row, subtotalKWD);
      coupon = { code, valid: true };
    } catch (e) {
      if (!(e instanceof CouponError)) throw e;
      coupon = { code, valid: false, error: e.message };
    }
  }
  const discount = Math.min(round(discountKWD * rate, decimals), subtotal);

  const rateRow = await prisma.shippingRate.findUnique({ where: { country: shippingCountry } });
  const shippingAvailable = Boolean(rateRow?.isActive);
  const threshold = rateRow?.freeShippingThreshold ? toNum(rateRow.freeShippingThreshold) : null;
  const afterDiscountKWD = subtotalKWD - discountKWD;
  const freeShipping = threshold !== null && afterDiscountKWD >= threshold;
  const shippingFee =
    !rateRow || purchasable.length === 0 || freeShipping ? 0 : round(toNum(rateRow.fee) * rate, decimals);

  const total = round(subtotal - discount + shippingFee, decimals);
  return {
    currency,
    rate,
    items,
    count: items.reduce((s, i) => s + i.quantity, 0),
    subtotal,
    subtotalKWD,
    discount,
    discountKWD: round(discountKWD, 3),
    shippingFee,
    total,
    totalKWD: round(total / rate, 3),
    coupon,
    shipping: {
      country: shippingCountry,
      estimatedDays: rateRow?.estimatedDays ?? null,
      freeThreshold: threshold !== null ? round(threshold * rate, decimals) : null,
      remainingForFree: threshold !== null && !freeShipping ? round((threshold - afterDiscountKWD) * rate, decimals) : null,
      available: shippingAvailable,
    },
  };
}
