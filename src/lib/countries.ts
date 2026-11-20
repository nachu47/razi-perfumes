// Client-safe country / currency metadata. Exchange rates live in the DB (CurrencyRate).

export type CountryCode = 'KW' | 'SA' | 'AE' | 'QA' | 'OM' | 'BH';
export type CurrencyCode = 'KWD' | 'SAR' | 'AED' | 'QAR' | 'OMR' | 'BHD';

export interface CountryInfo {
  code: CountryCode;
  nameEn: string;
  nameAr: string;
  flag: string;
  currency: CurrencyCode;
  symbolEn: string;
  symbolAr: string;
  decimals: number;
  phonePrefix: string;
}

export const COUNTRIES: CountryInfo[] = [
  { code: 'KW', nameEn: 'Kuwait', nameAr: 'الكويت', flag: '🇰🇼', currency: 'KWD', symbolEn: 'KD', symbolAr: 'د.ك', decimals: 3, phonePrefix: '+965' },
  { code: 'SA', nameEn: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية', flag: '🇸🇦', currency: 'SAR', symbolEn: 'SAR', symbolAr: 'ر.س', decimals: 2, phonePrefix: '+966' },
  { code: 'AE', nameEn: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة', flag: '🇦🇪', currency: 'AED', symbolEn: 'AED', symbolAr: 'د.إ', decimals: 2, phonePrefix: '+971' },
  { code: 'QA', nameEn: 'Qatar', nameAr: 'قطر', flag: '🇶🇦', currency: 'QAR', symbolEn: 'QAR', symbolAr: 'ر.ق', decimals: 2, phonePrefix: '+974' },
  { code: 'OM', nameEn: 'Oman', nameAr: 'عُمان', flag: '🇴🇲', currency: 'OMR', symbolEn: 'OMR', symbolAr: 'ر.ع', decimals: 3, phonePrefix: '+968' },
  { code: 'BH', nameEn: 'Bahrain', nameAr: 'البحرين', flag: '🇧🇭', currency: 'BHD', symbolEn: 'BHD', symbolAr: 'د.ب', decimals: 3, phonePrefix: '+973' },
];

export const COUNTRY_CODES = COUNTRIES.map((c) => c.code) as [CountryCode, ...CountryCode[]];
export const COUNTRY_COOKIE = 'razi_country';
export const DEFAULT_COUNTRY: CountryCode = 'KW';

export function getCountry(code: string | undefined | null): CountryInfo {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

export function getCountryByCurrency(currency: string): CountryInfo {
  return COUNTRIES.find((c) => c.currency === currency) ?? COUNTRIES[0];
}
