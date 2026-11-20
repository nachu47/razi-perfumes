import 'server-only';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from './api';
import { randomToken } from './tokens';

const ALLOWED = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/avif', 'avif'],
]);
const MAX_BYTES = 8 * 1024 * 1024;

const cloudinaryEnabled = () =>
  Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

/** Detects the real image type from magic bytes (the browser-provided MIME type can be spoofed). */
function sniff(buf: Buffer): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (buf.subarray(4, 12).toString() === 'ftypavif') return 'image/avif';
  return null;
}

/**
 * Stores an uploaded product/hero image and returns its public URL.
 * Cloudinary when configured; otherwise /public/uploads (local development only —
 * Vercel's filesystem is read-only, so configure Cloudinary in production).
 */
export async function uploadImage(file: File, folder = 'products'): Promise<string> {
  if (file.size > MAX_BYTES) throw new ApiError(413, 'Image is too large (max 8 MB).');
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type || !ALLOWED.has(type)) throw new ApiError(415, 'Only JPG, PNG, WebP or AVIF images are allowed.');

  if (cloudinaryEnabled()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: `razi-perfumes/${folder}`, resource_type: 'image' }, (err, res) => (err || !res ? reject(err) : resolve(res)))
        .end(buf);
    });
    return result.secure_url;
  }

  if (process.env.VERCEL) throw new ApiError(500, 'Image storage is not configured. Set the CLOUDINARY_* environment variables.');
  const dir = path.join(process.cwd(), 'public', 'uploads', folder);
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${randomToken(6)}.${ALLOWED.get(type)}`;
  await writeFile(path.join(dir, name), buf);
  return `/uploads/${folder}/${name}`;
}
