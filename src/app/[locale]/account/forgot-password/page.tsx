import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import AuthShell from '@/components/pages/AuthShell';
import { ForgotForm } from '@/components/pages/AuthForms';

export const metadata: Metadata = { title: 'Reset password', robots: { index: false } };

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  const t = await getTranslations('auth');
  return (
    <AuthShell title={t('forgotTitle')} subtitle={t('forgotText')}>
      <ForgotForm />
    </AuthShell>
  );
}
