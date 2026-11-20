import 'server-only';
import { auth } from '@/auth';
import { ApiError } from './api';

export async function getSessionUser() {
  const session = await auth();
  return session?.user?.id ? session.user : null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, 'Please sign in to continue.');
  return user;
}

/** Defense in depth: the proxy already guards /admin and /api/admin, but every admin handler checks again. */
export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, 'Please sign in.');
  if (user.role !== 'ADMIN') throw new ApiError(403, 'Admin access required.');
  return user;
}
