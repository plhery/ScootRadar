/** Green, amber and red on both platforms. */
export type BatteryLevel = 'good' | 'low' | 'critical';

export function batteryLevel(percent: number): BatteryLevel {
  if (percent >= 50) return 'good';
  return percent >= 20 ? 'low' : 'critical';
}
