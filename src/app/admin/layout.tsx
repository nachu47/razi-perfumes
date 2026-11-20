import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import AdminShell from '@/components/admin/AdminShell';
import '../globals.css';

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · Razi Admin' }, robots: { index: false, follow: false } };

// Separate root layout for /admin (English-only, no storefront chrome).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  // The proxy already guards /admin; this is defense in depth.
  if (session?.user?.role !== 'ADMIN') redirect('/account/login?callbackUrl=/admin&error=admin_only');
  const [messages, reviews, enquiries] = await Promise.all([
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.review.count({ where: { isApproved: false } }),
    prisma.enquiry.count({ where: { status: 'NEW' } }),
  ]);
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AdminShell user={{ name: session.user.name, email: session.user.email }} counts={{ messages, reviews, enquiries }}>
          {children}
        </AdminShell>
      </body>
    </html>
  );
}
