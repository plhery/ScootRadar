import type { ProviderKey } from '@/generated/providers';
import type { RidePricing } from '@/lib/types';

// What /api/scooters listed by Zürich main station (47.3763, 8.5395) on the day
// below: the nearest vehicle of each provider there. The landing page quotes
// these figures and dates them; nothing on it is live.

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
  { provider: 'voi', name: 'Voi', distanceM: 60, battery: null, rangeM: 49_600, pricing: CHF(100, 42), shows: ['walk', 'range'] },
  { provider: 'lime', name: 'Lime', distanceM: 62, battery: null, rangeM: 39_268, pricing: null, shows: ['range'] },
  { provider: 'publibike', name: 'PubliBike', distanceM: 70, battery: null, rangeM: null, pricing: null, shows: ['bike'] },
  { provider: 'bolt', name: 'Bolt', distanceM: 70, battery: 80, rangeM: 50_400, pricing: CHF(100, 42), shows: ['battery', 'price'] },
  { provider: 'bird', name: 'Bird', distanceM: 108, battery: 56, rangeM: 18_914, pricing: null, shows: ['battery', 'range'] },
  { provider: 'hopp', name: 'Hopp', distanceM: 126, battery: 72, rangeM: 26_400, pricing: CHF(100, 40), shows: ['battery', 'price'] },
  { provider: 'dott', name: 'Dott', distanceM: 137, battery: 94, rangeM: 59_096, pricing: null, shows: ['battery', 'range'] },
];

// The number in the panel of each language's capture of the dark map
// (public/landing/*-dark.webp): the headline repeats the one beside it.
export const LANDING_SCOOTERS_NEARBY = { en: 96, de: 94, fr: 93, it: 93 } as const;
