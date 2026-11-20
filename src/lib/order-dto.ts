import type { Order, OrderEvent, OrderItem } from '@prisma/client';
import { toNum } from './money';

export interface OrderDTO {
  id: string;
  orderNumber: string;
  accessToken: string;
  email: string;
  phone: string;
  shippingAddress: Record<string, string | boolean | undefined>;
  country: string;
  currency: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  couponCode: string | null;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  paymentReference: string | null;
  notes: string | null;
  createdAt: string;
  items: { id: string; productId: string | null; name: string; sizeLabel: string; image: string | null; unitPrice: number; quantity: number }[];
  events: { status: string; note: string | null; createdAt: string }[];
}

export function serializeOrder(o: Order & { items: OrderItem[]; events?: OrderEvent[] }): OrderDTO {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    accessToken: o.accessToken,
    email: o.email,
    phone: o.phone,
    shippingAddress: o.shippingAddress as OrderDTO['shippingAddress'],
    country: o.country,
    currency: o.currency,
    subtotal: toNum(o.subtotal),
    shippingFee: toNum(o.shippingFee),
    discount: toNum(o.discount),
    total: toNum(o.total),
    couponCode: o.couponCode,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    orderStatus: o.orderStatus,
    paymentReference: o.paymentReference,
    notes: o.notes,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      name: i.name,
      sizeLabel: i.sizeLabel,
      image: i.image,
      unitPrice: toNum(i.unitPrice),
      quantity: i.quantity,
    })),
    events: (o.events ?? [])
      .slice()
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((e) => ({ status: e.status, note: e.note, createdAt: e.createdAt.toISOString() })),
  };
}
