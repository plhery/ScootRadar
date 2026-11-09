import { describe, expect, it } from 'vitest';
import { batteryLevel } from '@/lib/battery';

describe('batteryLevel', () => {
  it('is good from 50, low from 20 to 49 and critical below 20', () => {
    expect(batteryLevel(100)).toBe('good');
    expect(batteryLevel(50)).toBe('good');
    expect(batteryLevel(49)).toBe('low');
    expect(batteryLevel(20)).toBe('low');
    expect(batteryLevel(19)).toBe('critical');
    expect(batteryLevel(0)).toBe('critical');
  });
});
