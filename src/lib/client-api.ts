// Browser-side fetch helper for our JSON API envelope ({ ok, data } | { ok:false, error }).
export class ClientApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
  }
}

export async function api<T>(url: string, opts: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const res = await fetch(url, {
    method: opts.method ?? (opts.body ? 'POST' : 'GET'),
    headers: opts.body ? { 'content-type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
    cache: 'no-store',
    signal: opts.signal,
  });
  let json: { ok: boolean; data?: T; error?: string; details?: unknown } | null = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok || !json?.ok) {
    throw new ClientApiError(json?.error || `Request failed (${res.status})`, res.status, json?.details);
  }
  return json.data as T;
}
