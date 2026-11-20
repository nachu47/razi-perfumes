import { setRequestLocale } from 'next-intl/server';
import ContentPage, { contentMetadata } from '@/components/ContentPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return contentMetadata('terms', (await params).locale);
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContentPage slug="terms" locale={locale} />;
}
