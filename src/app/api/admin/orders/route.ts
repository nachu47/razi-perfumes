import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { handler, ok } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import { serializeOrder } from '@/lib/order-dto';

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED', 'REFUNDED'];

// GET /api/admin/orders?q=&status=&payment=&method=&from=&to=&page=
export const GET = handler(async (req: Request) => {
  await requireAdmin();
  const sp = new URL(req.url).searchParams;
  const q = sp.get('q')?.trim();
  const where: Prisma.OrderWhereInput = {};
  if (q) where.OR = [{ orderNumber: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }];
  const status = sp.get('status');
  if (status && ORDER_STATUSES.includes(status)) where.orderStatus = status as Prisma.EnumOrderStatusFilter['equals'];
  const payment = sp.get('payment');
  if (payment && PAYMENT_STATUSES.includes(payment)) where.paymentStatus = payment as Prisma.EnumPaymentStatusFilter['equals'];
  const method = sp.get('method');
  if (method && ['COD', 'KNET', 'CARD', 'APPLE_PAY'].includes(method)) where.paymentMethod = method as Prisma.EnumPaymentMethodFilter['equals'];
  const from = sp.get('from');
  const to = sp.get('to');
  if (from || to) where.createdAt = { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}) };
  const userId = sp.get('userId');
  if (userId) where.userId = userId;

  const page = Math.max(1, Number(sp.get('page')) || 1);
  const pageSize = 25;
  const [rows, total] = await Promise.all([
    prisma.order.findMany({ where, include: { items: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.order.count({ where }),
  ]);
  return ok({ items: rows.map(serializeOrder), total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) });
});
