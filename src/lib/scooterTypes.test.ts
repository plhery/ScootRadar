import { describe, expect, it } from 'vitest';
import { isElectricScooter } from './scooterTypes';

const type = (form_factor: string, propulsion_type: string) => ({ vehicle_type_id: 't', form_factor, propulsion_type });

describe('isElectricScooter', () => {
  it('reads standing scooters with a motor, never bicycles or seated mopeds', () => {
    expect(isElectricScooter(type('scooter', 'electric'), 'dott')).toBe(true);
    expect(isElectricScooter(type('scooter_standing', 'electric'), 'bolt')).toBe(true);
    expect(isElectricScooter(type('scooter_seated', 'electric'), 'bolt')).toBe(false);
    expect(isElectricScooter(type('bicycle', 'electric'), 'lime')).toBe(false);
    expect(isElectricScooter(type('scooter', 'human'), 'dott')).toBe(false);
    expect(isElectricScooter(undefined, 'dott')).toBe(false);
  });
  it("reads Zeus's electric_assist scooters as electric, and no other provider's", () => {
    expect(isElectricScooter(type('scooter', 'electric_assist'), 'zeus')).toBe(true);
    expect(isElectricScooter(type('bicycle', 'electric_assist'), 'zeus')).toBe(false);
    expect(isElectricScooter(type('scooter', 'electric_assist'), 'dott')).toBe(false);
    expect(isElectricScooter(type('scooter', 'electric_assist'), null)).toBe(false);
  });
});
