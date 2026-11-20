import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { absoluteUrl } from '@/lib/site';

export const revalidate = 3600;

// One entry per page with hreflang alternates for English and Arabic
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections, pages] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.collection.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.page.findMany({ select: { slug: true, updatedAt: true } }),
  ]);

  const entry = (path: string, lastModified?: Date, priority = 0.6): MetadataRoute.Sitemap[number] => ({
    url: absoluteUrl(path, 'en'),
    lastModified,
    priority,
    alternates: { languages: { en: absoluteUrl(path, 'en'), ar: absoluteUrl(path, 'ar') } },
  });

  return [
    entry('/', undefined, 1),
    entry('/shop', undefined, 0.9),
    entry('/locations', undefined, 0.4),
    entry('/contact', undefined, 0.4),
    ...collections.map((c) => entry(`/collection/${c.slug}`, c.updatedAt, 0.8)),
    ...products.map((p) => entry(`/product/${p.slug}`, p.updatedAt, 0.7)),
    ...pages.map((p) => entry(`/${p.slug}`, p.updatedAt, 0.3)),
  ];
}
