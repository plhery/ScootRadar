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

/**
 * The catalog, asked for again after `pauseMs` if the first try fails, as a fetch is when its body
 * comes back cut off. sharedmobility.ch's registry answered a single 504 as the cache started on
 * 25 October 2026, and the next try, a minute later, took it. A second failure is thrown, for the
 * caller to report.
 */
export async function discoverOnceMore<T>(discover: () => Promise<T>, pauseMs: number, onRetry: (error: unknown) => void): Promise<T> {
  try {
    return await discover();
  } catch (error) {
    onRetry(error);
    await new Promise(resolve => setTimeout(resolve, pauseMs));
    return discover();
  }
}
