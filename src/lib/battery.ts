import { METERS_PER_MILE, formatWholeLength, measurementSystem, type DistanceFormatter } from '@/lib/walking';

/** The minimum-battery choices of the filter. 0 is "Any". */
export const BATTERY_PRESETS = [0, 30, 60, 80] as const;
export type BatteryPreset = (typeof BATTERY_PRESETS)[number];

/** The highest preset the value reaches, so a stored 45 keeps showing everything from 30. */
export function snapBatteryPreset(value: number): BatteryPreset {
  let snapped: BatteryPreset = 0;
  for (const preset of BATTERY_PRESETS) {
    if (value >= preset) snapped = preset;
  }
  return snapped;
}

/** "30%+", the same in every language. Null for 0, which reads as the translated "Any". */
export function batteryPresetLabel(preset: BatteryPreset): string | null {
  return preset === 0 ? null : `${preset}%+`;
}

/** Green, amber and red on both platforms. */
export type BatteryLevel = 'good' | 'low' | 'critical';

export function batteryLevel(percent: number): BatteryLevel {
  if (percent >= 50) return 'good';
  return percent >= 20 ? 'low' : 'critical';
}

/** How far a battery level usually takes the scooters chosen in view, in metres (batteryReach). */
export interface BatteryReach {
  /** The shortest and the longest of their apps'. */
  low: number;
  high: number;
  /** Their apps' weighed by their scooters in view. */
  mean: number;
}

/**
 * How far `level`% usually takes the scooters in view of the apps switched on, from each app's usual
 * range on a full battery (response.fullRanges) and its scooters in view (`counts`). An app with under a
 * tenth of them is left out unless it has the most, so a handful of another app's at the edge of the
 * view doesn't stretch the line. Null when no app switched on in view has a full range.
 */
export function batteryReach(level: number, fullRanges: Readonly<Record<string, number>>,
  counts: Readonly<Record<string, number>>, enabled: (provider: string) => boolean): BatteryReach | null {
  const apps = Object.entries(fullRanges)
    .filter(([provider, meters]) => meters > 0 && enabled(provider) && (counts[provider] ?? 0) > 0)
    .map(([provider, meters]) => ({ meters, count: counts[provider] }));
  if (!apps.length) return null;
  const total = apps.reduce((sum, app) => sum + app.count, 0);
  const most = Math.max(...apps.map(app => app.count));
  const kept = apps.filter(app => app.count * 10 >= total || app.count === most);
  const scale = level / 100;
  const weight = kept.reduce((sum, app) => sum + app.count, 0);
  return {
    low: Math.min(...kept.map(app => app.meters)) * scale,
    high: Math.max(...kept.map(app => app.meters)) * scale,
    mean: kept.reduce((sum, app) => sum + app.meters * app.count, 0) / weight * scale,
  };
}

/**
 * "45 km", or "12–80 km" where the longest is over a quarter longer than the shortest: in whole
 * kilometres, or miles where lengths are in miles, never 0.
 */
export function formatBatteryReach(reach: BatteryReach, formatter: DistanceFormatter): string {
  const unit = measurementSystem(formatter.region, formatter.units) === 'metric' ? 1000 : METERS_PER_MILE;
  const whole = (meters: number) => Math.max(1, Math.round(meters / unit));
  const low = whole(reach.low);
  const high = whole(reach.high);
  if (high * 4 <= low * 5) return formatWholeLength(whole(reach.mean), formatter);
  return `${formatter.formatNumber(low)}–${formatWholeLength(high, formatter)}`;
}
