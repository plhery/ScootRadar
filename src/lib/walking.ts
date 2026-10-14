import { haversineM } from '@/lib/geo';
import { formatLocale } from '@/lib/formatLocale';
import type { AppLocale, TranslationKey } from '@/lib/i18n';

// A straight line at an easy pace: the same estimate as the iOS app.
const WALKING_METERS_PER_MINUTE = 80;

/** The walk from the origin (your location or a searched place) to a scooter or a parking bay. */
export interface WalkEstimate {
  distanceM: number;
  /** The searched place the walk starts from; null when it starts from your location. */
  place: string | null;
}

/** Where walking times are measured from. A searched place wins over your location until it is cleared. */
export interface WalkOrigin {
  point: [number, number];
  /** The title of the searched place; null for your location. */
  place: string | null;
}

export function walkingMinutes(distanceM: number): number {
  return Math.max(1, Math.ceil(distanceM / WALKING_METERS_PER_MINUTE));
}

export function walkEstimate(origin: WalkOrigin | null, lat: number, lng: number): WalkEstimate | null {
  if (!origin) return null;
  return { distanceM: haversineM(origin.point[0], origin.point[1], lat, lng), place: origin.place };
}

/** Walking directions to a scooter or a parking bay; the link carries the destination only. */
export function walkingDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}&travelmode=walking`;
}

/** The value of useI18n() satisfies this. */
export interface DistanceFormatter {
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  /** The UI language, which names miles, feet and yards: "pi" for feet in French. */
  locale?: AppLocale;
  /** The format region, which picks the units; metric when absent. See formatLocale.ts. */
  region?: string;
}

/**
 * The units of a region, as iOS picks them for lengths on roads from the
 * locale's measurement system: miles and feet in the US (and in Liberia and
 * Myanmar, the other two that never went metric), miles and yards in the UK,
 * metres and kilometres everywhere else.
 */
export type MeasurementSystem = 'metric' | 'us' | 'uk';

export function measurementSystem(region: string | undefined): MeasurementSystem {
  if (region === 'US' || region === 'LR' || region === 'MM') return 'us';
  return region === 'GB' ? 'uk' : 'metric';
}

const METERS_PER_FOOT = 0.3048;
const METERS_PER_YARD = 0.9144;
const METERS_PER_MILE = 1609.344;

interface ImperialLength {
  value: number;
  unit: 'foot' | 'yard' | 'mile';
  maximumFractionDigits: number;
}

/**
 * Feet or yards under half a mile and miles from there, rounded as iOS rounds
 * lengths on roads (Measurement with the .road usage): to 1 below 10, to 10
 * below 100, to 50 from there, so 300 m is "1,000 ft" or "350 yd"; miles keep
 * two decimals below 1, one below 10, none from there: "0.62 mi", "1.9 mi", "38 mi".
 */
function imperialLength(meters: number, system: 'us' | 'uk'): ImperialLength {
  const miles = meters / METERS_PER_MILE;
  if (miles >= 0.5) return { value: miles, unit: 'mile', maximumFractionDigits: miles < 1 ? 2 : miles < 10 ? 1 : 0 };
  const short = meters / (system === 'us' ? METERS_PER_FOOT : METERS_PER_YARD);
  const step = short < 10 ? 1 : short < 100 ? 10 : 50;
  return { value: Math.round(short / step) * step, unit: system === 'us' ? 'foot' : 'yard', maximumFractionDigits: 0 };
}

function imperialFormat({ unit, maximumFractionDigits }: ImperialLength, { locale, region }: DistanceFormatter): Intl.NumberFormat {
  return new Intl.NumberFormat(formatLocale(locale ?? 'en', region), {
    style: 'unit',
    unit,
    unitDisplay: 'short',
    maximumFractionDigits,
  });
}

/** The same figure in two parts, for where the unit is set smaller than the number. */
export function distanceParts(meters: number, formatter: DistanceFormatter): { value: string; unit: string } {
  const system = measurementSystem(formatter.region);
  if (system !== 'metric') {
    const length = imperialLength(meters, system);
    const parts = imperialFormat(length, formatter).formatToParts(length.value);
    return {
      value: parts.filter(part => part.type !== 'unit' && part.type !== 'literal').map(part => part.value).join(''),
      unit: parts.filter(part => part.type === 'unit').map(part => part.value).join(' '),
    };
  }
  const { formatNumber } = formatter;
  return meters < 1000
    ? { value: formatNumber(Math.round(meters)), unit: 'm' }
    : { value: formatNumber(meters / 1000, { maximumFractionDigits: 1 }), unit: 'km' };
}

/**
 * "320 m" below a kilometre; "1.4 km" and "24 km" from there. Where the region
 * measures in miles, "1,000 ft" or "350 yd" below half a mile, then "1.9 mi".
 */
export function formatDistance(meters: number, formatter: DistanceFormatter): string {
  const system = measurementSystem(formatter.region);
  if (system !== 'metric') {
    const length = imperialLength(meters, system);
    return imperialFormat(length, formatter).format(length.value);
  }
  const { t, formatNumber } = formatter;
  return meters < 1000
    ? t('distance.meters', { count: formatNumber(Math.round(meters)) })
    : t('distance.kilometers', { count: formatNumber(meters / 1000, { maximumFractionDigits: 1 }) });
}

/** A city's distance in whole kilometres, or whole miles, never 0: "Bern · 61 km", "Bern · 38 mi". */
export function formatCityDistance(meters: number, formatter: DistanceFormatter): string {
  if (measurementSystem(formatter.region) === 'metric') {
    return formatter.t('distance.kilometers', { count: formatter.formatNumber(Math.max(1, Math.round(meters / 1000))) });
  }
  const miles = { value: Math.max(1, Math.round(meters / METERS_PER_MILE)), unit: 'mile', maximumFractionDigits: 0 } as const;
  return imperialFormat(miles, formatter).format(miles.value);
}
