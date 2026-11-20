import 'server-only';
import { unstable_cache, revalidateTag } from 'next/cache';
import { prisma } from './prisma';

export const SETTINGS_TAG = 'settings';

export interface StoreSettingsDTO {
  whatsappEnabled: boolean;
  whatsappNumber: string | null;
  whatsappGreetingEn: string;
  whatsappGreetingAr: string;
}

/** Store-wide settings (single row, created on first read). */
export const getStoreSettings = unstable_cache(
  async (): Promise<StoreSettingsDTO> => {
    const s = await prisma.storeSetting.upsert({ where: { id: 'default' }, update: {}, create: { id: 'default' } });
    return {
      whatsappEnabled: s.whatsappEnabled,
      whatsappNumber: s.whatsappNumber,
      whatsappGreetingEn: s.whatsappGreetingEn,
      whatsappGreetingAr: s.whatsappGreetingAr,
    };
  },
  ['getStoreSettings'],
  { tags: [SETTINGS_TAG], revalidate: 3600 },
);

export function revalidateSettings() {
  revalidateTag(SETTINGS_TAG, { expire: 0 });
}

/** WhatsApp is usable only when switched on and a number is configured. */
export function whatsappActive(s: StoreSettingsDTO): boolean {
  return s.whatsappEnabled && Boolean(s.whatsappNumber && s.whatsappNumber.length >= 8);
}

export function whatsappLink(number: string, text: string): string {
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}
