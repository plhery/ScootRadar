import { PROVIDERS, PROVIDER_KEYS } from '@/generated/providers';
import { formatLocale } from '@/lib/formatLocale';
import { batteryNeeded, DEFAULT_BATTERY_RANGE_M } from '@/lib/range';
import type { UiTextFormatter } from '@/lib/uiText';
import { formatWholeLength, measurementSystem, METERS_PER_MILE, type DistanceFormatter, type MeasurementSystem } from '@/lib/walking';

// The filters' range minimum as the map shows it, kept in metres (range.ts filters by it), and the paragraph
// under its slider: the website's alone.

/**
 * The slider of the range minimum: whole kilometres up to 30, or whole miles up to 20 where lengths
 * are in miles. Its 0 is "Any".
 */
export interface RangeScale {
  unit: 'kilometer' | 'mile';
  /** The slider's last step. */
  max: number;
}

export function rangeScale(system: MeasurementSystem): RangeScale {
  return system === 'metric' ? { unit: 'kilometer', max: 30 } : { unit: 'mile', max: 20 };
}

/** The metres of that many steps: 5 km is 5,000 m, 3 mi 4,828 m. */
export function rangeStepsMeters(steps: number, system: MeasurementSystem): number {
  return system === 'metric' ? steps * 1000 : Math.round(steps * METERS_PER_MILE);
}

/**
 * The slider's step of a minimum kept in metres: the nearest whole kilometre or mile, no further
 * than the slider's end. 0 for none, or for what is not a number.
 */
export function rangeSteps(meters: number, system: MeasurementSystem): number {
  if (Number.isNaN(meters) || meters <= 0) return 0;
  const step = system === 'metric' ? 1000 : METERS_PER_MILE;
  return Math.min(rangeScale(system).max, Math.round(meters / step));
}

/**
 * A minimum kept in metres as it is shown, filtered by and sent: on a whole step of the units now
 * in use, so that after 5 km in kilometres, "3 mi+" in miles means the 4,828 m of 3 miles.
 */
export function snapMinimumRange(meters: number, system: MeasurementSystem): number {
  return rangeStepsMeters(rangeSteps(meters, system), system);
}

/** "5 km" or "3 mi", the minimum as the slider has it; null for none, which reads as the translated "Any". */
export function formatMinimumRange(meters: number, formatter: DistanceFormatter): string | null {
  const steps = rangeSteps(meters, measurementSystem(formatter.region, formatter.units));
  return steps === 0 ? null : formatWholeLength(steps, formatter);
}

/**
 * The paragraph under the slider while a minimum is set, null for Any: the battery that the scooters
 * saying only their battery need, of each app switched on among the answer's batteryRanges, grouped by
 * that battery from the lowest, "Scooters that only report a battery need at least 9% (Voi), 21% (Bolt)
 * and 53% (Lime)."; the apps of those even a full battery may not take that far, which are all hidden;
 * and last, always, that the scooters saying neither are hidden. Apps go in the filters' order, the lists
 * in the page's language ("Jet and Beam", "Jet und Beam").
 */
export function rangeFilterHelp(minRange: number, batteryRanges: Readonly<Record<string, number>>,
  enabled: (provider: string) => boolean, formatter: UiTextFormatter): string | null {
  if (minRange <= 0) return null;
  const { t, formatNumber } = formatter;
  const list = new Intl.ListFormat(formatLocale(formatter.locale, formatter.region), { style: 'long', type: 'conjunction' });
  const apps = PROVIDER_KEYS.filter(key => Object.hasOwn(batteryRanges, key) && enabled(key));
  const needed = new Map<number, string[]>();
  const hidden: string[] = [];
  for (const key of apps) {
    const percent = batteryNeeded(minRange, batteryRanges[key] ?? DEFAULT_BATTERY_RANGE_M);
    if (percent > 100) hidden.push(PROVIDERS[key].name);
    else needed.set(percent, [...needed.get(percent) ?? [], PROVIDERS[key].name]);
  }
  const sentences: string[] = [];
  if (needed.size) {
    const items = [...needed].sort(([a], [b]) => a - b)
      .map(([percent, names]) => t('filter.batteryOnlyItem', { percent: formatNumber(percent), apps: list.format(names) }));
    sentences.push(t('filter.batteryOnly', { items: list.format(items) }));
  }
  if (hidden.length) {
    sentences.push(t('filter.batteryOnlyHidden', { apps: list.format(hidden), length: formatMinimumRange(minRange, formatter) ?? '' }));
  }
  sentences.push(t('filter.rangeHelp'));
  return sentences.join(' ');
}
