import 'server-only';
import { createHash, randomBytes, createHmac, timingSafeEqual } from 'crypto';

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

/** Tokens are stored hashed so a DB leak can't be used to reset passwords. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function hmac(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
