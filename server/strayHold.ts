import type { Vehicle } from '../src/generated/scooterApi';
import type { FeedSnapshot } from '../src/lib/scooterSnapshots';

// 3electra puts some of Kyiv's scooters in Lima for a while, by the hundred at times, and they come
// back metres from where they left (ukrainian-scooter-feeds.md). Each keeps its last place in its
// town for ten minutes, so the city's count doesn't fall with every hop, and is then dropped.
export const STRAY_HOLD_MS = 10 * 60_000;

interface Collected {
  vehicles: Vehicle[];
  skipped?: boolean;
  /** The ids of the vehicles the feed put far from its system (scooterFeeds.ts). */
  strayIds?: string[];
}

/** Keeps, for a while, a feed's vehicles that it puts far away at their last place in its town. */
export function createStrayHold(holdMs = STRAY_HOLD_MS) {
  // For each feed, when each vehicle held now left its town: its last collection there.
  const heldSince = new Map<string, Map<string, number>>();
  return function hold<T extends Collected>(feedId: string, collected: T, old: FeedSnapshot | undefined, now: number): T {
    const since = heldSince.get(feedId);
    heldSince.delete(feedId);
    if (!collected.strayIds?.length || collected.skipped || !old) return collected;
    const strays = new Set(collected.strayIds);
    const present = new Set(collected.vehicles.map(vehicle => vehicle.vehicle_id));
    const held = new Map<string, number>();
    const kept = old.vehicles.filter(vehicle => {
      const id = vehicle.vehicle_id;
      if (!id || !strays.has(id) || present.has(id)) return false;
      const left = since?.get(id) ?? old.collectedAt ?? old.observedAt;
      if (now - left >= holdMs) return false;
      held.set(id, left);
      return true;
    });
    if (!kept.length) return collected;
    heldSince.set(feedId, held);
    return { ...collected, vehicles: [...collected.vehicles, ...kept] };
  };
}
