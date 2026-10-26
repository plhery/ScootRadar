import type { CollectableScooterFeed } from '../src/lib/scooterFeeds';
import type { FeedSnapshot } from '../src/lib/scooterSnapshots';
import type { ParkingSnapshot } from '../src/lib/parking';

/**
 * How long a feed's collections take, smoothed over the last few so that one slow answer does not
 * make a quick feed slow (collectsSlowly in scooterSnapshots.ts).
 */
export const smoothedCollectionMs = (previous: number | undefined, took: number) =>
  Math.round(previous === undefined ? took : (2 * previous + took) / 3);

export async function collectSnapshotFeed(
  definition: CollectableScooterFeed,
  old: FeedSnapshot | undefined,
  publish: (record: FeedSnapshot) => void,
  collectParking?: () => Promise<ParkingSnapshot>,
) {
  const base = { id: definition.id, source: definition.source, provider: definition.provider, coverage: definition.coverage };
  let record: FeedSnapshot;
  const started = performance.now();
  try {
    const result = await definition.collect();
    record = { ...base, vehicles: result.vehicles, observedAt: result.observedAt ?? Date.now(),
      attemptedAt: Date.now(), collectedAt: Date.now(), stale: result.stale, failed: false, skipped: result.skipped ?? false,
      collectionMs: smoothedCollectionMs(old?.collectionMs, performance.now() - started),
      ...(result.seasonOver ? { seasonOver: true } : {}), parking: result.skipped ? undefined : old?.parking };
  } catch (error) {
    record = { ...base, vehicles: old?.vehicles ?? [], observedAt: old?.observedAt ?? 0,
      attemptedAt: Date.now(), collectedAt: old?.collectedAt, stale: true, failed: true, skipped: false,
      ...(old?.collectionMs !== undefined ? { collectionMs: old.collectionMs } : {}),
      // A failure says nothing of the season: a region closed for it stays closed.
      ...(old?.seasonOver ? { seasonOver: true } : {}), parking: old?.parking };
    console.warn(JSON.stringify({ event: 'snapshot_feed_failed', feed: definition.id,
      error: error instanceof Error ? error.message : String(error) }));
  }
  publish(record);
  // A skipped feed, as a region its operator has paused, has no parking either.
  if (!collectParking || record.skipped) return;
  try {
    record = { ...record, parking: await collectParking() };
  } catch (error) {
    record = { ...record, parking: old?.parking ? { ...old.parking, stale: true } : undefined };
    console.warn(JSON.stringify({ event: 'parking_feed_failed', feed: definition.id,
      error: error instanceof Error ? error.message : String(error) }));
  }
  publish(record);
}
