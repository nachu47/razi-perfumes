// Client-safe money helpers. Catalogue prices are KWD; display/charge currency is
// chosen by the visitor's country. Rounding follows each currency's minor units.
import { getCountryByCurrency } from './countries';

export type Rates = Record<string, number>;

export function round(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * f) / f;
}

export function decimalsFor(currency: string): number {
  return getCountryByCurrency(currency).decimals;
}

/** Convert a KWD amount into `currency` using DB rates, rounded to that currency's decimals. */
export function convertFromKWD(amountKWD: number, currency: string, rates: Rates): number {
  const rate = rates[currency] ?? 1;
  return round(amountKWD * rate, decimalsFor(currency));
}

/** "23.000 KD" / "280.60 SAR" in English, "23.000 د.ك" in Arabic */
export function formatMoney(amount: number, currency: string, locale: string = 'en'): string {
  const c = getCountryByCurrency(currency);
  const symbol = locale === 'ar' ? c.symbolAr : c.symbolEn;
  const num = amount.toLocaleString('en-US', {
    minimumFractionDigits: c.decimals,
    maximumFractionDigits: c.decimals,
    useGrouping: true,
  });
  return `${num} ${symbol}`;
}

export function toNum(value: unknown): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : Number(String(value));
}
