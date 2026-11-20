import { activeCurfew } from '@/lib/rentalCurfews';
import { RENTAL_CURFEWS } from '@/lib/rentalCurfewCatalog';
import { serviceAreas, type RegionalScooterSystem } from '@/lib/regionalScooterSystems';
import { SYSTEMS_BY_FEED } from '@/lib/seasonalPauses';

// The night bans of the feeds' cities, as the cache reads them: apart from seasonalPauses.ts, whose
// pauses the map page reads at once, so that the bans' boundaries (rentalCurfewCatalog.ts) are not part of it.

/**
 * Whether a night ban holds at every one of the feed's service areas (rentalCurfews.ts): its
 * operator may then take the feed down until morning, as Dott takes Trondheim's on Friday and
 * Saturday nights, while Entur keeps serving its last positions. The map already says renting is
 * banned; the alerts wait for the morning.
 */
export function feedCurfewed(feedId: string, now: number, systems: ReadonlyMap<string, RegionalScooterSystem> = SYSTEMS_BY_FEED): boolean {
  const system = systems.get(feedId);
  return !!system && serviceAreas(system).every(area => activeCurfew(area.center, now, RENTAL_CURFEWS) !== null);
}

/**
 * When the first night ban in force then at one of the feed's service areas ends, if one is: an
 * operator hides its scooters in the ban, so a collection then finds none where they stand by morning.
 */
export function feedCurfewEnds(feedId: string, now: number, systems: ReadonlyMap<string, RegionalScooterSystem> = SYSTEMS_BY_FEED): number | undefined {
  const system = systems.get(feedId);
  const ends = system ? serviceAreas(system).flatMap(area => activeCurfew(area.center, now, RENTAL_CURFEWS)?.until ?? []) : [];
  return ends.length ? Math.min(...ends) : undefined;
}
