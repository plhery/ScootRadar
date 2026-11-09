import { formatWholeLength, measurementSystem, METERS_PER_MILE, type DistanceFormatter, type MeasurementSystem } from '@/lib/walking';

// The filters' range minimum as the map shows it, kept in metres (range.ts filters by it): the website's alone,
// as battery.ts is for the battery's presets.

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
