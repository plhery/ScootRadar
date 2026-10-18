import { formatLocale } from '@/lib/formatLocale';
import type { AppLocale } from '@/lib/i18n';
import type { RidePricing } from '@/lib/types';

// The web counterpart of RidePriceEstimator in ios/ScootRadar/Models/ScooterModels.swift,
// without ride passes.

export const RIDE_DURATIONS = [5, 10, 15, 20, 30] as const;
export type RideDuration = (typeof RIDE_DURATIONS)[number];
export const DEFAULT_RIDE_DURATION: RideDuration = 10;
export const RIDE_DURATION_STORAGE_KEY = 'scooters-ride-minutes';

export function normalizeRideDuration(minutes: unknown): RideDuration {
  return RIDE_DURATIONS.find(allowed => allowed === minutes) ?? DEFAULT_RIDE_DURATION;
}

export interface RidePriceQuote {
  currency: string;
  durationMinutes: number;
  unlockFeeMinorUnits: number;
  minuteFeeMinorUnits: number;
  totalMinorUnits: number;
  /** Tax is added to these prices: "+ tax" follows them. */
  plusTax: boolean;
  /** The minute fee is the lowest of a range: "from", and the total is the least the ride costs. */
  minuteFeeFrom: boolean;
  /** "YYYY-MM-DD" where the feed has no price and this is the operator's listed one, checked that day. */
  listedOn: string | null;
}

function wholeAmount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

export function ridePriceQuote(pricing: RidePricing, durationMinutes: number): RidePriceQuote {
  const minutes = wholeAmount(durationMinutes);
  const unlockFee = wholeAmount(pricing.unlock_fee_minor_units);
  const minuteFee = wholeAmount(pricing.minute_fee_minor_units);
  return {
    currency: pricing.currency,
    durationMinutes: minutes,
    unlockFeeMinorUnits: unlockFee,
    minuteFeeMinorUnits: minuteFee,
    // Saturates, as the Swift version does on overflow.
    totalMinorUnits: Math.min(unlockFee + minuteFee * minutes, Number.MAX_SAFE_INTEGER),
    plusTax: pricing.plus_tax === true,
    minuteFeeFrom: pricing.minute_fee_from === true,
    listedOn: pricing.listed_on ?? null,
  };
}

// Forints are written whole: the fillér left circulation in 1999, yet ISO 4217
// still gives HUF two decimals, and Safari follows it ("HUF 272.00") where
// Chrome doesn't. RidePriceFormatter in ScooterControls.swift lists the same.
const WHOLE_UNIT_CURRENCIES = new Set(['HUF']);

/** Two decimals, or none for a currency that has no cents: "ISK 350", "HUF 272". */
export function currencyFractionDigits(currency: string): 0 | 2 {
  const code = currency.toUpperCase();
  if (WHOLE_UNIT_CURRENCIES.has(code)) return 0;
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency: code })
      .resolvedOptions().maximumFractionDigits === 0 ? 0 : 2;
  } catch {
    // Not a currency code Intl accepts.
    return 2;
  }
}

/** "CHF 4.50" in the app's locale and format region; minor units are hundredths, as on iOS. */
export function formatRidePrice(minorUnits: number, currency: string, locale: AppLocale, region?: string): string {
  const amount = minorUnits / 100;
  const code = currency.toUpperCase();
  try {
    const digits = currencyFractionDigits(code);
    return new Intl.NumberFormat(formatLocale(locale, region), {
      style: 'currency',
      currency: code,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);
  } catch {
    // Not a currency code Intl accepts.
    return `${code} ${amount.toFixed(2)}`;
  }
}

/** "18 Oct", or "18 Oct 2026" when that is not this year, for the day a listed price was checked. */
export function formatListedDay(day: string, locale: AppLocale, region?: string, now = Date.now()): string {
  const time = Date.parse(`${day}T00:00:00Z`);
  if (!Number.isFinite(time)) return day;
  const sameYear = new Date(time).getUTCFullYear() === new Date(now).getUTCFullYear();
  return new Intl.DateTimeFormat(formatLocale(locale, region), {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
    timeZone: 'UTC',
  }).format(time);
}

/** The duration chosen last on this device. */
export function loadRideDuration(): RideDuration {
  try {
    const stored = localStorage.getItem(RIDE_DURATION_STORAGE_KEY);
    return stored === null ? DEFAULT_RIDE_DURATION : normalizeRideDuration(Number(stored));
  } catch {
    return DEFAULT_RIDE_DURATION;
  }
}

export function saveRideDuration(minutes: number): RideDuration {
  const duration = normalizeRideDuration(minutes);
  try { localStorage.setItem(RIDE_DURATION_STORAGE_KEY, String(duration)); } catch {}
  return duration;
}
