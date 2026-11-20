import 'server-only';
import { unstable_cache } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { toNum } from './money';

// All catalogue reads go through unstable_cache tagged 'catalog'. Admin writes call
// revalidateCatalog() so storefront pages update immediately after an edit.
export const CATALOG_TAG = 'catalog';
const CACHE = { tags: [CATALOG_TAG], revalidate: 600 };

export interface VariantDTO {
  id: string;
  label: string;
  sizeMl: number | null;
  sku: string;
  priceKWD: number;
  compareAtPriceKWD: number | null;
  stock: number;
}

export interface ProductCardDTO {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  image: string | null;
  images: string[];
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  noteTags: string[];
  priceFromKWD: number;
  collection: { slug: string; nameEn: string; nameAr: string } | null;
  variants: VariantDTO[];
}

export interface ReviewDTO {
  id: string;
  rating: number;
  comment: string;
  author: string;
  createdAt: string;
}

export interface ProductDetailDTO extends ProductCardDTO {
  descriptionEn: string | null;
  descriptionAr: string | null;
  notesTop: string | null;
  notesHeart: string | null;
  notesBase: string | null;
  notesTopAr: string | null;
  notesHeartAr: string | null;
  notesBaseAr: string | null;
  ingredientsEn: string | null;
  ingredientsAr: string | null;
  rating: number;
  reviewCount: number;
  reviews: ReviewDTO[];
  updatedAt: string;
}

export interface CollectionDTO {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  image: string | null;
}

const cardInclude = {
  variants: { orderBy: { sortOrder: 'asc' } },
  collection: { select: { slug: true, nameEn: true, nameAr: true } },
} satisfies Prisma.ProductInclude;

type CardRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

function toCard(p: CardRow): ProductCardDTO {
  return {
    id: p.id,
    slug: p.slug,
    nameEn: p.nameEn,
    nameAr: p.nameAr,
    image: p.images[0] ?? null,
    images: p.images,
    gender: p.gender,
    noteTags: p.noteTags,
    priceFromKWD: toNum(p.priceFromKWD),
    collection: p.collection,
    variants: p.variants.map((v) => ({
      id: v.id,
      label: v.label,
      sizeMl: v.sizeMl,
      sku: v.sku,
      priceKWD: toNum(v.priceKWD),
      compareAtPriceKWD: v.compareAtPriceKWD === null ? null : toNum(v.compareAtPriceKWD),
      stock: v.stock,
    })),
  };
}

export type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'best-selling';

export interface ProductFilters {
  collection?: string;
  featured?: boolean;
  recommended?: boolean;
  q?: string;
  gender?: 'MALE' | 'FEMALE' | 'UNISEX';
  sizeMl?: number;
  note?: string;
  minKWD?: number;
  maxKWD?: number;
  sort?: SortKey;
  page?: number;
  pageSize?: number;
  excludeId?: string;
  ids?: string[];
}

function buildWhere(f: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };
  const and: Prisma.ProductWhereInput[] = [];
  if (f.collection) where.collection = { slug: f.collection, isActive: true };
  if (f.featured) where.isFeatured = true;
  if (f.recommended) where.isRecommended = true;
  if (f.gender) where.gender = f.gender;
  if (f.excludeId) where.id = { not: f.excludeId };
  if (f.ids) where.id = { in: f.ids };
  if (f.note) where.noteTags = { has: f.note.toLowerCase() };
  if (f.sizeMl) where.variants = { some: { sizeMl: f.sizeMl } };
  if (f.minKWD !== undefined || f.maxKWD !== undefined) {
    where.priceFromKWD = {
      ...(f.minKWD !== undefined ? { gte: f.minKWD } : {}),
      ...(f.maxKWD !== undefined ? { lte: f.maxKWD } : {}),
    };
  }
  if (f.q) {
    const q = f.q.trim();
    and.push({
      OR: [
        { nameEn: { contains: q, mode: 'insensitive' } },
        { nameAr: { contains: q, mode: 'insensitive' } },
        { notesTop: { contains: q, mode: 'insensitive' } },
        { notesHeart: { contains: q, mode: 'insensitive' } },
        { notesBase: { contains: q, mode: 'insensitive' } },
        { noteTags: { has: q.toLowerCase() } },
        { collection: { OR: [{ nameEn: { contains: q, mode: 'insensitive' } }, { nameAr: { contains: q, mode: 'insensitive' } }] } },
      ],
    });
  }
  if (and.length) where.AND = and;
  return where;
}

function buildOrder(sort: SortKey | undefined): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case 'price-asc':
      return [{ priceFromKWD: 'asc' }, { createdAt: 'desc' }];
    case 'price-desc':
      return [{ priceFromKWD: 'desc' }, { createdAt: 'desc' }];
    case 'best-selling':
      return [{ soldCount: 'desc' }, { createdAt: 'desc' }];
    default:
      return [{ createdAt: 'desc' }, { nameEn: 'asc' }];
  }
}

