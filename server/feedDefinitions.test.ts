import { expect, it } from 'vitest';
import { feedsForQuery, type FeedSnapshot, type MobilitySnapshot } from '../src/lib/scooterSnapshots';
import { registerFeedDefinitions } from './feedDefinitions';

const definition = { id: 'romania:test', source: 'romania' as const, provider: 'lime' as const, coverage: [
  { south: 0, north: .5, west: 0, east: .5 },
  { south: 1.5, north: 2, west: 1.5, east: 2 },
] };

it('replaces restored coverage immediately without refreshing its scooter observations', () => {
  const previous: FeedSnapshot = { ...definition, coverage: [{ south: 0, north: 2, west: 0, east: 2 }],
    vehicles: [{ provider: 'lime', vehicle_id: 'known', lat: .2, lng: .2, battery: 80,
      range_m: null, deep_link: null, distance_m: null }],
    observedAt: 100, attemptedAt: 120, collectedAt: 130, stale: false, failed: false, skipped: false };
  const records = new Map([[definition.id, previous]]);
  const snapshot = (): MobilitySnapshot => ({ version: 1, updatedAt: 140, feeds: [...records.values()],
    overview: { generatedAt: 140, feedIds: [definition.id], cities: [] } });
  const query = { origin: null, minBattery: 0, bounds: { south: .9, north: 1.1, west: .9, east: 1.1 } };
  expect(feedsForQuery(snapshot(), query, 18)).toHaveLength(1);
  registerFeedDefinitions(records, [definition]);
  expect(feedsForQuery(snapshot(), query, 18)).toHaveLength(0);
  expect(feedsForQuery(snapshot(), { ...query, bounds: definition.coverage[0] }, 18)).toHaveLength(1);
  expect(records.get(definition.id)).toMatchObject({ observedAt: 100, attemptedAt: 120, collectedAt: 130,
    stale: false, failed: false, skipped: false });
  expect(records.get(definition.id)?.vehicles).toBe(previous.vehicles);
});

it('keeps an unseen feed unavailable until its first successful collection', () => {
  const records = new Map<string, FeedSnapshot>();
  registerFeedDefinitions(records, [definition]);
  expect(records.get(definition.id)).toMatchObject({ coverage: definition.coverage, vehicles: [],
    observedAt: 0, attemptedAt: 0, stale: true, failed: true, skipped: false });
});
