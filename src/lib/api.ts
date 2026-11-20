import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/** Typed response envelope used by every /api route. */
export type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string; details?: unknown };

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiResponse<T>>({ ok: true, data }, init);
}

export function fail(status: number, error: string, details?: unknown) {
  return NextResponse.json<ApiResponse<never>>({ ok: false, error, details }, { status });
}

/** Wrap a route handler: converts ApiError / ZodError / unknown errors into JSON responses. */
export function handler<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) return fail(err.status, err.message, err.details);
      if (err instanceof ZodError) {
        return fail(
          400,
          err.issues[0]?.message || 'Invalid input',
          err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        );
      }
      console.error('[api] unhandled error', err);
      return fail(500, 'Something went wrong. Please try again.');
    }
  };
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, 'Invalid JSON body');
  }
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}
