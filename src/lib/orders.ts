import 'server-only';
import { randomInt } from 'crypto';
import { Prisma, type Order, type OrderItem, type OrderStatus, type PaymentStatus } from '@prisma/client';
import { prisma } from './prisma';
import { ApiError } from './api';
import { buildQuote } from './pricing';
import { getCountry } from './countries';
import { randomToken } from './tokens';
import { toNum } from './money';
import { sendEmail, adminNotifyEmail } from './email';
import { adminNewOrderEmail, orderConfirmationEmail, orderStatusEmail, type OrderEmailData } from './email-templates';
import { revalidateCatalog } from './currency';
import type { CheckoutInput } from './validators';

type OrderWithItems = Order & { items: OrderItem[] };

async function generateOrderNumber(): Promise<string> {
  const d = new Date();
  const stamp = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  for (let i = 0; i < 5; i++) {
    const candidate = `RZ${stamp}${randomInt(1000, 9999)}`;
    if (!(await prisma.order.findUnique({ where: { orderNumber: candidate }, select: { id: true } }))) return candidate;
  }
  return `RZ${stamp}${randomInt(100000, 999999)}`;
}

/**
 * Creates a PENDING order from the cart (or a single Buy Now line).
 * Prices, discount and shipping are recomputed server-side from the DB.
 * Stock is validated here but only deducted once the order is confirmed/paid.
 */
export async function createOrder(params: {
  input: CheckoutInput;
  currency: string;
  userId: string | null;
  cart: { id: string; couponCode: string | null; lines: { variantId: string; quantity: number }[] } | null;
}): Promise<OrderWithItems> {
  const { input, currency, userId, cart } = params;
  const lines = input.buyNow ? [input.buyNow] : (cart?.lines ?? []);
  if (!lines.length) throw new ApiError(400, 'Your basket is empty.');

  const couponCode = input.couponCode || (input.buyNow ? null : cart?.couponCode) || null;
  const quote = await buildQuote({ lines, currency, shippingCountry: input.address.country, couponCode });

  if (!quote.shipping.available) throw new ApiError(400, 'We do not ship to the selected country yet.');
  for (const item of quote.items) {
    if (!item.available) throw new ApiError(409, `${item.nameEn} is no longer available. Please remove it from your basket.`);
    if (item.quantity > item.stock) {
      throw new ApiError(409, item.stock > 0 ? `Only ${item.stock} of ${item.nameEn} (${item.label}) left in stock.` : `${item.nameEn} (${item.label}) is out of stock.`);
    }
  }
  if (quote.items.length !== lines.length) throw new ApiError(409, 'Some items in your basket are no longer available.');
  if (couponCode && quote.coupon && !quote.coupon.valid) throw new ApiError(400, quote.coupon.error || 'Invalid coupon');

  const orderNumber = await generateOrderNumber();
  const isArabic = input.locale === 'ar';
  const country = getCountry(input.address.country);

  return prisma.order.create({
    data: {
      orderNumber,
      userId,
      email: input.email,
      phone: input.phone,
      shippingAddress: { ...input.address, countryName: country.nameEn } as Prisma.InputJsonValue,
      country: input.address.country,
      locale: input.locale,
      currency,
      exchangeRate: quote.rate,
      subtotal: quote.subtotal,
      shippingFee: quote.shippingFee,
      discount: quote.discount,
      total: quote.total,
      totalKWD: quote.totalKWD,
      couponCode: quote.coupon?.valid ? quote.coupon.code : null,
      paymentMethod: input.paymentMethod,
      accessToken: randomToken(24),
      sourceCartId: input.buyNow ? null : (cart?.id ?? null),
      notes: input.notes,
      items: {
        create: quote.items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          name: isArabic ? i.nameAr : i.nameEn,
          sizeMl: i.sizeMl,
          sizeLabel: i.label,
          image: i.image,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        })),
      },
      events: { create: { status: 'PENDING', note: 'Order placed' } },
    },
    include: { items: true },
  });
}

/**
 * Confirms an order: deducts stock, bumps sold counts and coupon usage, empties the
 * source cart and sends emails. Idempotent — safe to call from both the webhook and
 * the callback redirect, or twice for the same webhook.
 */
