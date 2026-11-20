import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { ApiError, clientIp, handler, ok, readJson } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { resolveWishlistOwner } from '@/lib/wishlist';
import { getStoreSettings, whatsappActive, whatsappLink } from '@/lib/settings';
import { getSessionUser } from '@/lib/session';
import { absoluteUrl } from '@/lib/site';

const schema = z.object({
  productId: z.string().min(1).max(50),
  variantId: z.string().max(50).optional(),
  locale: z.enum(['en', 'ar']).default('en'),
});

// POST /api/enquiries — records a WhatsApp product enquiry and returns the wa.me link to open
export const POST = handler(async (req: Request) => {
  rateLimit(`enquiry:${clientIp(req)}`, 20, 10 * 60_000);
  const { productId, variantId, locale } = schema.parse(await readJson(req));
  const settings = await getStoreSettings();
  if (!whatsappActive(settings)) throw new ApiError(503, 'WhatsApp enquiries are not available right now.');

  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    include: { variants: true },
  });
  if (!product) throw new ApiError(404, 'Product not found');
  const variant = product.variants.find((v) => v.id === variantId) ?? null;

  const owner = (await resolveWishlistOwner(true))!;
  const sessionUser = await getSessionUser();
  const user = sessionUser
    ? await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { name: true, email: true, phone: true } })
    : null;

  await prisma.enquiry.create({
    data: {
      userId: owner.userId ?? null,
      guestId: owner.guestId ?? null,
      productId: product.id,
      productName: product.nameEn,
      variantLabel: variant?.label ?? null,
      name: user?.name ?? null,
      email: user?.email ?? null,
      phone: user?.phone ?? null,
      locale,
    },
  });

  const name = locale === 'ar' ? product.nameAr : product.nameEn;
  const greeting = locale === 'ar' ? settings.whatsappGreetingAr : settings.whatsappGreetingEn;
  const text = `${greeting}\n\n• ${name}${variant ? ` (${variant.label})` : ''}\n${absoluteUrl(`/product/${product.slug}`, locale)}`;
  return ok({ url: whatsappLink(settings.whatsappNumber!, text) }, { status: 201 });
});
