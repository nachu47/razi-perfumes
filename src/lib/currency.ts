import 'server-only';
import { cookies } from 'next/headers';
import { unstable_cache, revalidateTag } from 'next/cache';
import { prisma } from './prisma';
import { COUNTRY_COOKIE, getCountry, type CountryInfo } from './countries';
import type { Rates } from './money';

export const RATES_TAG = 'rates';

export const getRates = unstable_cache(
  async (): Promise<Rates> => {
    const rows = await prisma.currencyRate.findMany();
    const rates: Rates = { KWD: 1 };
    for (const r of rows) rates[r.code] = Number(r.rateFromKWD);
    return rates;
  },
  ['getRates'],
  { tags: [RATES_TAG], revalidate: 3600 },
);

/** Visitor's selected country (cookie), defaulting to Kuwait. */
export async function getVisitorCountry(): Promise<CountryInfo> {
  const store = await cookies();
  return getCountry(store.get(COUNTRY_COOKIE)?.value);
}

/** Expire every storefront cache entry right away (used after admin writes). */
export function revalidateCatalog() {
  revalidateTag('catalog', { expire: 0 });
}

export function revalidateRates() {
  revalidateTag(RATES_TAG, { expire: 0 });
}
