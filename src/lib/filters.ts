import { z } from 'zod';
import type { ProductFilters } from './catalog';
import type { Rates } from './money';

// Parses shop/collection/search query-strings. Price bounds arrive in the visitor's
// currency and are converted to KWD because catalogue prices are stored in KWD.
const schema = z.object({
  q: z.string().trim().max(100).optional(),
  collection: z.string().max(80).optional(),
  featured: z.enum(['1', 'true']).optional(),
  gender: z.enum(['male', 'female', 'unisex']).optional(),
  size: z.coerce.number().int().positive().max(5000).optional(),
  note: z.string().trim().toLowerCase().max(30).optional(),
  min: z.coerce.number().nonnegative().max(1_000_000).optional(),
  max: z.coerce.number().nonnegative().max(1_000_000).optional(),
  sort: z.enum(['newest', 'price-asc', 'price-desc', 'best-selling']).optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
});

export type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseFilters(raw: RawSearchParams, currency: string, rates: Rates): ProductFilters {
  const flat: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const val = Array.isArray(v) ? v[0] : v;
    if (val !== undefined && val !== '' && val !== 'all') flat[k] = val;
  }
  const parsed = schema.safeParse(flat);
  const d = parsed.success ? parsed.data : {};
  const rate = rates[currency] ?? 1;
  return {
    q: d.q || undefined,
    collection: d.collection,
    featured: d.featured ? true : undefined,
    gender: d.gender ? (d.gender.toUpperCase() as ProductFilters['gender']) : undefined,
    sizeMl: d.size,
    note: d.note,
    minKWD: d.min !== undefined ? d.min / rate : undefined,
    maxKWD: d.max !== undefined ? d.max / rate : undefined,
    sort: d.sort ?? 'newest',
    page: d.page ?? 1,
  };
}

export function searchParamsToRecord(sp: URLSearchParams): RawSearchParams {
  const out: RawSearchParams = {};
  sp.forEach((v, k) => {
    out[k] = v;
  });
  return out;
}
