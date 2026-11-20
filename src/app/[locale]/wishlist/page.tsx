import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import WishlistView from '@/components/pages/WishlistView';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return { title: t('wishlistTitle'), robots: { index: false } };
}

export default async function WishlistPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  return <WishlistView />;
}
