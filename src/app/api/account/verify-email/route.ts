import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/tokens';

// Link target from the verification email; redirects back to the account page.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get('email')?.toLowerCase() ?? '';
  const token = url.searchParams.get('token') ?? '';
  const target = new URL('/account', url);

  const record = token
    ? await prisma.verificationToken.findUnique({ where: { identifier_token: { identifier: email, token: hashToken(token) } } })
    : null;

  if (!record || record.expires < new Date()) {
    target.searchParams.set('verified', '0');
    return NextResponse.redirect(target);
  }
  await prisma.$transaction([
    prisma.user.update({ where: { email }, data: { emailVerified: new Date() } }),
    prisma.verificationToken.deleteMany({ where: { identifier: email } }),
  ]);
  target.searchParams.set('verified', '1');
  return NextResponse.redirect(target);
}
