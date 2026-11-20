// Zod schemas shared by API routes (server) and forms (client).
import { z } from 'zod';
import { COUNTRY_CODES } from './countries';

export const emailSchema = z.string().trim().toLowerCase().email('Please enter a valid email address').max(254);
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long');
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]{7,20}$/, 'Please enter a valid phone number');

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, 'Password is required').max(128) });

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal('')),
  password: passwordSchema,
  locale: z.enum(['en', 'ar']).default('en'),
});

export const forgotPasswordSchema = z.object({ email: emailSchema, locale: z.enum(['en', 'ar']).default('en') });
export const resetPasswordSchema = z.object({ token: z.string().min(20).max(200), password: passwordSchema });
export const changePasswordSchema = z.object({ currentPassword: z.string().max(128).optional(), newPassword: passwordSchema });
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: phoneSchema.optional().or(z.literal('')),
});

const opt = (max: number) => z.string().trim().max(max).optional().or(z.literal('')).transform((v) => v || undefined);

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(100),
  phone: phoneSchema,
  country: z.enum(COUNTRY_CODES),
  city: z.string().trim().min(2, 'Governorate / city is required').max(100),
  area: z.string().trim().min(2, 'Area is required').max(100),
  block: opt(30),
  street: z.string().trim().min(1, 'Street is required').max(100),
  building: z.string().trim().min(1, 'Building / house is required').max(50),
  floor: opt(20),
  apartment: opt(20),
  notes: opt(500),
  isDefault: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const cartAddSchema = z.object({
  variantId: z.string().min(1).max(50),
  quantity: z.number().int().min(1).max(20).default(1),
});
export const cartUpdateSchema = z.object({ quantity: z.number().int().min(0).max(20) });
export const couponSchema = z.object({ code: z.string().trim().toUpperCase().min(2).max(40) });
export const wishlistToggleSchema = z.object({ productId: z.string().min(1).max(50) });

export const checkoutSchema = z.object({
  email: emailSchema,
  phone: phoneSchema,
  address: addressSchema,
  saveAddress: z.boolean().optional(),
  paymentMethod: z.enum(['COD', 'KNET', 'CARD', 'APPLE_PAY']),
  couponCode: z.string().trim().toUpperCase().max(40).optional().or(z.literal('')),
  notes: opt(500),
  locale: z.enum(['en', 'ar']).default('en'),
  // Buy Now: skip the cart and check out a single variant
  buyNow: z.object({ variantId: z.string().min(1).max(50), quantity: z.number().int().min(1).max(20) }).optional(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3, 'Please write a short comment').max(2000),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  email: emailSchema,
  phone: phoneSchema.optional().or(z.literal('')),
  subject: z.string().trim().min(2, 'Please enter a subject').max(200),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(5000),
  // Honeypot — real users never fill this hidden field
  website: z.string().max(0).optional().or(z.literal('')),
});

export const newsletterSchema = z.object({ email: emailSchema, website: z.string().max(0).optional().or(z.literal('')) });
