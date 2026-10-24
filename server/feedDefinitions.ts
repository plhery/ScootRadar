import type { CollectableScooterFeed } from '../src/lib/scooterFeeds';
import type { FeedSnapshot } from '../src/lib/scooterSnapshots';

type Definition = Pick<CollectableScooterFeed, 'id' | 'source' | 'provider' | 'coverage'>;

/** Restored observations keep their age; reviewed coverage comes from the current catalog. */
export function registerFeedDefinitions(records: Map<string, FeedSnapshot>, definitions: readonly Definition[]) {
  for (const definition of definitions) {
    const previous = records.get(definition.id);
    records.set(definition.id, previous ? { ...previous, coverage: definition.coverage } : {
      id: definition.id, source: definition.source, provider: definition.provider,
      coverage: definition.coverage, vehicles: [], observedAt: 0, attemptedAt: 0,
      stale: true, failed: true, skipped: false,
    });
  }
}
