import { handler, ok } from '@/lib/api';
import { listProducts } from '@/lib/catalog';
import { getRates, getVisitorCountry } from '@/lib/currency';
import { parseFilters, searchParamsToRecord } from '@/lib/filters';

// GET /api/products?collection=&q=&gender=&size=&note=&min=&max=&sort=&page=
export const GET = handler(async (req: Request) => {
  const url = new URL(req.url);
  const [country, rates] = await Promise.all([getVisitorCountry(), getRates()]);
  const filters = parseFilters(searchParamsToRecord(url.searchParams), country.currency, rates);
  return ok(await listProducts(filters));
});
