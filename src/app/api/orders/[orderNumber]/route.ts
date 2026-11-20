import { ApiError, handler, ok } from '@/lib/api';
import { getAccessibleOrder } from '@/lib/order-access';
import { serializeOrder } from '@/lib/order-dto';

// GET /api/orders/:orderNumber?token= — order details for the owner or guest token holder
export const GET = handler(async (req: Request, { params }: { params: Promise<{ orderNumber: string }> }) => {
  const { orderNumber } = await params;
  const order = await getAccessibleOrder(orderNumber, new URL(req.url).searchParams.get('token'));
  if (!order) throw new ApiError(404, 'Order not found');
  return ok(serializeOrder(order));
});
