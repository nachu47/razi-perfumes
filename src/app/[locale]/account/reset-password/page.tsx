import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import AuthShell from '@/components/pages/AuthShell';
import { ResetForm } from '@/components/pages/AuthForms';

export const metadata: Metadata = { title: 'Choose a new password', robots: { index: false } };

export default async function ResetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  const t = await getTranslations('auth');
  return (
    <AuthShell title={t('resetTitle')}>
      <Suspense>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
