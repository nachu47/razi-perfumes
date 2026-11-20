import { NextResponse, type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import NextAuth from 'next-auth';
import { routing } from './i18n/routing';
import { authConfig } from './auth.config';

const intl = createIntlMiddleware(routing);
const { auth } = NextAuth(authConfig);

// Endpoints that legitimately receive cross-origin POSTs
const CSRF_EXEMPT = ['/api/auth/', '/api/payments/webhook'];

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) {
    // Browsers always send Origin on cross-site POST/PUT/PATCH/DELETE; fall back to Referer.
    const referer = req.headers.get('referer');
    if (!referer) return true; // non-browser client (curl, server-to-server) — cookies aren't attached cross-site
    return new URL(referer).host === req.nextUrl.host;
  }
  return new URL(origin).host === (req.headers.get('x-forwarded-host') || req.nextUrl.host);
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  if (pathname.startsWith('/api/')) {
    const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    if (mutating && !CSRF_EXEMPT.some((p) => pathname.startsWith(p)) && !sameOrigin(req)) {
      return NextResponse.json({ ok: false, error: 'Cross-site request blocked' }, { status: 403 });
    }
    if (pathname.startsWith('/api/admin')) {
      if (!req.auth) return NextResponse.json({ ok: false, error: 'Please sign in.' }, { status: 401 });
      if (role !== 'ADMIN') return NextResponse.json({ ok: false, error: 'Admin access required.' }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (role !== 'ADMIN') {
      const url = new URL('/account/login', req.nextUrl);
      url.searchParams.set('callbackUrl', pathname);
      if (req.auth) url.searchParams.set('error', 'admin_only');
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return intl(req);
});

export const config = {
  // Everything except Next internals and files with an extension (images, robots.txt, sitemap.xml …)
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
