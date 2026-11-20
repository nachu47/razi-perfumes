import type { Metadata } from 'next';
import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import AccountDashboard from '@/components/pages/AccountDashboard';
import { auth } from '@/auth';

export const metadata: Metadata = { title: 'My Account', robots: { index: false } };

export default async function AccountPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ verified?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session?.user) {
    const { verified } = await searchParams;
    redirect({ href: `/account/login?callbackUrl=${encodeURIComponent('/account' + (verified ? `?verified=${verified}` : ''))}`, locale });
  }
  return (
    <Suspense fallback={<div className="spinner" style={{ marginTop: 160 }} />}>
      <AccountDashboard />
    </Suspense>
  );
}
