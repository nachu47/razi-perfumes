import { setRequestLocale } from 'next-intl/server';
import ContentPage, { contentMetadata } from '@/components/ContentPage';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  return contentMetadata('shipping-policy', (await params).locale);
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ContentPage slug="shipping-policy" locale={locale} />;
}
