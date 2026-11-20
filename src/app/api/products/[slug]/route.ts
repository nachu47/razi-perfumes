import { ApiError, handler, ok } from '@/lib/api';
import { getProductBySlug } from '@/lib/catalog';

export const GET = handler(async (_req: Request, { params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) throw new ApiError(404, 'Product not found');
  return ok(product);
});
