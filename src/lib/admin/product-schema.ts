import { z } from 'zod';

const optText = (max: number) => z.string().trim().max(max).optional().nullable().transform((v) => v || null);

export const variantInput = z.object({
  id: z.string().max(50).optional(),
  label: z.string().trim().min(1, 'Variant label is required').max(50),
  sizeMl: z.coerce.number().int().min(0).max(10000).optional().nullable().transform((v) => (v ? v : null)),
  sku: z.string().trim().min(1, 'SKU is required').max(80),
  priceKWD: z.coerce.number().min(0, 'Price must be ≥ 0').max(100000),
  compareAtPriceKWD: z.coerce.number().min(0).max(100000).optional().nullable().transform((v) => (v ? v : null)),
  stock: z.coerce.number().int().min(0).max(1_000_000),
});

export const productInput = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug: lowercase letters, numbers and dashes').max(120),
  nameEn: z.string().trim().min(1, 'English name is required').max(200),
  nameAr: z.string().trim().min(1, 'Arabic name is required').max(200),
  descriptionEn: optText(5000),
  descriptionAr: optText(5000),
  notesTop: optText(300),
  notesHeart: optText(300),
  notesBase: optText(300),
  notesTopAr: optText(300),
  notesHeartAr: optText(300),
  notesBaseAr: optText(300),
  ingredientsEn: optText(2000),
  ingredientsAr: optText(2000),
  noteTags: z.array(z.string().trim().toLowerCase().max(30)).max(20).default([]),
  gender: z.enum(['MALE', 'FEMALE', 'UNISEX']),
  collectionId: z.string().max(50).optional().nullable().transform((v) => v || null),
  images: z.array(z.string().trim().max(1000).refine((v) => /^https:\/\//.test(v) || v.startsWith('/'), 'Invalid image URL')).max(12),
  isFeatured: z.boolean().default(false),
  isRecommended: z.boolean().default(false),
  isActive: z.boolean().default(true),
  variants: z.array(variantInput).min(1, 'Add at least one size / variant').max(20),
});

export type ProductInput = z.infer<typeof productInput>;
