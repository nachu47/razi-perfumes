import { prisma } from '@/lib/prisma';
import { ApiError, handler, ok, readJson } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import { reviewSchema } from '@/lib/validators';

// Reviews are held for moderation (isApproved=false) until an admin approves them.
export const POST = handler(async (req: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const user = await requireUser();
  rateLimit(`review:${user.id}`, 5, 60 * 60_000);
  const { slug } = await params;
  const input = reviewSchema.parse(await readJson(req));
  const product = await prisma.product.findFirst({ where: { slug, isActive: true }, select: { id: true } });
  if (!product) throw new ApiError(404, 'Product not found');
  const review = await prisma.review.upsert({
    where: { productId_userId: { productId: product.id, userId: user.id } },
    update: { rating: input.rating, comment: input.comment, isApproved: false },
    create: { productId: product.id, userId: user.id, rating: input.rating, comment: input.comment },
  });
  return ok({ id: review.id, pending: true }, { status: 201 });
});
