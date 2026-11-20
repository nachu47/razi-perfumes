import 'server-only';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { ApiError } from '../api';
import { revalidateCatalog, revalidateRates } from '../currency';
import { RESOURCES, type FieldDef, type ResourceDef } from './resources';

export function getResource(key: string): ResourceDef {
  const def = RESOURCES[key];
  if (!def) throw new ApiError(404, 'Unknown resource');
  return def;
}

/** Minimal delegate surface we use — lets one generic handler drive several Prisma models. */
interface Delegate {
  findMany(args: object): Promise<Record<string, unknown>[]>;
  findUnique(args: object): Promise<Record<string, unknown> | null>;
  create(args: object): Promise<Record<string, unknown>>;
  update(args: object): Promise<Record<string, unknown>>;
  delete(args: object): Promise<Record<string, unknown>>;
}
export function delegate(def: ResourceDef): Delegate {
  return prisma[def.model] as unknown as Delegate;
}

const emptyToNull = (v: unknown) => (v === '' || v === undefined ? null : v);

function fieldSchema(f: FieldDef): z.ZodTypeAny {
  let s: z.ZodTypeAny;
  switch (f.type) {
    case 'bool':
      return z.boolean().default(false);
    case 'int':
      s = z.coerce.number().int().min(0).max(1_000_000);
      break;
    case 'decimal':
      s = z.coerce.number().min(0).max(1_000_000);
      break;
    case 'select':
      s = z.enum(f.options!.map((o) => o.value) as [string, ...string[]]);
      break;
    case 'datetime':
      s = z.coerce.date();
      break;
    case 'slug':
      s = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${f.label}: use lowercase letters, numbers and dashes`).max(80);
      break;
    case 'image':
    case 'url':
      s = z
        .string()
        .trim()
        .max(1000)
        .refine((v) => /^https:\/\//.test(v) || v.startsWith('/'), `${f.label}: must be an https:// URL or a /path`);
      break;
    case 'longtext':
      s = z.string().max(f.max ?? 50000);
      break;
    case 'textarea':
      s = z.string().trim().max(f.max ?? 5000);
      break;
    default:
      s = z.string().trim().max(f.max ?? 300);
  }
  if (f.required) {
    if (s instanceof z.ZodString) s = s.min(1, `${f.label} is required`);
    return z.preprocess((v) => (v === '' ? undefined : v), s);
  }
  return z.preprocess(emptyToNull, s.nullable());
}

export function buildSchema(def: ResourceDef, editing: boolean) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of def.fields) {
    if (editing && f.readOnlyOnEdit) continue;
    shape[f.name] = fieldSchema(f);
  }
  return z.object(shape);
}

/** Post-validation normalisation per resource. */
export function normalise(def: ResourceDef, data: Record<string, unknown>) {
  if (def.key === 'coupons' && typeof data.code === 'string') data.code = data.code.toUpperCase().replace(/\s+/g, '');
  if (def.key === 'coupons' && data.minOrder === null) data.minOrder = 0;
  if (def.key === 'coupons' && data.type === 'PERCENT' && Number(data.value) > 100) throw new ApiError(400, 'A percent coupon cannot exceed 100%.');
  if (def.key === 'currencies' && Number(data.rateFromKWD) <= 0) throw new ApiError(400, 'Rate must be greater than 0.');
  return data;
}

export function revalidateFor(def: ResourceDef) {
  if (def.revalidate === 'catalog') revalidateCatalog();
  if (def.revalidate === 'rates') revalidateRates();
}

/** Converts Prisma unique-constraint errors into friendly 409s. */
export function friendlyPrismaError(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') throw new ApiError(409, `A record with this ${(err.meta?.target as string[] | undefined)?.join(', ') ?? 'value'} already exists.`);
    if (err.code === 'P2025') throw new ApiError(404, 'Record not found.');
    if (err.code === 'P2003') throw new ApiError(409, 'This record is in use and cannot be deleted.');
  }
  throw err;
}

/** Decimals → numbers, dates → ISO strings so rows serialise cleanly to JSON. */
export function plain(row: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v instanceof Prisma.Decimal) out[k] = Number(v);
    else if (v instanceof Date) out[k] = v.toISOString();
    else out[k] = v;
  }
  return out;
}
