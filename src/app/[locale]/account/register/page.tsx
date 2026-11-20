import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import AuthShell from '@/components/pages/AuthShell';
import { RegisterForm } from '@/components/pages/AuthForms';
import { googleEnabled } from '@/auth';

export const metadata: Metadata = { title: 'Create account', robots: { index: false } };

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  const t = await getTranslations('auth');
  return (
    <AuthShell title={t('registerTitle')}>
      <Suspense>
        <RegisterForm googleEnabled={googleEnabled} />
      </Suspense>
    </AuthShell>
  );
}
