import 'server-only';
import { prisma } from './prisma';
import { getSessionUser } from './session';
import { safeEqual } from './tokens';

/**
 * Loads an order if the requester may see it: the signed-in owner, an admin,
 * or anyone holding the order's secret access token (guest checkout links).
 */
export async function getAccessibleOrder(orderNumber: string, token?: string | null) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, events: true },
  });
  if (!order) return null;
  if (token && safeEqual(token, order.accessToken)) return order;
  const user = await getSessionUser();
  if (user && (user.role === 'ADMIN' || order.userId === user.id)) return order;
  return null;
}
