import type { NextAuthConfig } from 'next-auth';

// Edge/proxy-safe part of the Auth.js config (no Prisma, no bcrypt).
// The full config with providers lives in src/auth.ts.
export const authConfig = {
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: '/account/login', error: '/account/login' },
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: 'CUSTOMER' | 'ADMIN' }).role ?? 'CUSTOMER';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = (token.role as 'CUSTOMER' | 'ADMIN') ?? 'CUSTOMER';
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
