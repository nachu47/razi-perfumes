import { cookies } from 'next/headers';
import { z } from 'zod';
import { handler, ok, readJson } from '@/lib/api';
import { COUNTRY_CODES, COUNTRY_COOKIE, getCountry } from '@/lib/countries';

const schema = z.object({ country: z.enum(COUNTRY_CODES) });

// POST /api/preferences { country } — stores the store country (drives currency + shipping)
export const POST = handler(async (req: Request) => {
  const { country } = schema.parse(await readJson(req));
  const store = await cookies();
  store.set(COUNTRY_COOKIE, country, { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365, secure: process.env.NODE_ENV === 'production' });
  return ok({ country: getCountry(country) });
});
