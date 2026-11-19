import { haversineM } from '@/lib/geo';
import { formatLocale } from '@/lib/formatLocale';
import type { AppLocale } from '@/lib/i18n';

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
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  /** The UI language, which names miles, feet and yards: "pi" for feet in French. */
  locale?: AppLocale;
  /** The format region, which writes the numbers; it picks the units too where unitsRegion is absent. See formatLocale.ts. */
  region?: string;
  /** The region whose units Automatic follows: the time zone's, else the format region's (unitsRegion). */
  unitsRegion?: string;
  /** The units chosen in the settings, over the region's; Automatic when absent. */
  units?: UnitsChoice;
}

/**
 * The units of a region, as iOS picks them for lengths on roads from the
 * locale's measurement system: miles and feet in the US (and in Liberia and
 * Myanmar, the other two that never went metric), miles and yards in the UK,
 * metres and kilometres everywhere else.
 */
export type MeasurementSystem = 'metric' | 'us' | 'uk';

/**
 * The units chosen in the settings: Automatic, the region's, or kilometres or miles whatever the
 * region, for a visitor whose browser asks for American English and who rides in kilometres.
 */
export type UnitsChoice = 'auto' | 'metric' | 'imperial';

/**
 * The units of every length and speed the map writes or decides on: the region's under Automatic.
 * Miles chosen take yards under half a mile where the region is the UK's and feet everywhere else.
 */
export function measurementSystem(region: string | undefined, units: UnitsChoice = 'auto'): MeasurementSystem {
  if (units === 'metric') return 'metric';
  if (units === 'imperial') return region === 'GB' ? 'uk' : 'us';
  if (region === 'US' || region === 'LR' || region === 'MM') return 'us';
  return region === 'GB' ? 'uk' : 'metric';
}

/** The units a formatter writes in: those chosen, or under Automatic those of its units region. */
export function formatterSystem({ region, unitsRegion, units }: Pick<DistanceFormatter, 'region' | 'unitsRegion' | 'units'>): MeasurementSystem {
  return measurementSystem(unitsRegion ?? region, units);
}

// The time zones of the regions that measure in US units (the US, Liberia, Myanmar), and of the UK and its Crown
// dependencies, which write miles and yards: the same lists as Peek's website (delivery-tracker src/lib/units.ts).
const US_UNIT_TIME_ZONE = new RegExp('^(America/(New_York|Detroit|Chicago|Menominee|Denver|Boise|Phoenix|Los_Angeles|Anchorage'
  + '|Juneau|Sitka|Metlakatla|Yakutat|Nome|Adak|Indianapolis|Fort_Wayne|Knox_IN|Louisville|(Indiana|Kentucky|North_Dakota)/.+)'
  + '|Pacific/Honolulu|US/.+|Africa/Monrovia|Asia/(Yangon|Rangoon))$');
const UK_TIME_ZONE = /^Europe\/(London|Belfast|Guernsey|Isle_of_Man|Jersey)$/;

/**
 * The region whose units Automatic follows in a browser in this time zone: "US" for the US's zones and Liberia's
 * and Myanmar's, "GB" for London's, and "001", the world, which measures in metres, for any other place. Undefined
 * for a zone that names no place (UTC, an offset), where the format region decides. The zone comes first because a
 * browser's languages say little about where it is: Chrome's English is en-US wherever it runs, which wrote miles,
 * feet and mph in Zurich and Paris until 19 November 2026. A browser has no measurement setting to read, as an
 * iPhone or Android 16 has.
 */
export function timeZoneUnitsRegion(timeZone: string | undefined): string | undefined {
  if (!timeZone?.includes('/') || timeZone.startsWith('Etc/')) return undefined;
  if (US_UNIT_TIME_ZONE.test(timeZone)) return 'US';
  return UK_TIME_ZONE.test(timeZone) ? 'GB' : '001';
}

const METERS_PER_FOOT = 0.3048;
const METERS_PER_YARD = 0.9144;
export const METERS_PER_MILE = 1609.344;

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

function lengthFormat(unit: 'meter' | 'kilometer' | ImperialLength['unit'], { locale, region }: DistanceFormatter,
  digits: Pick<Intl.NumberFormatOptions, 'minimumFractionDigits' | 'maximumFractionDigits'>): Intl.NumberFormat {
  return new Intl.NumberFormat(formatLocale(locale ?? 'en', region), { style: 'unit', unit, unitDisplay: 'short', ...digits });
}

function imperialFormat({ unit, maximumFractionDigits }: ImperialLength, formatter: DistanceFormatter): Intl.NumberFormat {
  return lengthFormat(unit, formatter, { maximumFractionDigits });
}

/**
 * "320 m" below a kilometre, "1.4 km" from there, as the language writes them (ICU, as the apps do: "1,4 km" in
 * French with its own space). With a decimal on every kilometre where the label keeps its width: "1.0 km".
 */
export function formatMetricLength(meters: number, formatter: DistanceFormatter, keepDecimal = false): string {
  return meters < 1000
    ? lengthFormat('meter', formatter, { maximumFractionDigits: 0 }).format(Math.round(meters))
    : lengthFormat('kilometer', formatter, { minimumFractionDigits: keepDecimal ? 1 : 0, maximumFractionDigits: 1 }).format(meters / 1000);
}

/** The same figure in two parts, for where the unit is set smaller than the number. */
export function distanceParts(meters: number, formatter: DistanceFormatter): { value: string; unit: string } {
  const system = formatterSystem(formatter);
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
  const system = formatterSystem(formatter);
  if (system === 'metric') return formatMetricLength(meters, formatter);
  const length = imperialLength(meters, system);
  return imperialFormat(length, formatter).format(length.value);
}

/** A whole number of kilometres, or of miles where lengths are in miles: "5 km", "3 mi". */
export function formatWholeLength(count: number, formatter: DistanceFormatter): string {
  const unit = formatterSystem(formatter) === 'metric' ? 'kilometer' : 'mile';
  return lengthFormat(unit, formatter, { maximumFractionDigits: 0 }).format(count);
}

/** A city's distance in whole kilometres, or whole miles, never 0: "Bern · 61 km", "Bern · 38 mi". */
export function formatCityDistance(meters: number, formatter: DistanceFormatter): string {
  const unit = formatterSystem(formatter) === 'metric' ? 1000 : METERS_PER_MILE;
  return formatWholeLength(Math.max(1, Math.round(meters / unit)), formatter);
}
