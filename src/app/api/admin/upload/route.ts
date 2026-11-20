import { ApiError, handler, ok } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import { uploadImage } from '@/lib/storage';

// POST /api/admin/upload (multipart: file, folder?) → { url }
export const POST = handler(async (req: Request) => {
  await requireAdmin();
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) throw new ApiError(400, 'No file uploaded');
  const folder = String(form.get('folder') || 'products').replace(/[^a-z0-9-]/gi, '').slice(0, 30) || 'products';
  return ok({ url: await uploadImage(file, folder) }, { status: 201 });
});
