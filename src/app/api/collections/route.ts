import { handler, ok } from '@/lib/api';
import { getCollections } from '@/lib/catalog';

export const GET = handler(async () => ok(await getCollections()));
