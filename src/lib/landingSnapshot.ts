import type { ProviderKey } from '@/generated/providers';
import type { RidePricing } from '@/lib/types';

// What /api/scooters listed by Zürich main station (47.3763, 8.5395) on the day
// below: the nearest vehicle of each provider there. The landing page quotes
// these figures and dates them; nothing on it is live. They are the scooters in
// its pictures: scripts/generate-landing-images.mjs takes both at once and
// prints these, so the two change together.

export type LandingNearestFact = 'walk' | 'battery' | 'range' | 'price' | 'bike';

export interface LandingNearest {
  provider: ProviderKey;
  /** The name as the page writes it: the catalogue's name of PubliBike is longer. */
  name: string;
  distanceM: number;
  /** Percent; null where the provider does not publish it. */
  battery: number | null;
  rangeM: number | null;
  pricing: RidePricing | null;
  /** What its card says under the name, in this order. */
  shows: readonly LandingNearestFact[];
}

export const LANDING_SNAPSHOT_DATE = '2026-10-11';

const CHF = (unlock: number, minute: number): RidePricing => ({
  currency: 'CHF',
  unlock_fee_minor_units: unlock,
  minute_fee_minor_units: minute,
});

/** Nearest first. The first one is the scooter the page then follows. */
export const LANDING_NEAREST: readonly LandingNearest[] = [
  { provider: 'bolt', name: 'Bolt', distanceM: 63, battery: 20, rangeM: 8_400, pricing: CHF(100, 42), shows: ['walk', 'range'] },
  { provider: 'publibike', name: 'PubliBike', distanceM: 70, battery: null, rangeM: null, pricing: null, shows: ['bike'] },
  { provider: 'lime', name: 'Lime', distanceM: 81, battery: null, rangeM: 23_303, pricing: null, shows: ['range'] },
  { provider: 'bird', name: 'Bird', distanceM: 91, battery: 56, rangeM: 18_914, pricing: null, shows: ['battery', 'range'] },
  { provider: 'voi', name: 'Voi', distanceM: 114, battery: null, rangeM: 43_200, pricing: CHF(100, 42), shows: ['price'] },
  { provider: 'hopp', name: 'Hopp', distanceM: 126, battery: 71, rangeM: 26_000, pricing: CHF(100, 40), shows: ['battery', 'price'] },
  { provider: 'dott', name: 'Dott', distanceM: 131, battery: 94, rangeM: 59_096, pricing: null, shows: ['battery', 'range'] },
];

// The scooters in view on the dark map (public/landing/*-dark.webp), which its
// "All" chip counts in every language: the headline repeats the number beside it.
export const LANDING_SCOOTERS_NEARBY = 110;
