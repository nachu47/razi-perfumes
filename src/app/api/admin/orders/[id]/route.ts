import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ApiError, handler, ok, readJson } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import { serializeOrder } from '@/lib/order-dto';
import { updateOrderStatus } from '@/lib/orders';

type Ctx = { params: Promise<{ id: string }> };

export const GET = handler(async (_req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true, events: true, user: { select: { id: true, name: true, email: true } } } });
  if (!order) throw new ApiError(404, 'Order not found');
  return ok({ ...serializeOrder(order), customer: order.user, paymentProvider: order.paymentProvider, locale: order.locale });
});

const patchSchema = z.object({
  orderStatus: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  note: z.string().trim().max(500).optional().nullable(),
  notify: z.boolean().default(true),
});

// PATCH — change fulfilment/payment status (emails the customer on status change)
export const PATCH = handler(async (req: Request, { params }: Ctx) => {
  await requireAdmin();
  const { id } = await params;
  const input = patchSchema.parse(await readJson(req));
  if (!input.orderStatus && !input.paymentStatus) throw new ApiError(400, 'Nothing to update');
  const order = await updateOrderStatus(id, input);
  const full = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true, events: true } });
  return ok(serializeOrder(full));
});
