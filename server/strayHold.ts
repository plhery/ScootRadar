import type { Vehicle } from '../src/generated/scooterApi';
import type { FeedSnapshot } from '../src/lib/scooterSnapshots';

// 3electra puts some of Kyiv's scooters in Lima for a while, by the hundred at times, and they come
// back metres from where they left (ukrainian-scooter-feeds.md). Each keeps its last place in its
// town from the first collection that finds it far away, so the city's count doesn't fall with every
// hop, and is then dropped: for ten minutes, or until the feed's next collection when the feed is
// collected less often, by its interval when that collection found it. A feed nobody looks at is
// collected every 20 minutes, so a scooter found far away then is still held when someone opens the
// map ten minutes later.
export const STRAY_HOLD_MS = 10 * 60_000;
// Collections end a few seconds either side of an interval apart, so a hold of one interval less
// this ends at the next.
const COLLECTION_SLACK_MS = 60_000;

interface Collected {
  vehicles: Vehicle[];
  skipped?: boolean;
  /** The ids of the vehicles the feed put far from its system (scooterFeeds.ts). */
  strayIds?: string[];
}

/**
 * Keeps, for a while, a feed's vehicles that it puts far away at their last place in its town.
 * `intervalMs` is how often the feed is collected now: every minute when someone looks, else
 * every 20 minutes (feedScheduler.ts).
 */
export function createStrayHold(intervalMs: (feedId: string, now: number) => number, holdMs = STRAY_HOLD_MS) {
  // For each feed, until when each vehicle held now is held.
  const heldUntil = new Map<string, Map<string, number>>();
  return function hold<T extends Collected>(feedId: string, collected: T, old: FeedSnapshot | undefined, now: number): T {
    const until = heldUntil.get(feedId);
    heldUntil.delete(feedId);
    // A failed feed's last scooters may be hours old: none is held from them.
    if (!collected.strayIds?.length || collected.skipped || !old || old.failed) return collected;
    const strays = new Set(collected.strayIds);
    const present = new Set(collected.vehicles.map(vehicle => vehicle.vehicle_id));
    let firstFound: number | undefined;
    const held = new Map<string, number>();
    const kept = old.vehicles.filter(vehicle => {
      const id = vehicle.vehicle_id;
      if (!id || !strays.has(id) || present.has(id)) return false;
      const end = until?.get(id) ?? (firstFound ??= now + Math.max(holdMs, intervalMs(feedId, now) - COLLECTION_SLACK_MS));
      if (now >= end) return false;
      held.set(id, end);
      return true;
    });
    if (!kept.length) return collected;
    heldUntil.set(feedId, held);
    return { ...collected, vehicles: [...collected.vehicles, ...kept] };
  };
}
