import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/account', '/ar/account', '/checkout', '/ar/checkout', '/cart', '/ar/cart', '/order/', '/ar/order/', '/payment/', '/ar/payment/', '/search', '/ar/search', '/wishlist', '/ar/wishlist'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
