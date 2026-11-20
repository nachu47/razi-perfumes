import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validators';
import { authConfig } from './auth.config';

class InvalidLogin extends CredentialsSignin {
  code = 'invalid_credentials';
}

export const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// Simple per-email brute-force guard for the credentials provider
const attempts = new Map<string, { count: number; resetAt: number }>();
function tooManyAttempts(email: string): boolean {
  const now = Date.now();
  const a = attempts.get(email);
  if (!a || a.resetAt < now) {
    attempts.set(email, { count: 1, resetAt: now + 15 * 60_000 });
    return false;
  }
  a.count += 1;
  return a.count > 10;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) throw new InvalidLogin();
        const { email, password } = parsed.data;
        if (tooManyAttempts(email)) throw new InvalidLogin();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) throw new InvalidLogin();
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) throw new InvalidLogin();
        attempts.delete(email);
        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
      },
    }),
    ...(googleEnabled
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // Google verifies email ownership, so linking to an existing email/password account is safe
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
  ],
  events: {
    // Google users are verified by Google
    async linkAccount({ user }) {
      if (user.id) await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
    },
  },
});
