import { describe, expect, it } from 'vitest';
import { PROVIDERS } from '@/generated/providers';
import { LANDING_NEAREST, LANDING_SCOOTERS_NEARBY, LANDING_SNAPSHOT_DATE } from '@/lib/landingSnapshot';

describe('the snapshot behind the landing page', () => {
  it('lists each provider once, nearest first', () => {
    const providers = LANDING_NEAREST.map(scooter => scooter.provider);
    expect(new Set(providers).size).toBe(providers.length);
    for (const provider of providers) expect(PROVIDERS[provider]).toBeDefined();

    const distances = LANDING_NEAREST.map(scooter => scooter.distanceM);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });

  it('opens on a scooter the page can price and walk to', () => {
    const [nearest] = LANDING_NEAREST;
    expect(nearest.pricing).not.toBeNull();
    expect(nearest.shows).toContain('walk');
  });

  it('only shows a fact the provider published', () => {
    for (const scooter of LANDING_NEAREST) {
      expect(scooter.shows.length).toBeGreaterThan(0);
      if (scooter.shows.includes('battery')) expect(scooter.battery).not.toBeNull();
      if (scooter.shows.includes('range')) expect(scooter.rangeM).not.toBeNull();
      if (scooter.shows.includes('price')) expect(scooter.pricing).not.toBeNull();
    }
  });

  it('has the count of its captures, and a day', () => {
    expect(LANDING_SCOOTERS_NEARBY).toBeGreaterThan(0);
    expect(LANDING_SNAPSHOT_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(LANDING_SNAPSHOT_DATE))).toBe(false);
  });
});