export const listProducts = unstable_cache(
  async (f: ProductFilters): Promise<{ items: ProductCardDTO[]; total: number; page: number; pageCount: number }> => {
    const pageSize = Math.min(Math.max(f.pageSize ?? 12, 1), 48);
    const page = Math.max(f.page ?? 1, 1);
    const where = buildWhere(f);
    const [rows, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: cardInclude,
        orderBy: buildOrder(f.sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);
    return { items: rows.map(toCard), total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
  },
  ['listProducts'],
  CACHE,
);

export const getProductBySlug = unstable_cache(
  async (slug: string): Promise<ProductDetailDTO | null> => {
    const p = await prisma.product.findFirst({
      where: { slug, isActive: true },
      include: {
        ...cardInclude,
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { user: { select: { name: true } } },
        },
      },
    });
    if (!p) return null;
    const ratingAgg = await prisma.review.aggregate({
      where: { productId: p.id, isApproved: true },
      _avg: { rating: true },
      _count: true,
    });
    return {
      ...toCard(p),
      descriptionEn: p.descriptionEn,
      descriptionAr: p.descriptionAr,
      notesTop: p.notesTop,
      notesHeart: p.notesHeart,
      notesBase: p.notesBase,
      notesTopAr: p.notesTopAr,
      notesHeartAr: p.notesHeartAr,
      notesBaseAr: p.notesBaseAr,
      ingredientsEn: p.ingredientsEn,
      ingredientsAr: p.ingredientsAr,
      rating: Math.round((ratingAgg._avg.rating ?? 0) * 10) / 10,
      reviewCount: ratingAgg._count,
      reviews: p.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        author: r.user.name?.split(' ')[0] || 'Customer',
        createdAt: r.createdAt.toISOString(),
      })),
      updatedAt: p.updatedAt.toISOString(),
    };
  },
  ['getProductBySlug'],
  CACHE,
);

export const getCollections = unstable_cache(
  async (): Promise<CollectionDTO[]> => {
    const rows = await prisma.collection.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }] });
    return rows.map(({ id, slug, nameEn, nameAr, descriptionEn, descriptionAr, image }) => ({
      id, slug, nameEn, nameAr, descriptionEn, descriptionAr, image,
    }));
  },
  ['getCollections'],
  CACHE,
);

export async function getCollectionBySlug(slug: string): Promise<CollectionDTO | null> {
  return (await getCollections()).find((c) => c.slug === slug) ?? null;
}

export interface HeroSlideDTO {
  id: string;
  imageDesktop: string;
  imageMobile: string | null;
  titleEn: string;
  titleAr: string;
  taglineEn: string | null;
  taglineAr: string | null;
  link: string;
}

export const getHeroSlides = unstable_cache(
  async (): Promise<HeroSlideDTO[]> =>
    prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, imageDesktop: true, imageMobile: true, titleEn: true, titleAr: true, taglineEn: true, taglineAr: true, link: true },
    }),
  ['getHeroSlides'],
  CACHE,
);

export const getAvailableSizes = unstable_cache(
  async (): Promise<number[]> => {
    const rows = await prisma.productVariant.findMany({
      where: { sizeMl: { not: null }, product: { isActive: true } },
      distinct: ['sizeMl'],
      select: { sizeMl: true },
      orderBy: { sizeMl: 'asc' },
    });
    return rows.map((r) => r.sizeMl!).filter(Boolean);
  },
  ['getAvailableSizes'],
  CACHE,
);

export interface PageDTO {
  slug: string;
  titleEn: string;
  titleAr: string;
  contentEn: string;
  contentAr: string;
  updatedAt: string;
}

export const getPage = unstable_cache(
  async (slug: string): Promise<PageDTO | null> => {
    const p = await prisma.page.findUnique({ where: { slug } });
    return p ? { slug: p.slug, titleEn: p.titleEn, titleAr: p.titleAr, contentEn: p.contentEn, contentAr: p.contentAr, updatedAt: p.updatedAt.toISOString() } : null;
  },
  ['getPage'],
  CACHE,
);

export const getLocations = unstable_cache(
  async () => prisma.location.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
  ['getLocations'],
  CACHE,
);

/** Keep Product.priceFromKWD (used for price filter + sort) in sync with its variants. */
export async function syncProductPrice(productId: string, tx: Prisma.TransactionClient = prisma) {
  const agg = await tx.productVariant.aggregate({ where: { productId }, _min: { priceKWD: true } });
  await tx.product.update({ where: { id: productId }, data: { priceFromKWD: agg._min.priceKWD ?? 0 } });
}