export async function confirmOrder(orderNumber: string, opts: { paid: boolean; reference?: string }): Promise<Order | null> {
  const result = await prisma.$transaction(async (tx) => {
    // Row lock so concurrent webhook + callback can't both deduct stock
    await tx.$queryRaw`SELECT id FROM "Order" WHERE "orderNumber" = ${orderNumber} FOR UPDATE`;
    const order = await tx.order.findUnique({ where: { orderNumber }, include: { items: true } });
    if (!order) return null;
    if (order.stockDeducted) {
      // Already confirmed; just record a late payment if needed
      if (opts.paid && order.paymentStatus !== 'PAID') {
        return { order: await tx.order.update({ where: { id: order.id }, data: { paymentStatus: 'PAID', paymentReference: opts.reference ?? order.paymentReference } }), fresh: false };
      }
      return { order, fresh: false };
    }

    const shortages: string[] = [];
    for (const item of order.items) {
      if (!item.variantId) continue;
      // Guarded decrement: only succeeds if enough stock remains
      const updated = await tx.productVariant.updateMany({
        where: { id: item.variantId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (updated.count === 0) {
        shortages.push(`${item.name} (${item.sizeLabel})`);
        await tx.productVariant.updateMany({ where: { id: item.variantId }, data: { stock: 0 } });
      }
      if (item.productId) await tx.product.update({ where: { id: item.productId }, data: { soldCount: { increment: item.quantity } } });
    }
    if (order.couponCode) await tx.coupon.updateMany({ where: { code: order.couponCode }, data: { usedCount: { increment: 1 } } });
    if (order.sourceCartId) await tx.cartItem.deleteMany({ where: { cartId: order.sourceCartId } }).then(() =>
      tx.cart.updateMany({ where: { id: order.sourceCartId! }, data: { couponCode: null } }),
    );

    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        stockDeducted: true,
        orderStatus: 'CONFIRMED',
        paymentStatus: opts.paid ? 'PAID' : order.paymentStatus,
        paymentReference: opts.reference ?? order.paymentReference,
        events: {
          create: [
            { status: 'CONFIRMED', note: opts.paid ? 'Payment received' : 'Cash on Delivery order confirmed' },
            ...(shortages.length ? [{ status: 'CONFIRMED', note: `Stock shortfall: ${shortages.join(', ')}` }] : []),
          ],
        },
      },
    });
    return { order: updated, fresh: true };
  });

  if (result?.fresh) {
    revalidateCatalog(); // stock changed
    await sendOrderEmails(result.order.orderNumber);
  }
  return result?.order ?? null;
}

export async function failOrderPayment(orderNumber: string, reference?: string) {
  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order || order.paymentStatus === 'PAID') return order;
  return prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'FAILED',
      paymentReference: reference ?? order.paymentReference,
      events: { create: { status: 'PAYMENT_FAILED', note: 'Payment was declined or cancelled' } },
    },
  });
}

export function toEmailData(o: OrderWithItems): OrderEmailData {
  return {
    orderNumber: o.orderNumber,
    accessToken: o.accessToken,
    locale: o.locale,
    currency: o.currency,
    subtotal: toNum(o.subtotal),
    shippingFee: toNum(o.shippingFee),
    discount: toNum(o.discount),
    total: toNum(o.total),
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    orderStatus: o.orderStatus,
    email: o.email,
    phone: o.phone,
    shippingAddress: o.shippingAddress as Record<string, unknown>,
    items: o.items.map((i) => ({ name: i.name, sizeLabel: i.sizeLabel, quantity: i.quantity, unitPrice: toNum(i.unitPrice) })),
  };
}

async function sendOrderEmails(orderNumber: string) {
  const order = await prisma.order.findUnique({ where: { orderNumber }, include: { items: true } });
  if (!order) return;
  const data = toEmailData(order);
  await sendEmail({ to: order.email, ...orderConfirmationEmail(data) });
  const admin = adminNotifyEmail();
  if (admin) await sendEmail({ to: admin, replyTo: order.email, ...adminNewOrderEmail(data) });
}

/** Admin: change fulfilment / payment status, log it, and email the customer about status changes. */
export async function updateOrderStatus(
  orderId: string,
  changes: { orderStatus?: OrderStatus; paymentStatus?: PaymentStatus; note?: string | null; notify?: boolean },
) {
  const before = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

  // Confirming a still-pending order (e.g. a COD order or a bank transfer) must deduct stock once.
  if (!before.stockDeducted && changes.orderStatus && !['PENDING', 'CANCELLED'].includes(changes.orderStatus)) {
    await confirmOrder(before.orderNumber, { paid: changes.paymentStatus === 'PAID' });
  }
  // Cancelling a confirmed, undelivered order returns its stock
  const restock = changes.orderStatus === 'CANCELLED' && before.orderStatus !== 'CANCELLED' && before.stockDeducted;

  const order = await prisma.$transaction(async (tx) => {
    if (restock) {
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const i of items) {
        if (i.variantId) await tx.productVariant.updateMany({ where: { id: i.variantId }, data: { stock: { increment: i.quantity } } });
        if (i.productId) await tx.product.updateMany({ where: { id: i.productId, soldCount: { gte: i.quantity } }, data: { soldCount: { decrement: i.quantity } } });
      }
    }
    const events: { status: string; note?: string | null }[] = [];
    if (changes.orderStatus && changes.orderStatus !== before.orderStatus) events.push({ status: changes.orderStatus, note: changes.note });
    if (changes.paymentStatus && changes.paymentStatus !== before.paymentStatus) events.push({ status: `PAYMENT_${changes.paymentStatus}`, note: changes.note });
    return tx.order.update({
      where: { id: orderId },
      data: {
        orderStatus: changes.orderStatus,
        paymentStatus: changes.paymentStatus,
        stockDeducted: restock ? false : undefined,
        events: events.length ? { create: events } : undefined,
      },
      include: { items: true },
    });
  });
  if (restock) revalidateCatalog();

  if (changes.notify !== false && changes.orderStatus && changes.orderStatus !== before.orderStatus) {
    await sendEmail({ to: order.email, ...orderStatusEmail(toEmailData(order), changes.note) });
  }
  return order;
}
