import type { RawSearchParams } from './filters';

/** Flatten Next's searchParams into string pairs, dropping the page number (pagination re-adds it). */
export function flatQuery(sp: RawSearchParams, drop: string[] = ['page']): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const val = Array.isArray(v) ? v[0] : v;
    if (val && !drop.includes(k)) out[k] = val;
  }
  return out;
}
