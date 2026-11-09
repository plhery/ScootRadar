import { describe, expect, it } from 'vitest';
import { passesMinimums } from '@/lib/range';

describe('passesMinimums', () => {
  const scooter = (battery: number | null, range_m: number | null) => ({ battery, range_m });

  it('lets every scooter through without a minimum, those that say nothing too', () => {
    expect(passesMinimums(scooter(null, null), { minBattery: 0, minRange: 0 })).toBe(true);
    expect(passesMinimums(scooter(null, null), { minBattery: 0 })).toBe(true);
  });

  it('keeps a scooter whose range reaches the minimum, and leaves out one that does not say its range', () => {
    expect(passesMinimums(scooter(null, 5000), { minBattery: 0, minRange: 5000 })).toBe(true);
    expect(passesMinimums(scooter(90, 4999), { minBattery: 0, minRange: 5000 })).toBe(false);
    expect(passesMinimums(scooter(90, null), { minBattery: 0, minRange: 5000 })).toBe(false);
  });

  it('keeps a scooter whose battery reaches the minimum, whatever its range', () => {
    expect(passesMinimums(scooter(60, null), { minBattery: 60, minRange: 0 })).toBe(true);
    expect(passesMinimums(scooter(null, 30_000), { minBattery: 60, minRange: 0 })).toBe(false);
  });

  it('asks for both when both are set, as only the API may be asked', () => {
    expect(passesMinimums(scooter(60, 5000), { minBattery: 60, minRange: 5000 })).toBe(true);
    expect(passesMinimums(scooter(60, null), { minBattery: 60, minRange: 5000 })).toBe(false);
  });
});
