import type { Vehicle } from '../src/generated/scooterApi';
import type { FeedSnapshot } from '../src/lib/scooterSnapshots';

// 3electra puts some of Kyiv's scooters in Lima for a while, by the hundred at times, and they come
// back metres from where they left (ukrainian-scooter-feeds.md). Each keeps its last place in its
// town for ten minutes from the first collection that finds it far away, so the city's count doesn't
// fall with every hop, and is then dropped. A feed nobody looks at is collected every 20 minutes,
// so there it is held until the next collection.
export const STRAY_HOLD_MS = 10 * 60_000;

interface Collected {
  vehicles: Vehicle[];
  skipped?: boolean;
  /** The ids of the vehicles the feed put far from its system (scooterFeeds.ts). */
  strayIds?: string[];
}

/** Keeps, for a while, a feed's vehicles that it puts far away at their last place in its town. */
export function createStrayHold(holdMs = STRAY_HOLD_MS) {
  // For each feed, when each vehicle held now was first found far away.
  const heldSince = new Map<string, Map<string, number>>();
  return function hold<T extends Collected>(feedId: string, collected: T, old: FeedSnapshot | undefined, now: number): T {
    const since = heldSince.get(feedId);
    heldSince.delete(feedId);
    // A failed feed's last scooters may be hours old: none is held from them.
    if (!collected.strayIds?.length || collected.skipped || !old || old.failed) return collected;
    const strays = new Set(collected.strayIds);
    const present = new Set(collected.vehicles.map(vehicle => vehicle.vehicle_id));
    const held = new Map<string, number>();
    const kept = old.vehicles.filter(vehicle => {
      const id = vehicle.vehicle_id;
      if (!id || !strays.has(id) || present.has(id)) return false;
      const strayed = since?.get(id) ?? now;
      if (now - strayed >= holdMs) return false;
      held.set(id, strayed);
      return true;
    });
    if (!kept.length) return collected;
    heldSince.set(feedId, held);
    return { ...collected, vehicles: [...collected.vehicles, ...kept] };
  };
}
